// Rule-based "AI" engine for IntelliPath.
//
// There is intentionally no external LLM dependency here so the demo runs
// offline and free. The engine parses natural-language prompts, looks up live
// database records, and applies the cybersecurity level rule. Swap the
// `answerQuestion` body with a call to Claude/DeepSeek/OpenAI later without
// changing the API contract.
import {
  canAccess,
  findPersonByName,
  findResourceByName,
  listPeople,
  listResources,
  listRecommendations,
  listPermissionRequests,
} from "./db.js";

const DEFAULT_USER = "PER-00125";

function buildAccessChecks(db, person) {
  const resources = listResources(db);
  // Show the person's own assignment resource first, plus a clear "denied"
  // example when one exists, then the rest.
  const own = resources.find((r) =>
    person.assignment.toLowerCase().includes(r.name.toLowerCase())
  );
  const denied = resources.find((r) => !canAccess(person.cyber_level, r.required_level));
  const ordered = [
    ...(own ? [own] : []),
    ...(denied && denied.id !== own?.id ? [denied] : []),
    ...resources.filter((r) => r.id !== own?.id && r.id !== denied?.id),
  ];
  return ordered.slice(0, 6).map((r) => ({
    resourceId: r.id,
    resourceName: r.name,
    requiredLevel: r.required_level,
    userLevel: person.cyber_level,
    allowed: canAccess(person.cyber_level, r.required_level),
  }));
}

function summaryReply(db) {
  const resources = listResources(db);
  const people = listPeople(db);
  const requests = listPermissionRequests(db);
  const recs = listRecommendations(db);
  const active = resources.filter((r) => r.status === "Active").length;
  const offline = resources.filter((r) => r.status === "Offline").length;
  return (
    `Here is the current operational summary:\n` +
    `• ${resources.length} tracked resources (${active} active, ${offline} offline)\n` +
    `• ${people.length} personnel records on file\n` +
    `• ${requests.length} open permission request(s)\n` +
    `• ${recs.length} AI recommendations pending review\n` +
    `Highest-risk item: ${resources.find((r) => r.risk === "High")?.name || "none"}.`
  );
}

export function answerQuestion(db, prompt = "") {
  const q = String(prompt || "").toLowerCase();

  // 1) Person lookup — match any known name.
  const people = listPeople(db);
  const person = people.find((p) => q.includes(p.name.toLowerCase()));

  if (person) {
    const resourceMatch = listResources(db).find((r) =>
      q.includes(r.name.toLowerCase())
    );
    const accessChecks = buildAccessChecks(db, person);
    const denied = accessChecks.filter((c) => !c.allowed);
    const rule =
      "Rule applied: Level 7 can access Level 7 and below. A user can access a resource only when their cybersecurity level is equal to or higher than the resource's required level.";

    let reply;
    if (resourceMatch) {
      const allowed = canAccess(person.cyber_level, resourceMatch.required_level);
      reply =
        `${person.name} is an active ${person.type.toLowerCase()} from ${person.company} ` +
        `assigned to ${person.assignment} at ${person.site}. ` +
        `Cybersecurity level is Level ${person.cyber_level}. ` +
        `For ${resourceMatch.name} (required Level ${resourceMatch.required_level}), access is ` +
        `${allowed ? "ALLOWED" : "DENIED"}.`;
    } else {
      reply =
        `${person.name} (${person.type}, ${person.company}) is assigned to ${person.assignment} at ${person.site}, ` +
        `cybersecurity level ${person.cyber_level}, valid until ${person.valid_until}. ` +
        `They can access Level ${person.cyber_level} and below; ` +
        `${denied.length ? `${denied.length} tracked resource(s) are above their clearance.` : "no tracked resource exceeds their clearance."}`;
    }

    return { reply, person, accessChecks, rule };
  }

  // 2) Summaries / reports.
  if (/(summary|report|overview|status of|daily)/.test(q)) {
    return { reply: summaryReply(db), person: null, accessChecks: null, rule: null };
  }

  // 3) Resource status.
  if (/(resource|asset|system)/.test(q)) {
    const resources = listResources(db);
    const lines = resources
      .map((r) => `• ${r.name} — ${r.status} (${r.type}, Level ${r.required_level}, ${r.risk} risk)`)
      .join("\n");
    return {
      reply: `Tracked resources:\n${lines}`,
      person: null,
      accessChecks: null,
      rule: null,
    };
  }

  // 4) Access/level rule query.
  if (/(level|access|cybersecurity|clearance|rule)/.test(q)) {
    return {
      reply:
        "Access is granted only when a user's cybersecurity level is equal to or higher than the resource's required level. " +
        "Level 7 can access Levels 1–7 (including restricted infrastructure); Level 6 can access Levels 1–6; and so on down to Level 1.",
      person: null,
      accessChecks: null,
      rule: "User level ≥ resource required level.",
    };
  }

  // 5) Default — help.
  return {
    reply:
      "I can look up people and their assignments, check cybersecurity access levels, summarize operations, and list resource status. " +
      'Try: "Show John Tan resource assignment, cybersecurity level, and site location", "Summarize resource status", or "Check cybersecurity level".',
    person: null,
    accessChecks: null,
    rule: null,
  };
}

export { DEFAULT_USER };
