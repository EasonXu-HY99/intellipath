import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  db,
  canAccess,
  listResources,
  getResource,
  listPeople,
  getPerson,
  listLevelRules,
  listAuditLogs,
  listRecommendations,
  getSetting,
  setSetting,
  logAudit,
  listPermissionRequests,
} from "./db.js";
import { answerQuestion } from "./ai.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// Simple CORS for local dev (Vite proxy is the primary path in production).
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "IntelliPath API",
    time: new Date().toISOString(),
    db: "sqlite",
  });
});

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------
app.get("/api/metrics", (req, res) => {
  const tracked = listResources(db).length;
  const pending = db
    .prepare(
      "SELECT COUNT(*) AS n FROM permission_steps WHERE status IN ('In Review','Pending')"
    )
    .get().n;
  res.json({
    headline: {
      activeResources: Number(getSetting(db, "metric.activeResources", "0")),
      activeResourcesNote: getSetting(db, "metric.activeResourcesNote", ""),
      personnelOnSite: Number(getSetting(db, "metric.personnelOnSite", "0")),
      personnelOnSiteNote: getSetting(db, "metric.personnelOnSiteNote", ""),
      dailyOperations: Number(getSetting(db, "metric.dailyOperations", "0")),
      dailyOperationsNote: getSetting(db, "metric.dailyOperationsNote", ""),
      aiInsights: Number(getSetting(db, "metric.aiInsights", "0")),
      aiInsightsNote: getSetting(db, "metric.aiInsightsNote", ""),
    },
    resources: {
      tracked,
      activePermissions: Number(getSetting(db, "metric.activePermissions", "0")),
      highestLevel: Number(getSetting(db, "metric.highestLevel", "7")),
      pendingReviews: pending,
    },
  });
});

// ---------------------------------------------------------------------------
// Resources
// ---------------------------------------------------------------------------
app.get("/api/resources", (req, res) => {
  const resources = listResources(db);
  const people = listPeople(db);
  const userId = req.query.userId || people[0]?.id;
  const user = getPerson(db, userId) || people[0];
  res.json({
    user,
    resources: resources.map((r) => ({
      ...r,
      userLevel: user.cyber_level,
      accessResult: canAccess(user.cyber_level, r.required_level)
        ? "Approved"
        : "Escalated",
    })),
  });
});

app.get("/api/resources/:id", (req, res) => {
  const resource = getResource(db, req.params.id);
  if (!resource) return res.status(404).json({ error: "Not found" });
  res.json(resource);
});

app.post("/api/resources", (req, res) => {
  const b = req.body || {};
  const required = ["name", "type", "status", "owner", "location", "risk", "permission", "request_status"];
  for (const field of required) {
    if (!b[field]) return res.status(400).json({ error: `Missing field: ${field}` });
  }
  const count = db.prepare("SELECT COUNT(*) AS n FROM resources").get().n;
  const id = `AST-${String(count + 1).padStart(3, "0")}`;
  db.prepare(
    "INSERT INTO resources (id, name, type, status, owner, location, risk, permission, request_status, required_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(
    id,
    b.name,
    b.type,
    b.status,
    b.owner,
    b.location,
    b.risk,
    b.permission,
    b.request_status,
    Number(b.required_level) || 1
  );
  logAudit(db, { user: "Haiyang Xu", action: `Created resource ${id} (${b.name})`, result: "Success" });
  res.status(201).json(getResource(db, id));
});

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------
app.get("/api/people", (req, res) => {
  res.json({ people: listPeople(db) });
});

// ---------------------------------------------------------------------------
// Level rules
// ---------------------------------------------------------------------------
app.get("/api/level-rules", (req, res) => {
  res.json({ rules: listLevelRules(db) });
});

// ---------------------------------------------------------------------------
// Permission requests
// ---------------------------------------------------------------------------
app.get("/api/permission-requests", (req, res) => {
  res.json({ requests: listPermissionRequests(db) });
});

app.post("/api/permission-requests", (req, res) => {
  const b = req.body || {};
  const resource = getResource(db, b.resourceId);
  const person = getPerson(db, b.requesterId);
  if (!resource || !person) {
    return res.status(400).json({ error: "Valid resourceId and requesterId are required." });
  }
  const title = b.title || `Access request for ${resource.name}`;
  const info = db
    .prepare(
      "INSERT INTO permission_requests (resource_id, requester_id, title, overall_status) VALUES (?, ?, ?, ?)"
    )
    .run(resource.id, person.id, title, "In Review");
  const requestId = Number(info.lastInsertRowid);

  const steps = [
    { step: "Request Submitted", owner: "Operations User", status: "Completed", note: `${person.name} requested access for ${resource.name}.` },
    { step: "Manager Review", owner: "Project Coordination Manager", status: "Completed", note: "Purpose and work order validated." },
    { step: "Permission Validation", owner: "System / Admin", status: "In Review", note: "Checking location, role, and access period." },
    { step: "Final Approval", owner: "Operations Admin", status: "Pending", note: "Awaiting approval before permission activation." },
    { step: "Access Activated", owner: "System", status: "Not Started", note: "Permission will be synced after approval." },
  ];
  const insStep = db.prepare(
    "INSERT INTO permission_steps (request_id, step, owner, status, note, sort_order) VALUES (?, ?, ?, ?, ?, ?)"
  );
  steps.forEach((s, i) => insStep.run(requestId, s.step, s.owner, s.status, s.note, i + 1));

  logAudit(db, { user: "Haiyang Xu", action: `Submitted permission request for ${resource.name}`, result: "Success" });
  res.status(201).json(listPermissionRequests(db).find((r) => r.id === requestId));
});

// ---------------------------------------------------------------------------
// Audit logs
// ---------------------------------------------------------------------------
app.get("/api/audit-logs", (req, res) => {
  res.json({ logs: listAuditLogs(db) });
});

app.post("/api/audit-logs", (req, res) => {
  const b = req.body || {};
  const user = b.user || "Haiyang Xu";
  const action = b.action || "Action performed";
  const result = b.result || "Success";
  logAudit(db, { user, action, result });
  res.status(201).json({ ok: true });
});

// ---------------------------------------------------------------------------
// AI
// ---------------------------------------------------------------------------
app.get("/api/ai/recommendations", (req, res) => {
  res.json({ recommendations: listRecommendations(db) });
});

app.post("/api/ai/ask", (req, res) => {
  const prompt = (req.body || {}).prompt || "";
  const answer = answerQuestion(db, prompt);
  logAudit(db, { user: "AI Assistant", action: `Answered: ${prompt.slice(0, 80)}`, result: "Completed" });
  res.json(answer);
});

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------
app.get("/api/search", (req, res) => {
  const q = (req.query.q || "").toString().toLowerCase();
  const results = [];
  if (!q.trim()) return res.json({ results });

  const people = listPeople(db).filter((p) =>
    [p.name, p.company, p.assignment, p.site, p.id].join(" ").toLowerCase().includes(q)
  );
  for (const p of people) {
    results.push({ kind: "Person Record", title: `${p.name} · ${p.type} · ${p.company}`, detail: `Assigned to ${p.assignment} at ${p.site}`, icon: "users" });
  }

  const resources = listResources(db).filter((r) =>
    [r.name, r.type, r.owner, r.location, r.permission, r.id].join(" ").toLowerCase().includes(q)
  );
  for (const r of resources) {
    results.push({ kind: "Resource Record", title: `${r.name} · ${r.location} · ${r.status}`, detail: `${r.type} — ${r.permission} (Level ${r.required_level})`, icon: "database" });
  }

  // A synthesized AI summary whenever anything matched.
  if (results.length) {
    results.push({
      kind: "AI Summary",
      title: "Operational context",
      detail: `${results.length} record(s) matched your search across people and resources.`,
      icon: "sparkles",
    });
  }

  res.json({ results });
});

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
function getSettingsPayload() {
  return {
    engines: JSON.parse(getSetting(db, "engines", "[]")),
    governance: JSON.parse(getSetting(db, "governance", "[]")),
  };
}

app.get("/api/settings", (req, res) => {
  res.json(getSettingsPayload());
});

app.put("/api/settings", (req, res) => {
  const b = req.body || {};
  if (Array.isArray(b.engines)) setSetting(db, "engines", JSON.stringify(b.engines));
  if (Array.isArray(b.governance)) setSetting(db, "governance", JSON.stringify(b.governance));
  logAudit(db, { user: "Haiyang Xu", action: "Updated platform settings", result: "Success" });
  res.json(getSettingsPayload());
});

// ---------------------------------------------------------------------------
// Static frontend (production)
// ---------------------------------------------------------------------------
const dist = path.join(__dirname, "..", "client", "dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(dist, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`IntelliPath API listening on http://localhost:${PORT}`);
});
