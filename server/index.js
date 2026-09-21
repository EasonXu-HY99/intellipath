import { accessName, RANK_ROLE } from "../shared/access.js";
import { AGENTS, SOURCES, saveUpload } from "./workspace.js";
import { agentSearch } from "./agents.js";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import {
  db,
  getUserByUsername,
  getUserById,
  listUsers,
  createUser,
  updateUserPassword,
  deleteUser,
  createSession,
  deleteSession,
  logAudit,
  logSystem,
  listLevelRules,
} from "./db.js";
import { requireAuth, requirePermission, publicUser, ROLES } from "./auth.js";
import { hashPassword, verifyPassword, randomToken } from "./password.js";
import { DEFAULT_LEVELS } from "./upgrade.js";
import {
  snapshot,
  settings,
  saveSettings,
  metrics,
  recommendations,
  searchRecords,
  validLevel,
  catalog,
} from "./operations.js";
import { answer, assistantStatus } from "./assistant.js";
import { buildReport, reportPDF } from "./report.js";

export const app = express();
app.use((req, res, next) =>
  req.path === "/api/files/upload"
    ? next()
    : express.json({ limit: "32kb" })(req, res, next),
);
app.disable("x-powered-by");
app.use("/api", (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
const asyncRoute = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res)).catch(next);
const audit = (req, action) =>
  logAudit(db, { user: req.user.name, action, result: "Success" });
const scope = (req) => snapshot(db, req.user);
const failures = new Map();
app.get("/api/health", (_req, res) =>
  res.json({
    ok: true,
    service: "IntelliPath API",
    db: "sqlite",
    version: "2.2",
    time: new Date().toISOString(),
  }),
);
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body || {};
  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    username.length > 100 ||
    password.length > 500
  )
    return res
      .status(400)
      .json({ error: "Username and password are required." });
  const now = Date.now();
  for (const [k, v] of failures) if (now - v.at > 60000) failures.delete(k);
  const key = `${req.ip}:${username}`;
  const attempts = failures.get(key);
  if (attempts?.count >= 10)
    return res
      .status(429)
      .json({ error: "Too many attempts. Try again in one minute." });
  const user = getUserByUsername(db, username);
  if (!user || !verifyPassword(password, user.password_hash)) {
    failures.set(key, {
      at: attempts?.at || now,
      count: (attempts?.count || 0) + 1,
    });
    return res.status(401).json({ error: "Invalid username or password." });
  }
  failures.delete(key);
  const token = randomToken();
  createSession(
    db,
    user.id,
    token,
    new Date(now + settings(db).sessionHours * 3600000).toISOString(),
  );
  logAudit(db, {
    user: user.name,
    action: "Signed in",
    result: "Success",
    category: "auth",
  });
  res.json({ token, user: publicUser(user) });
});
app.use("/api", requireAuth);
app.get("/api/workspace", requirePermission("search"), (req, res) =>
  res.json({ agents: AGENTS, sources: SOURCES }),
);
app.post(
  "/api/agents/search",
  requirePermission("search"),
  (req, res, next) => {
    try {
      res.json(agentSearch(scope(req), req.body));
    } catch (e) {
      next(e);
    }
  },
);
app.post(
  "/api/files/upload",
  requirePermission("files.upload"),
  express.json({ limit: "7mb" }),
  (req, res, next) => {
    try {
      const file = saveUpload(db, req.user, req.body);
      audit(req, `Uploaded file ${file.id}`);
      res.status(201).json({ file });
    } catch (e) {
      next(e);
    }
  },
);
app.post("/api/auth/logout", (req, res) => {
  deleteSession(db, req.token);
  res.json({ ok: true });
});
app.get("/api/auth/me", (req, res) => res.json({ user: publicUser(req.user) }));
app.post("/api/auth/change-password", (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (
    typeof currentPassword !== "string" ||
    typeof newPassword !== "string" ||
    newPassword.length < 8 ||
    newPassword.length > 500
  )
    return res.status(400).json({
      error: "Provide current password and a new password of 8-500 characters.",
    });
  if (
    !verifyPassword(currentPassword, getUserById(db, req.user.id).password_hash)
  )
    return res.status(400).json({ error: "Current password is incorrect." });
  updateUserPassword(db, req.user.id, hashPassword(newPassword));
  db.prepare("DELETE FROM sessions WHERE user_id=? AND token<>?").run(
    req.user.id,
    req.token,
  );
  audit(req, "Changed account password");
  res.json({ ok: true });
});
app.get("/api/users", requirePermission("users"), (_req, res) =>
  res.json({ users: listUsers(db) }),
);
app.post("/api/users", requirePermission("users"), (req, res) => {
  const { username, password, name, role, email, cyber_level } = req.body || {};
  const level = cyber_level ?? DEFAULT_LEVELS[role];
  if (
    ![username, password, name].every(
      (v) => typeof v === "string" && v.trim() && v.length <= 500,
    ) ||
    password.length < 8 ||
    !Object.hasOwn(ROLES, role) ||
    (!validLevel(level) || level !== DEFAULT_LEVELS[role])
  )
    return res.status(400).json({
      error:
        "Valid username, name, one of the five access roles and password (8+ characters) are required.",
    });
  if (getUserByUsername(db, username))
    return res.status(409).json({ error: "Username already exists." });
  const u = createUser(db, {
    username,
    passwordHash: hashPassword(password),
    name,
    role,
    email: typeof email === "string" ? email : null,
  });
  db.prepare("UPDATE users SET cyber_level=? WHERE id=?").run(level, u.id);
  audit(req, `Created account ${username} with ${accessName(level)} access`);
  res.status(201).json({ user: publicUser(getUserById(db, u.id)) });
});
app.put("/api/users/:id/clearance", requirePermission("users"), (req, res) => {
  const u = getUserById(db, req.params.id),
    level = req.body?.cyber_level;
  if (!u) return res.status(404).json({ error: "User not found." });
  if (!validLevel(level))
    return res
      .status(400)
      .json({ error: "Choose one of the five access roles." });
  if (u.id === req.user.id)
    return res
      .status(400)
      .json({ error: "Another administrator must change your clearance." });
  db.prepare("UPDATE users SET cyber_level=?,role=? WHERE id=?").run(level, RANK_ROLE[level], u.id);
  db.prepare("DELETE FROM sessions WHERE user_id=?").run(u.id);
  audit(
    req,
    `Changed ${u.username} role from ${accessName(u.cyber_level)} to ${accessName(level)}; revoked sessions`,
  );
  res.json({ user: publicUser(getUserById(db, u.id)) });
});
app.delete("/api/users/:id", requirePermission("users"), (req, res) => {
  const u = getUserById(db, req.params.id);
  if (!u) return res.status(404).json({ error: "User not found." });
  if (u.id === req.user.id)
    return res.status(400).json({ error: "You cannot delete your account." });
  db.prepare("DELETE FROM sessions WHERE user_id=?").run(u.id);
  deleteUser(db, u.id);
  audit(req, `Deleted account ${u.username}`);
  res.json({ ok: true });
});
app.get("/api/metrics", (req, res) =>
  res.json(metrics(scope(req), settings(db))),
);
app.get("/api/resources", requirePermission("resources.read"), (req, res) => {
  const s = scope(req);
  let person = { name: req.user.name, cyber_level: s.level };
  if (req.query.userId) {
    if (req.user.role !== "admin")
      return res
        .status(403)
        .json({ error: "Person preview is administrator-only." });
    person = s.people.find((p) => p.id === req.query.userId);
    if (!person) return res.status(404).json({ error: "Person not found." });
  }
  res.json({
    user: person,
    viewerLevel: s.level,
    resources: s.resources.map((r) => ({
      ...r,
      userLevel: person.cyber_level,
      accessResult:
        person.cyber_level >= r.required_level ? "Approved" : "Escalated",
    })),
  });
});
app.get(
  "/api/resources/:id",
  requirePermission("resources.read"),
  (req, res) => {
    const r = scope(req).resources.find((r) => r.id === req.params.id);
    return r
      ? res.json(r)
      : res.status(404).json({ error: "Resource not found." });
  },
);
app.post("/api/resources", requirePermission("resources.write"), (req, res) => {
  const b = req.body || {},
    level = Number(b.required_level);
  if (
    ![
      "name",
      "type",
      "status",
      "owner",
      "location",
      "risk",
      "permission",
      "request_status",
    ].every(
      (k) => typeof b[k] === "string" && b[k].trim() && b[k].length < 500,
    ) ||
    !validLevel(level) ||
    level > req.user.cyber_level
  )
    return res.status(400).json({
      error:
        "Complete all required fields and choose a classification within your clearance.",
    });
  const id = `AST-${randomUUID().slice(0, 8)}`;
  db.prepare(
    "INSERT INTO resources (id,name,type,status,owner,location,risk,permission,request_status,required_level,serial_number,manufacturer,model,ip_address,os,last_seen,health) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
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
    level,
    ...["serial_number", "manufacturer", "model", "ip_address", "os"].map((k) =>
      String(b[k] || "").slice(0, 200),
    ),
    new Date().toISOString(),
    String(b.health || "Healthy"),
  );
  audit(req, `Created resource ${id}`);
  logSystem(db, {
    deviceId: id,
    deviceName: b.name,
    source: "Registry",
    eventType: "Provisioning",
    severity: "info",
    message: `Registered ${id}`,
    timestamp: new Date().toISOString(),
  });
  res.status(201).json(scope(req).resources.find((r) => r.id === id));
});
app.get("/api/people", (req, res) => res.json({ people: scope(req).people }));
app.get("/api/sites", (req, res) => res.json({ sites: scope(req).sites }));
app.get("/api/level-rules", (req, res) =>
  res.json({ rules: listLevelRules(db), viewerLevel: req.user.cyber_level }),
);
app.get(
  "/api/permission-requests",
  requirePermission("resources.read"),
  (req, res) => res.json({ requests: scope(req).requests }),
);
app.post(
  "/api/permission-requests",
  requirePermission("resources.write"),
  (req, res) => {
    const s = scope(req),
      b = req.body || {},
      r = s.resources.find((r) => r.id === b.resourceId),
      p = s.people.find((p) => p.id === b.requesterId);
    if (!r || !p)
      return res
        .status(400)
        .json({ error: "Choose a visible resource and requester." });
    const title = String(b.title || `Access request for ${r.name}`).slice(
      0,
      500,
    );
    const id = Number(
      db
        .prepare(
          "INSERT INTO permission_requests (resource_id,requester_id,title,overall_status) VALUES (?,?,?,?)",
        )
        .run(r.id, p.id, title, "Pending").lastInsertRowid,
    );
    for (const [i, step] of [
      "Request Submitted",
      "Manager Review",
      "Permission Validation",
      "Final Approval",
      "Access Activated",
    ].entries())
      db.prepare(
        "INSERT INTO permission_steps (request_id,step,owner,status,note,sort_order) VALUES (?,?,?,?,?,?)",
      ).run(
        id,
        step,
        i === 0 ? req.user.name : "Awaiting assignment",
        i === 0 ? "Completed" : "Pending",
        i === 0 ? `Submitted for ${p.name}` : "Not yet reviewed",
        i + 1,
      );
    audit(req, `Submitted request ${id}`);
    res.status(201).json(scope(req).requests.find((r) => r.id === id));
  },
);
app.get("/api/audit-logs", requirePermission("audit.read"), (req, res) =>
  res.json({ logs: scope(req).audit }),
);
app.post("/api/audit-logs", requirePermission("audit.write"), (req, res) => {
  audit(req, String(req.body?.action || "User action").slice(0, 500));
  res.status(201).json({ ok: true });
});
app.get("/api/system-logs", requirePermission("audit.read"), (req, res) =>
  res.json({ logs: scope(req).logs }),
);
app.get("/api/ai/recommendations", (req, res) =>
  res.json({ recommendations: recommendations(scope(req), settings(db)) }),
);
app.get("/api/ai/status", (_req, res) => res.json(assistantStatus(db)));
const aiBusy = new Set(),
  aiRate = new Map();
app.post(
  "/api/ai/ask",
  requirePermission("ai"),
  asyncRoute(async (req, res) => {
    const now = Date.now();
    for (const [id, r] of aiRate) if (now - r.start > 60000) aiRate.delete(id);
    const rate = aiRate.get(req.user.id) || { start: now, count: 0 };
    if (aiBusy.has(req.user.id) || rate.count >= 12)
      return res
        .status(429)
        .json({ error: "Please wait before sending another question." });
    rate.count++;
    aiRate.set(req.user.id, rate);
    aiBusy.add(req.user.id);
    try {
      const result = await answer(db, req.user, req.body || {}, req.token);
      audit(req, "Asked AI assistant");
      res.json(result);
    } finally {
      aiBusy.delete(req.user.id);
    }
  }),
);
app.get("/api/search", requirePermission("search"), (req, res) =>
  res.json(
    searchRecords(scope(req), {
      ...req.query,
      pageSize: req.query.pageSize || settings(db).searchPageSize,
    }),
  ),
);
app.get("/api/records/:id", requirePermission("search"), (req, res) => {
  const r = catalog(scope(req)).find((r) => r.id === req.params.id);
  return r
    ? res.json({ record: r })
    : res.status(404).json({ error: "Record not found." });
});
app.get(
  "/api/documents/:id/download",
  requirePermission("search"),
  (req, res) => {
    const r = scope(req).records.find(
      (r) => r.id === req.params.id && r.kind === "Document",
    );
    if (!r) return res.status(404).json({ error: "Document not found." });
    const uploaded = db
      .prepare("SELECT filename,bytes FROM uploads WHERE id=?")
      .get(r.id);
    if (uploaded)
      return res
        .set("X-Content-Type-Options", "nosniff")
        .type("application/octet-stream")
        .attachment(uploaded.filename)
        .send(Buffer.from(uploaded.bytes));
    res
      .type("text/markdown")
      .attachment(`${r.id}.md`)
      .send(
        `# ${r.title}\n\nDEMO DOCUMENT | Classification ${accessName(r.required_level)}\n\nSite: ${r.site}\nOwner: ${r.owner}\nUpdated: ${r.updated_at}\n\n${r.content}\n`,
      );
  },
);
const reportBusy = new Set();
app.get(
  "/api/reports/daily.pdf",
  requirePermission("overview"),
  asyncRoute(async (req, res) => {
    if (reportBusy.has(req.user.id))
      return res
        .status(429)
        .json({ error: "A report is already being generated." });
    reportBusy.add(req.user.id);
    try {
      let report;
      try {
        report = buildReport(
          scope(req),
          settings(db),
          req.user,
          req.query.date,
        );
      } catch {
        return res.status(400).json({ error: "Invalid report date." });
      }
      const pdf = await reportPDF(report);
      audit(
        req,
        `Exported cybersecurity report ${report.window.day} at ${accessName(req.user.cyber_level)}`,
      );
      res
        .type("application/pdf")
        .attachment(`IntelliPath-Cybersecurity-${report.window.day}.pdf`)
        .send(pdf);
    } finally {
      reportBusy.delete(req.user.id);
    }
  }),
);
app.get("/api/settings", requirePermission("settings"), (_req, res) =>
  res.json({ settings: settings(db), ai: assistantStatus(db) }),
);
app.put("/api/settings", requirePermission("settings"), (req, res) => {
  try {
    const result = saveSettings(db, req.body);
    audit(req, "Updated operational settings");
    res.json({ settings: result, ai: assistantStatus(db) });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.use("/api", (_req, res) =>
  res.status(404).json({ error: "API route not found." }),
);
const dist = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../client/dist",
);
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));
}
app.use((err, _req, res, _next) => {
  if (!res.headersSent)
    res.status(err.status || 500).json({
      error: err.status ? err.message : "The request could not be completed.",
    });
});
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  app.listen(process.env.PORT || 8080, process.env.HOST || "0.0.0.0", () =>
    console.log(`IntelliPath listening on ${process.env.PORT || 8080}`),
  );
