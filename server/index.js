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
  listSystemLogs,
  listRecommendations,
  getSetting,
  setSetting,
  logAudit,
  logSystem,
  listPermissionRequests,
  getUserByUsername,
  getUserById,
  listUsers,
  createUser,
  updateUserPassword,
  deleteUser,
  createSession,
  deleteSession,
} from "./db.js";
import { requireAuth, requirePermission, publicUser, ROLES } from "./auth.js";
import { hashPassword, verifyPassword, randomToken } from "./password.js";
import { answerQuestion } from "./ai.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// ---------------------------------------------------------------------------
// Public
// ---------------------------------------------------------------------------
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "IntelliPath API",
    time: new Date().toISOString(),
    db: "sqlite",
  });
});

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }
  const user = getUserByUsername(db, username);
  if (!user || !verifyPassword(password, user.password_hash)) {
    logAudit(db, { user: username, action: "Failed sign-in attempt", result: "Failed", category: "auth" });
    return res.status(401).json({ error: "Invalid username or password." });
  }
  const token = randomToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  createSession(db, user.id, token, expiresAt);
  logAudit(db, { user: user.name, action: "Signed in to IntelliPath", result: "Success", category: "auth" });
  res.json({ token, user: publicUser(user) });
});

app.post("/api/auth/logout", requireAuth, (req, res) => {
  deleteSession(db, req.token);
  logAudit(db, { user: req.user.name, action: "Signed out", result: "Success", category: "auth" });
  res.json({ ok: true });
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

app.post("/api/auth/change-password", requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Current and new password are required." });
  }
  if (String(newPassword).length < 8) {
    return res.status(400).json({ error: "New password must be at least 8 characters." });
  }
  const user = getUserById(db, req.user.id);
  if (!user || !verifyPassword(currentPassword, user.password_hash)) {
    return res.status(400).json({ error: "Current password is incorrect." });
  }
  updateUserPassword(db, user.id, hashPassword(newPassword));
  logAudit(db, { user: user.name, action: "Changed account password", result: "Success", category: "auth" });
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Users (admin only)
// ---------------------------------------------------------------------------
app.get("/api/users", requireAuth, requirePermission("users"), (_req, res) => {
  res.json({ users: listUsers(db) });
});

app.post("/api/users", requireAuth, requirePermission("users"), (req, res) => {
  const { username, password, name, role, email } = req.body || {};
  if (!username || !password || !name || !role) {
    return res.status(400).json({ error: "username, password, name and role are required." });
  }
  if (!ROLES[role]) {
    return res.status(400).json({ error: `Unknown role. Valid roles: ${Object.keys(ROLES).join(", ")}` });
  }
  if (getUserByUsername(db, username)) {
    return res.status(409).json({ error: "That username already exists." });
  }
  const user = createUser(db, {
    username,
    passwordHash: hashPassword(password),
    name,
    role,
    email: email || null,
  });
  logAudit(db, { user: req.user.name, action: `Created account ${username} (${role})`, result: "Success", category: "auth" });
  res.status(201).json({ user: publicUser(user) });
});

app.delete("/api/users/:id", requireAuth, requirePermission("users"), (req, res) => {
  const target = getUserById(db, req.params.id);
  if (!target) return res.status(404).json({ error: "User not found" });
  if (Number(target.id) === Number(req.user.id)) {
    return res.status(400).json({ error: "You cannot delete your own account." });
  }
  deleteUser(db, target.id);
  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(target.id);
  logAudit(db, { user: req.user.name, action: `Deleted account ${target.username}`, result: "Success", category: "auth" });
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------
app.get("/api/metrics", requireAuth, (_req, res) => {
  const resources = listResources(db);
  const tracked = resources.length;
  const activeResources = resources.filter((r) => r.status === "Active").length;
  const pending = db
    .prepare("SELECT COUNT(*) AS n FROM permission_steps WHERE status IN ('In Review','Pending')")
    .get().n;
  res.json({
    headline: {
      activeResources,
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
app.get("/api/resources", requireAuth, requirePermission("resources.read"), (req, res) => {
  const resources = listResources(db);
  const people = listPeople(db);
  const userId = req.query.userId || people[0]?.id;
  const user = getPerson(db, userId) || people[0];
  res.json({
    user,
    resources: resources.map((r) => ({
      ...r,
      userLevel: user.cyber_level,
      accessResult: canAccess(user.cyber_level, r.required_level) ? "Approved" : "Escalated",
    })),
  });
});

app.get("/api/resources/:id", requireAuth, requirePermission("resources.read"), (req, res) => {
  const resource = getResource(db, req.params.id);
  if (!resource) return res.status(404).json({ error: "Not found" });
  res.json(resource);
});

app.post("/api/resources", requireAuth, requirePermission("resources.write"), (req, res) => {
  const b = req.body || {};
  const required = ["name", "type", "status", "owner", "location", "risk", "permission", "request_status"];
  for (const field of required) {
    if (!b[field]) return res.status(400).json({ error: `Missing field: ${field}` });
  }
  const count = db.prepare("SELECT COUNT(*) AS n FROM resources").get().n;
  const id = `AST-${String(count + 1).padStart(3, "0")}`;
  db.prepare(
    `INSERT INTO resources (id, name, type, status, owner, location, risk, permission, request_status, required_level, serial_number, manufacturer, model, ip_address, os, last_seen, health)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
    Number(b.required_level) || 1,
    b.serial_number || "",
    b.manufacturer || "",
    b.model || "",
    b.ip_address || "",
    b.os || "",
    b.last_seen || "",
    b.health || "Healthy"
  );
  logAudit(db, { user: req.user.name, action: `Created resource ${id} (${b.name})`, result: "Success", category: "resource" });
  logSystem(db, { deviceId: id, deviceName: b.name, source: "Registry", eventType: "Provisioning", severity: "info", message: `Asset ${id} registered by ${req.user.name}.` });
  res.status(201).json(getResource(db, id));
});

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------
app.get("/api/people", requireAuth, (_req, res) => {
  res.json({ people: listPeople(db) });
});

// ---------------------------------------------------------------------------
// Level rules
// ---------------------------------------------------------------------------
app.get("/api/level-rules", requireAuth, (_req, res) => {
  res.json({ rules: listLevelRules(db) });
});

// ---------------------------------------------------------------------------
// Permission requests
// ---------------------------------------------------------------------------
app.get("/api/permission-requests", requireAuth, requirePermission("resources.read"), (req, res) => {
  res.json({ requests: listPermissionRequests(db) });
});

app.post("/api/permission-requests", requireAuth, requirePermission("resources.write"), (req, res) => {
  const b = req.body || {};
  const resource = getResource(db, b.resourceId);
  const person = getPerson(db, b.requesterId);
  if (!resource || !person) {
    return res.status(400).json({ error: "Valid resourceId and requesterId are required." });
  }
  const title = b.title || `Access request for ${resource.name}`;
  const info = db
    .prepare("INSERT INTO permission_requests (resource_id, requester_id, title, overall_status) VALUES (?, ?, ?, ?)")
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

  logAudit(db, { user: req.user.name, action: `Submitted permission request for ${resource.name}`, result: "Success", category: "permission" });
  res.status(201).json(listPermissionRequests(db).find((r) => r.id === requestId));
});

// ---------------------------------------------------------------------------
// Audit logs & system logs
// ---------------------------------------------------------------------------
app.get("/api/audit-logs", requireAuth, requirePermission("audit.read"), (req, res) => {
  res.json({ logs: listAuditLogs(db) });
});

app.post("/api/audit-logs", requireAuth, requirePermission("audit.write"), (req, res) => {
  const b = req.body || {};
  logAudit(db, {
    user: b.user || req.user.name,
    action: b.action || "Action performed",
    result: b.result || "Success",
    category: b.category || "general",
  });
  res.status(201).json({ ok: true });
});

app.get("/api/system-logs", requireAuth, requirePermission("audit.read"), (_req, res) => {
  res.json({ logs: listSystemLogs(db) });
});

// ---------------------------------------------------------------------------
// AI
// ---------------------------------------------------------------------------
app.get("/api/ai/recommendations", requireAuth, (_req, res) => {
  res.json({ recommendations: listRecommendations(db) });
});

app.post("/api/ai/ask", requireAuth, requirePermission("ai"), (req, res) => {
  const prompt = (req.body || {}).prompt || "";
  const answer = answerQuestion(db, prompt);
  logAudit(db, { user: req.user.name, action: `Asked AI: ${prompt.slice(0, 80)}`, result: "Completed", category: "ai" });
  res.json(answer);
});

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------
app.get("/api/search", requireAuth, requirePermission("search"), (req, res) => {
  const q = (req.query.q || "").toString().toLowerCase();
  const results = [];
  if (!q.trim()) return res.json({ results });

  const people = listPeople(db).filter((p) =>
    [p.name, p.company, p.assignment, p.site, p.id, p.department].join(" ").toLowerCase().includes(q)
  );
  for (const p of people) {
    results.push({ kind: "Person", title: `${p.name} · ${p.type} · ${p.company}`, detail: `${p.assignment} — ${p.department} (${p.site})`, icon: "users" });
  }

  const resources = listResources(db).filter((r) =>
    [r.name, r.type, r.owner, r.location, r.permission, r.id, r.manufacturer, r.model, r.ip_address].join(" ").toLowerCase().includes(q)
  );
  for (const r of resources) {
    results.push({ kind: "Resource", title: `${r.name} · ${r.location} · ${r.status}`, detail: `${r.type} — ${r.manufacturer} ${r.model} (Level ${r.required_level})`, icon: "database" });
  }

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

app.get("/api/settings", requireAuth, requirePermission("settings"), (_req, res) => {
  res.json(getSettingsPayload());
});

app.put("/api/settings", requireAuth, requirePermission("settings"), (req, res) => {
  const b = req.body || {};
  if (Array.isArray(b.engines)) setSetting(db, "engines", JSON.stringify(b.engines));
  if (Array.isArray(b.governance)) setSetting(db, "governance", JSON.stringify(b.governance));
  logAudit(db, { user: req.user.name, action: "Updated platform settings", result: "Success", category: "settings" });
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
