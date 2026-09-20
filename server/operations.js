import { SITES } from "./sites.js";

export const DEFAULT_SETTINGS = Object.freeze({
  aiMode: "auto",
  reportAppendix: true,
  reportLogs: true,
  searchPageSize: 20,
  alertSeverity: "warning",
  sessionHours: 24,
});
export const severityRank = { info: 0, warning: 1, high: 2, critical: 3 };
export const validLevel = (v) => Number.isInteger(v) && v >= 1 && v <= 7;
export function settings(db) {
  const raw = db
    .prepare("SELECT value FROM settings WHERE key='operations.v2'")
    .get();
  return { ...DEFAULT_SETTINGS, ...(raw ? JSON.parse(raw.value) : {}) };
}
export function saveSettings(db, value) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).some((k) => !(k in DEFAULT_SETTINGS))
  )
    throw new Error("Unknown settings field.");
  const s = { ...settings(db), ...value };
  if (
    !["auto", "local"].includes(s.aiMode) ||
    typeof s.reportAppendix !== "boolean" ||
    typeof s.reportLogs !== "boolean" ||
    ![10, 20, 50].includes(s.searchPageSize) ||
    !(s.alertSeverity in severityRank) ||
    !Number.isInteger(s.sessionHours) ||
    s.sessionHours < 1 ||
    s.sessionHours > 168
  )
    throw new Error("Invalid settings value.");
  db.prepare(
    "INSERT INTO settings VALUES ('operations.v2',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
  ).run(JSON.stringify(s));
  return s;
}
// All consumers start here, before search, counts, AI context or export.
export function snapshot(db, user) {
  const level = validLevel(user?.cyber_level) ? user.cyber_level : 1;
  const resources = db
    .prepare(
      "SELECT * FROM resources WHERE required_level BETWEEN 1 AND ? ORDER BY id",
    )
    .all(level);
  const people = db
    .prepare(
      "SELECT * FROM people WHERE required_level BETWEEN 1 AND ? ORDER BY id",
    )
    .all(level);
  const ids = new Set(resources.map((r) => r.id)),
    personIds = new Set(people.map((p) => p.id));
  const records = db
    .prepare(
      "SELECT * FROM knowledge_records WHERE required_level BETWEEN 1 AND ? ORDER BY updated_at DESC,id",
    )
    .all(level)
    .filter((r) => !r.resource_id || ids.has(r.resource_id));
  const logs = db
    .prepare(
      "SELECT l.*,r.required_level FROM system_logs l JOIN resources r ON r.id=l.device_id WHERE r.required_level BETWEEN 1 AND ? ORDER BY l.id DESC",
    )
    .all(level);
  const audit = db
    .prepare(
      "SELECT * FROM audit_logs WHERE required_level BETWEEN 1 AND ? ORDER BY id DESC",
    )
    .all(level);
  const requests = db
    .prepare("SELECT * FROM permission_requests ORDER BY id DESC")
    .all()
    .filter((r) => ids.has(r.resource_id) && personIds.has(r.requester_id))
    .map((r) => ({
      ...r,
      steps: db
        .prepare(
          "SELECT * FROM permission_steps WHERE request_id=? ORDER BY sort_order",
        )
        .all(r.id),
    }));
  return {
    level,
    resources,
    people,
    records,
    logs,
    audit,
    requests,
    sites: SITES,
  };
}
export function catalog(s) {
  return [
    ...s.resources.map((r) => ({
      id: r.id,
      kind: "Resource",
      title: r.name,
      site: r.location,
      required_level: r.required_level,
      status: r.status,
      detail: [
        r.type,
        r.owner,
        r.manufacturer,
        r.model,
        r.serial_number,
        r.ip_address,
        r.os,
        r.health,
      ]
        .filter(Boolean)
        .join(" | "),
      content: JSON.stringify(r),
      icon: "database",
    })),
    ...s.people.map((p) => ({
      id: p.id,
      kind: "Person",
      title: p.name,
      site: p.site,
      required_level: p.required_level,
      status: p.status,
      detail: `${p.company} | ${p.department} | ${p.assignment} | clearance L${p.cyber_level}`,
      content: JSON.stringify(p),
      icon: "users",
    })),
    ...s.records.map((r) => ({ ...r, detail: r.content, icon: "file" })),
    ...s.sites.map((s) => ({
      ...s,
      kind: "Location",
      title: s.name,
      site: s.name,
      status: "Published",
      detail: s.address,
      content: `${s.category} | ${s.phone} | ${s.source}`,
      icon: "map",
    })),
    ...s.logs.map((l) => ({
      id: `LOG-${l.id}`,
      kind: "Log",
      title: l.event_type,
      site: s.resources.find((r) => r.id === l.device_id)?.location,
      required_level: l.required_level,
      status: l.severity,
      detail: `${l.device_name} | ${l.timestamp} | ${l.message}`,
      content: l.message,
      icon: "file",
    })),
    ...s.audit.map((a) => ({
      id: `AUDIT-${a.id}`,
      kind: "Audit",
      title: a.action,
      site: "Platform",
      required_level: a.required_level,
      status: a.result,
      detail: `${a.user} | ${a.time} | ${a.category}`,
      content: a.action,
      icon: "file",
    })),
    ...s.requests.map((r) => ({
      id: `REQUEST-${r.id}`,
      kind: "Request",
      title: r.title,
      site: s.resources.find((x) => x.id === r.resource_id)?.location,
      required_level: s.resources.find((x) => x.id === r.resource_id)
        ?.required_level,
      status: r.overall_status,
      detail: r.steps.map((x) => `${x.step}: ${x.status}`).join(" | "),
      content: JSON.stringify(r),
      icon: "file",
    })),
  ];
}
export function searchRecords(
  s,
  { q = "", kind = "", site = "", page = 1, pageSize = 20 } = {},
) {
  const tokens =
    String(q)
      .trim()
      .toLowerCase()
      .match(/[\p{L}\p{N}_@.-]+/gu) || [];
  const matched = catalog(s)
    .filter((r) => (!kind || r.kind === kind) && (!site || r.site === site))
    .map((r) => {
      const title = `${r.id} ${r.title}`.toLowerCase(),
        text = `${title} ${r.site} ${r.detail} ${r.content}`.toLowerCase();
      const hits = tokens.filter((t) => text.includes(t));
      return {
        ...r,
        score: tokens.length
          ? hits.length * 10 +
            tokens.filter((t) => title.includes(t)).length * 5
          : 1,
      };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  const size = [10, 20, 50].includes(Number(pageSize)) ? Number(pageSize) : 20;
  const current = Math.max(
    1,
    Math.min(
      Math.ceil(matched.length / size) || 1,
      Math.trunc(Number(page)) || 1,
    ),
  );
  return {
    results: matched.slice((current - 1) * size, current * size),
    total: matched.length,
    page: current,
    pageSize: size,
    levels: `L1-L${s.level}`,
    facets: {
      kinds: [...new Set(catalog(s).map((r) => r.kind))],
      sites: [...new Set(catalog(s).map((r) => r.site))].filter(Boolean).sort(),
    },
  };
}
export function recommendations(s, config) {
  return s.records
    .filter(
      (r) =>
        r.kind === "Alert" &&
        severityRank[r.severity] >= severityRank[config.alertSeverity],
    )
    .map((r) => ({
      id: r.id,
      severity: severityRank[r.severity] >= 2 ? "danger" : "warning",
      title: r.title,
      detail: r.content,
    }));
}
export function metrics(s, config) {
  const open = s.records.filter(
    (r) => r.kind === "Incident" && !["closed", "resolved"].includes(r.status),
  );
  const alerts = s.records.filter(
    (r) =>
      r.kind === "Alert" &&
      severityRank[r.severity] >= severityRank[config.alertSeverity],
  );
  return {
    headline: {
      activeResources: s.resources.filter((r) => r.status === "Active").length,
      activeResourcesNote: `${s.resources.length} visible assets`,
      personnelOnSite: s.people.filter((p) => p.status === "Active").length,
      personnelOnSiteNote: "Active directory records; not live attendance",
      dailyOperations: open.length,
      dailyOperationsNote: "Open incidents in your clearance",
      aiInsights: alerts.length,
      aiInsightsNote: `Alerts at ${config.alertSeverity} severity or higher`,
    },
    resources: {
      tracked: s.resources.length,
      activePermissions: s.resources.filter(
        (r) => r.request_status === "Approved",
      ).length,
      highestLevel: s.level,
      pendingReviews: s.requests.filter((r) =>
        ["In Review", "Pending"].includes(r.overall_status),
      ).length,
    },
    security: {
      incidents: open,
      alerts,
      remediation: s.records.filter((r) => r.kind === "Remediation"),
      level: s.level,
    },
    generatedAt: new Date().toISOString(),
  };
}
