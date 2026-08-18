// Seed demo data into the SQLite database. Idempotent: only runs when a
// table is empty, unless `force` is passed.

const RESOURCES = [
  { id: "AST-001", name: "Laptop-2491074", type: "Device", status: "Active", owner: "Feiyong Sun", location: "Tuas Yard", risk: "Low", permission: "Assigned", request_status: "Approved", required_level: 3 },
  { id: "AST-002", name: "Access Card-8812", type: "Badge", status: "Assigned", owner: "John Tan", location: "Main Gate", risk: "Low", permission: "Temporary Access", request_status: "Approved", required_level: 2 },
  { id: "AST-003", name: "Pump Unit-A12", type: "Equipment", status: "Maintenance", owner: "Maintenance Team", location: "Workshop", risk: "Medium", permission: "Maintenance Access", request_status: "In Review", required_level: 6 },
  { id: "AST-004", name: "Server-SG01", type: "Server", status: "Active", owner: "Infrastructure", location: "Data Room", risk: "Low", permission: "Restricted", request_status: "Not Requested", required_level: 7 },
  { id: "AST-005", name: "CCTV-CAM-21", type: "Camera", status: "Offline", owner: "Security Team", location: "Gate 3", risk: "High", permission: "Security Team Only", request_status: "Escalated", required_level: 5 },
];

const PEOPLE = [
  { id: "PER-00125", name: "John Tan", type: "Contractor", company: "ABC Engineering", site: "Tuas Yard", assignment: "Pump Unit-A12 Maintenance", status: "Active", valid_until: "2026-06-30", risk: "Low", cyber_level: 6 },
  { id: "PER-00126", name: "Mary Lim", type: "Employee", company: "Seatrium", site: "Main Office", assignment: "Operations Support", status: "Active", valid_until: "Permanent", risk: "Low", cyber_level: 4 },
  { id: "PER-00127", name: "Alan Goh", type: "Contractor", company: "TechServe", site: "Tuas Yard", assignment: "Network Maintenance", status: "Expiring", valid_until: "2026-05-18", risk: "Medium", cyber_level: 5 },
];

const PERMISSION_STEPS = [
  { step: "Request Submitted", owner: "Operations User", status: "Completed", note: "John Tan requested maintenance access for Pump Unit-A12." },
  { step: "Manager Review", owner: "Project Coordination Manager", status: "Completed", note: "Purpose and work order validated." },
  { step: "Permission Validation", owner: "System / Admin", status: "In Review", note: "Checking location, role, and access period." },
  { step: "Final Approval", owner: "Operations Admin", status: "Pending", note: "Awaiting approval before permission activation." },
  { step: "Access Activated", owner: "System", status: "Not Started", note: "Permission will be synced after approval." },
];

const AUDIT_LOGS = [
  { time: "09:58", user: "Haiyang Xu", action: "Updated maintenance assignment for John Tan", result: "Success" },
  { time: "09:55", user: "System", action: "Synced Microsoft Graph operational data", result: "Success" },
  { time: "09:50", user: "Admin", action: "Approved maintenance activity", result: "Success" },
  { time: "09:45", user: "John Tan", action: "Resource status updated", result: "Success" },
  { time: "09:40", user: "AI Assistant", action: "Generated operational summary", result: "Completed" },
  { time: "09:32", user: "System", action: "CCTV-CAM-21 health check failed", result: "Warning" },
];

const RECOMMENDATIONS = [
  { severity: "warning", title: "Review maintenance request", detail: "Maintenance workflow requires manager review." },
  { severity: "danger", title: "CCTV-CAM-21 offline", detail: "Create maintenance escalation to Security Team." },
  { severity: "info", title: "Resource utilization spike", detail: "AI recommends workload redistribution." },
];

const LEVEL_RULES = [
  { level: 7, scope: "Can access Level 1–7 resources, including restricted infrastructure." },
  { level: 6, scope: "Can access Level 1–6 resources. Cannot access Level 7 resources." },
  { level: 5, scope: "Can access Level 1–5 resources. Cannot access Level 6–7 resources." },
  { level: 4, scope: "Can access Level 1–4 resources. Cannot access Level 5–7 resources." },
  { level: 3, scope: "Can access Level 1–3 resources. Cannot access Level 4–7 resources." },
  { level: 2, scope: "Can access Level 1–2 resources. Cannot access Level 3–7 resources." },
  { level: 1, scope: "Can only access Level 1 resources." },
];

const SETTINGS = {
  "metric.activeResources": "428",
  "metric.activeResourcesNote": "97% availability across monitored systems",
  "metric.personnelOnSite": "96",
  "metric.personnelOnSiteNote": "18 contractors currently checked in",
  "metric.dailyOperations": "142",
  "metric.dailyOperationsNote": "Active operational activities today",
  "metric.aiInsights": "28",
  "metric.aiInsightsNote": "AI-generated recommendations today",
  "metric.activePermissions": "96",
  "metric.highestLevel": "7",
  engines: JSON.stringify([
    { name: "Claude Code", enabled: true },
    { name: "Microsoft Copilot", enabled: true },
    { name: "OpenAI Codex", enabled: false },
  ]),
  governance: JSON.stringify([
    { name: "Enable audit logs", enabled: true },
    { name: "Restrict AI from sensitive data", enabled: true },
    { name: "Enable AI operational recommendations", enabled: true },
    { name: "Require admin approval for major data updates", enabled: true },
  ]),
};

export function seedDatabase(db, { force = false } = {}) {
  const hasData = db.prepare("SELECT COUNT(*) AS n FROM resources").get().n > 0;

  if (hasData && !force) return { seeded: false, reason: "already has data" };

  if (force) {
    db.exec(
      "DELETE FROM permission_steps; DELETE FROM permission_requests; DELETE FROM resources; DELETE FROM people; DELETE FROM audit_logs; DELETE FROM ai_recommendations; DELETE FROM settings; DELETE FROM level_rules;"
    );
  }

  const insResource = db.prepare(
    "INSERT INTO resources (id, name, type, status, owner, location, risk, permission, request_status, required_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );
  for (const r of RESOURCES) {
    insResource.run(r.id, r.name, r.type, r.status, r.owner, r.location, r.risk, r.permission, r.request_status, r.required_level);
  }

  const insPerson = db.prepare(
    "INSERT INTO people (id, name, type, company, site, assignment, status, valid_until, risk, cyber_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );
  for (const p of PEOPLE) {
    insPerson.run(p.id, p.name, p.type, p.company, p.site, p.assignment, p.status, p.valid_until, p.risk, p.cyber_level);
  }

  const insRequest = db.prepare(
    "INSERT INTO permission_requests (resource_id, requester_id, title, overall_status) VALUES (?, ?, ?, ?)"
  );
  const req = insRequest.run(
    "AST-003",
    "PER-00125",
    "Maintenance access for Pump Unit-A12",
    "In Review"
  );
  const requestId = Number(req.lastInsertRowid);

  const insStep = db.prepare(
    "INSERT INTO permission_steps (request_id, step, owner, status, note, sort_order) VALUES (?, ?, ?, ?, ?, ?)"
  );
  PERMISSION_STEPS.forEach((s, i) => {
    insStep.run(requestId, s.step, s.owner, s.status, s.note, i + 1);
  });

  const insAudit = db.prepare(
    "INSERT INTO audit_logs (time, user, action, result) VALUES (?, ?, ?, ?)"
  );
  for (const a of AUDIT_LOGS) {
    insAudit.run(a.time, a.user, a.action, a.result);
  }

  const insRec = db.prepare(
    "INSERT INTO ai_recommendations (severity, title, detail) VALUES (?, ?, ?)"
  );
  for (const r of RECOMMENDATIONS) {
    insRec.run(r.severity, r.title, r.detail);
  }

  const insRule = db.prepare(
    "INSERT INTO level_rules (level, scope) VALUES (?, ?)"
  );
  for (const r of LEVEL_RULES) {
    insRule.run(r.level, r.scope);
  }

  const insSetting = db.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?)"
  );
  for (const [key, value] of Object.entries(SETTINGS)) {
    insSetting.run(key, value);
  }

  return { seeded: true };
}

// Allow running `npm run seed` directly to force-reset demo data.
import { pathToFileURL } from "node:url";
import fs from "node:fs";
import path from "node:path";

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const { DatabaseSync } = await import("node:sqlite");
  const DB_PATH =
    process.env.DB_PATH || path.join(process.cwd(), "data", "intellipath.db");
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  const result = seedDatabase(db, { force: true });
  console.log(`Seed ${result.seeded ? "complete" : "skipped"} -> ${DB_PATH}`);
  db.close();
}
