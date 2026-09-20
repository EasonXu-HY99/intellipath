import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { seedDatabase } from "./seed.js";
import { migrateOperations } from "./upgrade.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Database file location. Defaults to <project>/data/intellipath.db
const DB_PATH =
  process.env.DB_PATH || path.join(__dirname, "..", "data", "intellipath.db");

if (DB_PATH !== ":memory:") {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

export const db = new DatabaseSync(DB_PATH);

db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS resources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  owner TEXT NOT NULL,
  location TEXT NOT NULL,
  risk TEXT NOT NULL,
  permission TEXT NOT NULL,
  request_status TEXT NOT NULL,
  required_level INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS people (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  company TEXT NOT NULL,
  site TEXT NOT NULL,
  assignment TEXT NOT NULL,
  status TEXT NOT NULL,
  valid_until TEXT NOT NULL,
  risk TEXT NOT NULL,
  cyber_level INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS permission_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  resource_id TEXT,
  requester_id TEXT,
  title TEXT,
  overall_status TEXT
);

CREATE TABLE IF NOT EXISTS permission_steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id INTEGER NOT NULL,
  step TEXT NOT NULL,
  owner TEXT NOT NULL,
  status TEXT NOT NULL,
  note TEXT NOT NULL,
  sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  time TEXT NOT NULL,
  user TEXT NOT NULL,
  action TEXT NOT NULL,
  result TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ai_recommendations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  detail TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS level_rules (
  level INTEGER PRIMARY KEY,
  scope TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  email TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS system_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  device_id TEXT,
  device_name TEXT,
  source TEXT,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

db.exec(SCHEMA);

// ---------------------------------------------------------------------------
// Lightweight migrations — add columns to pre-existing tables without dropping
// data. Table/column names are hardcoded (never user input).
// ---------------------------------------------------------------------------
function ensureColumn(table, column, ddl) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`);
  }
}

ensureColumn("resources", "serial_number", "TEXT DEFAULT ''");
ensureColumn("resources", "manufacturer", "TEXT DEFAULT ''");
ensureColumn("resources", "model", "TEXT DEFAULT ''");
ensureColumn("resources", "ip_address", "TEXT DEFAULT ''");
ensureColumn("resources", "os", "TEXT DEFAULT ''");
ensureColumn("resources", "last_seen", "TEXT DEFAULT ''");
ensureColumn("resources", "health", "TEXT DEFAULT 'Healthy'");
ensureColumn("people", "department", "TEXT DEFAULT ''");
ensureColumn("people", "email", "TEXT DEFAULT ''");
ensureColumn("audit_logs", "category", "TEXT DEFAULT 'general'");
ensureColumn(
  "permission_requests",
  "created_at",
  "TEXT DEFAULT (datetime('now'))",
);

// Seed demo data on first boot (idempotent).
seedDatabase(db);
migrateOperations(db);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function canAccess(userLevel, requiredLevel) {
  return (
    Number.isInteger(userLevel) &&
    Number.isInteger(requiredLevel) &&
    requiredLevel >= 1 &&
    requiredLevel <= 7 &&
    userLevel >= requiredLevel &&
    userLevel <= 7
  );
}

export function listResources(db) {
  return db.prepare("SELECT * FROM resources ORDER BY id").all();
}

export function getResource(db, id) {
  return db.prepare("SELECT * FROM resources WHERE id = ?").get(id);
}

export function listPeople(db) {
  return db.prepare("SELECT * FROM people ORDER BY id").all();
}

export function getPerson(db, id) {
  return db.prepare("SELECT * FROM people WHERE id = ?").get(id);
}

export function findPersonByName(db, name) {
  return db
    .prepare("SELECT * FROM people WHERE lower(name) LIKE lower(?) LIMIT 1")
    .get(`%${name}%`);
}

export function findResourceByName(db, name) {
  return db
    .prepare("SELECT * FROM resources WHERE lower(name) LIKE lower(?) LIMIT 1")
    .get(`%${name}%`);
}

export function listLevelRules(db) {
  return db.prepare("SELECT * FROM level_rules ORDER BY level DESC").all();
}

export function listAuditLogs(db, limit = 300) {
  return db
    .prepare("SELECT * FROM audit_logs ORDER BY id DESC LIMIT ?")
    .all(limit);
}

export function listSystemLogs(db, limit = 300) {
  return db
    .prepare("SELECT * FROM system_logs ORDER BY id DESC LIMIT ?")
    .all(limit);
}

export function listRecommendations(db) {
  return db.prepare("SELECT * FROM ai_recommendations ORDER BY id").all();
}

export function getSetting(db, key, fallback = null) {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key);
  return row ? row.value : fallback;
}

export function setSetting(db, key, value) {
  db.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
  ).run(key, value);
}

export function formatTimestamp(date = new Date()) {
  return date.toISOString();
}

export function logAudit(db, { user, action, result, category = "general" }) {
  const time = formatTimestamp();
  return db
    .prepare(
      "INSERT INTO audit_logs (time, user, action, result, category) VALUES (?, ?, ?, ?, ?)",
    )
    .run(time, user, action, result, category);
}

export function logSystem(
  db,
  { deviceId, deviceName, source, eventType, severity, message, timestamp },
) {
  const ts = timestamp || formatTimestamp();
  return db
    .prepare(
      "INSERT INTO system_logs (timestamp, device_id, device_name, source, event_type, severity, message) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .run(ts, deviceId, deviceName, source, eventType, severity, message);
}

export function listPermissionRequests(db) {
  const requests = db
    .prepare("SELECT * FROM permission_requests ORDER BY id")
    .all();
  return requests.map((req) => ({
    ...req,
    steps: db
      .prepare(
        "SELECT step, owner, status, note, sort_order FROM permission_steps WHERE request_id = ? ORDER BY sort_order",
      )
      .all(req.id),
  }));
}

// ---------------------------------------------------------------------------
// Users & sessions
// ---------------------------------------------------------------------------

export function getUserByUsername(db, username) {
  return db.prepare("SELECT * FROM users WHERE username = ?").get(username);
}

export function getUserById(db, id) {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id);
}

export function listUsers(db) {
  return db
    .prepare(
      "SELECT id, username, name, role, email, cyber_level, created_at FROM users ORDER BY id",
    )
    .all();
}

export function createUser(db, { username, passwordHash, name, role, email }) {
  const info = db
    .prepare(
      "INSERT INTO users (username, password_hash, name, role, email) VALUES (?, ?, ?, ?, ?)",
    )
    .run(username, passwordHash, name, role, email || null);
  return getUserById(db, Number(info.lastInsertRowid));
}

export function updateUserPassword(db, userId, passwordHash) {
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(
    passwordHash,
    userId,
  );
}

export function deleteUser(db, userId) {
  return db.prepare("DELETE FROM users WHERE id = ?").run(userId);
}

export function createSession(db, userId, token, expiresAt) {
  db.prepare(
    "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)",
  ).run(token, userId, expiresAt);
}

export function getSessionUser(db, token) {
  return db
    .prepare(
      `SELECT u.id, u.username, u.name, u.role, u.email, u.cyber_level, s.token AS session_token
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > ?`,
    )
    .get(token, new Date().toISOString());
}

export function deleteSession(db, token) {
  return db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
}
