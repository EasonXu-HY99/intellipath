import { SITES } from "./sites.js";

export const DEFAULT_LEVELS = { admin: 7, manager: 6, analyst: 5, engineer: 4, viewer: 1 };
export function migrateOperations(db) {
  const add = (table, column, ddl) => {
    if (
      !db
        .prepare(`PRAGMA table_info(${table})`)
        .all()
        .some((c) => c.name === column)
    )
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`);
  };
  add("users", "cyber_level", "INTEGER NOT NULL DEFAULT 1");
  add("people", "required_level", "INTEGER NOT NULL DEFAULT 3");
  add("audit_logs", "required_level", "INTEGER NOT NULL DEFAULT 7");
  db.exec(`CREATE TABLE IF NOT EXISTS knowledge_records (
    id TEXT PRIMARY KEY, kind TEXT NOT NULL, title TEXT NOT NULL, site TEXT NOT NULL,
    required_level INTEGER NOT NULL CHECK(required_level BETWEEN 1 AND 7),
    content TEXT NOT NULL, resource_id TEXT, owner TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'info', status TEXT NOT NULL, updated_at TEXT NOT NULL,
    due_at TEXT, is_demo INTEGER NOT NULL DEFAULT 1
  ); CREATE TABLE IF NOT EXISTS operation_migrations (version INTEGER PRIMARY KEY);`);
  if (db.prepare("SELECT 1 FROM operation_migrations WHERE version=1").get())
    return;
  db.exec("BEGIN");
  try {
    for (const [role, level] of Object.entries(DEFAULT_LEVELS))
      db.prepare("UPDATE users SET cyber_level=? WHERE role=?").run(
        level,
        role,
      );
    db.prepare("UPDATE people SET required_level=MIN(cyber_level, 5)").run();
    const resource = db.prepare(`INSERT OR IGNORE INTO resources
      (id,name,type,status,owner,location,risk,permission,request_status,required_level,serial_number,manufacturer,model,ip_address,os,last_seen,health)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    const person = db.prepare(`INSERT OR IGNORE INTO people
      (id,name,type,company,site,assignment,status,valid_until,risk,cyber_level,department,email,required_level)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    const record = db.prepare(
      "INSERT OR IGNORE INTO knowledge_records (id,kind,title,site,required_level,content,resource_id,owner,severity,status,updated_at,due_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
    );
    const timestamp = new Date().toISOString();
    const names = [
      "Alicia",
      "Benjamin",
      "Cheryl",
      "Daniel",
      "Farah",
      "Grace",
      "Harish",
      "Irene",
      "Jason",
      "Kavitha",
      "Leon",
      "Mei",
    ];
    const surnames = ["Tan", "Lim", "Ng", "Wong", "Lee"];
    const departments = [
      "IT Operations",
      "OT Engineering",
      "Security Operations",
      "Maintenance",
      "HSE",
      "Corporate Services",
    ];
    for (const [s, site] of SITES.entries()) {
      for (let i = 0; i < 21; i++) {
        const n = s * 21 + i + 1,
          id = `DEMO-AST-${String(n).padStart(3, "0")}`,
          level = (i % 7) + 1;
        const type = [
          "Visitor kiosk",
          "Workstation",
          "Access reader",
          "Engineering laptop",
          "Camera",
          "OT gateway",
          "Core server",
        ][level - 1];
        const owner = departments[i % departments.length];
        resource.run(
          id,
          `${site.name.split(" / ")[0]} ${type} ${i + 1}`,
          type,
          i % 9 === 0 ? "Offline" : "Active",
          owner,
          site.name,
          i % 9 === 0 ? "High" : "Low",
          "Classified",
          "Approved",
          level,
          `DEMO-SN-${n}`,
          "Demo Systems",
          `Training-${level}`,
          `192.0.2.${n}`,
          "Demo OS",
          timestamp,
          i % 9 === 0 ? "Critical" : "Healthy",
        );
        if (i < 12)
          person.run(
            `DEMO-PER-${n}`,
            `${names[i]} ${surnames[s]} (Demo)`,
            "Employee",
            "Demo Workforce",
            site.name,
            `${type} support`,
            "Active",
            "2027-12-31",
            "Low",
            level,
            owner,
            `demo-${n}@example.invalid`,
            Math.min(level, 5),
          );
        const scenarios = [
          [
            "Document",
            "Operating procedure",
            "approved",
            "info",
            `Purpose: operate ${type} at ${site.name}. Pre-check: verify work order and identity. Procedure: inspect health, review logs, record findings. Escalation: notify ${owner}; never bypass clearance. Evidence: ${id}.`,
          ],
          [
            "Maintenance",
            "Preventive maintenance",
            "scheduled",
            "info",
            `Work order for ${id}. Inspect connections, validate firmware baseline, test backup and record completion evidence. Assigned team: ${owner}. Maintenance is not yet completed.`,
          ],
          [
            "Incident",
            "Endpoint anomaly",
            i % 3 === 0 ? "contained" : "investigating",
            i % 4 === 0 ? "critical" : "high",
            `SIMULATED incident affecting ${id}. Detection: unusual authentication sequence. Impact: potential service disruption; no confirmed data loss. Containment: isolate only after operations approval. Evidence: simulated EDR events. Owner: ${owner}.`,
          ],
          [
            "Alert",
            "Health / security signal",
            "open",
            i % 3 === 0 ? "high" : "warning",
            `SIMULATED alert for ${id}: ${i % 2 ? "patch baseline drift" : "repeated authentication failures"}. Triage with device owner; correlate logs before declaring an incident.`,
          ],
          [
            "Remediation",
            "Recovery action",
            i % 4 === 0 ? "verified" : "planned",
            "warning",
            `Remediate ${id}: validate configuration, patch in an approved window, restore from verified backup if required. Closure evidence: clean rescan, successful restore test and owner approval. ${i % 4 === 0 ? "Demo verification recorded." : "Verification still pending."}`,
          ],
        ];
        for (const [k, title, status, severity, content] of scenarios) {
          const rid = `DEMO-${k.toUpperCase()}-${String(n).padStart(3, "0")}`;
          const due = new Date(
            Date.now() + ((i % 3) - 1) * 86400000,
          ).toISOString();
          record.run(
            rid,
            k,
            `${title} - ${site.name.split(" / ")[0]} ${i + 1}`,
            site.name,
            level,
            content,
            id,
            owner,
            severity,
            status,
            timestamp,
            due,
          );
        }
        db.prepare(
          "INSERT INTO system_logs (timestamp,device_id,device_name,source,event_type,severity,message) VALUES (?,?,?,?,?,?,?)",
        ).run(
          timestamp,
          id,
          `${type} ${i + 1}`,
          "Demo telemetry",
          i % 2 ? "Baseline" : "Authentication",
          i % 5 === 0 ? "warning" : "info",
          `SIMULATED telemetry for ${id}: ${i % 5 === 0 ? "investigation required" : "baseline check completed"}.`,
        );
      }
    }
    db.prepare("INSERT INTO operation_migrations VALUES (1)").run();
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
