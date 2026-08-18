import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { seedDatabase } from "./seed.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Database file location. Defaults to <project>/data/intellipath.db
const DB_PATH =
  process.env.DB_PATH || path.join(__dirname, "..", "data", "intellipath.db");

if (DB_PATH !== ":memory:") {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

export const db = new DatabaseSync(DB_PATH);

// Enable foreign keys + WAL for better concurrency (WAL is a no-op for :memory:)
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
`;

db.exec(SCHEMA);

// Seed demo data on first boot (idempotent).
seedDatabase(db);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function canAccess(userLevel, requiredLevel) {
  return userLevel >= requiredLevel;
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

export function listAuditLogs(db) {
  return db
    .prepare("SELECT * FROM audit_logs ORDER BY id DESC LIMIT 200")
    .all();
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
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  ).run(key, value);
}

export function logAudit(db, { user, action, result }) {
  const time = new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return db
    .prepare(
      "INSERT INTO audit_logs (time, user, action, result) VALUES (?, ?, ?, ?)"
    )
    .run(time, user, action, result);
}

export function listPermissionRequests(db) {
  const requests = db
    .prepare("SELECT * FROM permission_requests ORDER BY id")
    .all();
  return requests.map((req) => ({
    ...req,
    steps: db
      .prepare(
        "SELECT step, owner, status, note, sort_order FROM permission_steps WHERE request_id = ? ORDER BY sort_order"
      )
      .all(req.id),
  }));
}
