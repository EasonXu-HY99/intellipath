import { accessName } from "../shared/access.js";
import { AGENTS } from "./workspace.js";
import { searchRecords } from "./operations.js";

// Actual local delegation: discover specialist capabilities, run each scoped index,
// then combine ranked results. These are local search agents, not external Microsoft agents.
export function agentSearch(
  s,
  { q = "", agentId = "", kind = "", site = "", source = "", page = 1 } = {},
) {
  if (typeof q !== "string" || q.length > 4000)
    throw Object.assign(
      new Error("Search must contain at most 4000 characters."),
      { status: 400 },
    );
  if (agentId && !AGENTS.some((a) => a.id === agentId))
    throw Object.assign(new Error("Unknown agent."), { status: 400 });
  const lower = q.toLowerCase();
  const matches = AGENTS.filter(
    (a) =>
      a.terms.split(" ").some((t) => lower.includes(t)) ||
      lower.includes(a.name.toLowerCase()),
  );
  const chosen = agentId
    ? AGENTS.filter((a) => a.id === agentId)
    : kind
      ? AGENTS.filter((a) => a.kinds.includes(kind))
      : matches.length
        ? matches
        : AGENTS;
  const tasks = chosen.map((a) => {
    const partial = {
      ...s,
      resources: a.kinds.includes("Resource") ? s.resources : [],
      people: a.kinds.includes("Person") ? s.people : [],
      records: s.records.filter((r) => a.kinds.includes(r.kind)),
      sites: a.kinds.includes("Location") ? s.sites : [],
      logs: a.kinds.includes("Log") ? s.logs : [],
      audit: [],
      requests: [],
      excludeAgents: true,
    };
    const found = searchRecords(partial, {
      q,
      kind,
      site,
      source,
      pageSize: 50,
    });
    return { agent: a, found };
  });
  const combined = new Map();
  for (const { agent, found } of tasks)
    for (const r of found.results) {
      const existing = combined.get(r.id);
      if (existing) existing.foundBy.push(agent.name);
      else combined.set(r.id, { ...r, foundBy: [agent.name] });
    }
  const rows = [...combined.values()].sort(
    (a, b) => b.score - a.score || a.id.localeCompare(b.id),
  );
  const current = Math.max(
    1,
    Math.min(Math.ceil(rows.length / 20) || 1, Math.trunc(Number(page)) || 1),
  );
  return {
    results: rows.slice((current - 1) * 20, current * 20),
    total: rows.length,
    page: current,
    pageSize: 20,
    levels: accessName(s.level),
    plan: tasks.map(({ agent, found }) => ({
      id: agent.id,
      name: agent.name,
      source: agent.source,
      matches: found.total,
      returned: found.results.length,
      status: "Completed",
    })),
    summary: `Coordinator searched ${tasks.length} local specialist ${tasks.length === 1 ? "agent" : "agents"} and combined ${rows.length} authorized records. Each agent returns up to 50 matches; use direct search for the complete index. Microsoft sources are simulated.`,
    facets: searchRecords(s).facets,
  };
}
