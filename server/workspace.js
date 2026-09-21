import { randomUUID } from "node:crypto";
import { hashPassword } from "./password.js";

export const SOURCES = [
  {
    id: "intellipath",
    name: "IntelliPath",
    description: "Platform files and records",
    mode: "Local",
  },
  {
    id: "onedrive",
    name: "OneDrive",
    description: "Engineering files",
    mode: "Demo",
  },
  {
    id: "teams",
    name: "Teams",
    description: "People and collaboration",
    mode: "Demo",
  },
  {
    id: "sharepoint",
    name: "SharePoint",
    description: "Procedures and knowledge",
    mode: "Demo",
  },
  {
    id: "exchange",
    name: "Exchange",
    description: "Email and handovers",
    mode: "Demo",
  },
  {
    id: "defender",
    name: "Defender for Cloud",
    description: "Devices and security posture",
    mode: "Demo",
  },
  {
    id: "sentinel",
    name: "Microsoft Sentinel",
    description: "Incidents and alerts",
    mode: "Demo",
  },
];
export const AGENTS = [
  {
    id: "AGENT-DOCS",
    name: "Engineering Knowledge Agent",
    description: "Find files, procedures and maintenance knowledge.",
    kinds: ["Document", "Maintenance"],
    source: "onedrive",
    terms: "document file procedure manual drawing 文件 文档 图纸 资料 维护",
  },
  {
    id: "AGENT-PEOPLE",
    name: "Human Resources Agent",
    description: "Find colleagues by name, discipline, indoor workspace or outdoor assignment.",
    kinds: ["Person", "Location"],
    source: "teams",
    terms:
      "person people colleague engineer building floor room 人 同事 工程师 楼 房间",
  },
  {
    id: "AGENT-ASSETS",
    name: "Device & Equipment Agent",
    description: "Find devices, owners, serial numbers and equipment records.",
    kinds: ["Resource"],
    source: "defender",
    terms: "device asset equipment laptop serial 设备 电脑 资产",
  },
  {
    id: "AGENT-SECURITY",
    name: "Security Evidence Agent",
    description:
      "Collect authorized incidents, alerts and remediation evidence.",
    kinds: ["Incident", "Alert", "Remediation", "Log"],
    source: "sentinel",
    terms:
      "incident alert security remediation cybersecurity 事件 告警 安全 整改",
  },
  {
    id: "AGENT-MAIL",
    name: "Handover & Communications Agent",
    description: "Search simulated email records and shift handovers.",
    kinds: ["Email"],
    source: "exchange",
    terms: "email mail handover message 邮件 邮箱 交接 消息",
  },
];
export function sourceFor(record) {
  if (record.source_id) return record.source_id;
  return (
    {
      Person: "teams",
      Resource: "defender",
      Document: "sharepoint",
      Maintenance: "onedrive",
      Email: "exchange",
      Incident: "sentinel",
      Alert: "sentinel",
      Remediation: "sentinel",
      Log: "sentinel",
    }[record.kind] || "intellipath"
  );
}
export function agentRecords() {
  return AGENTS.map((a) => ({
    ...a,
    kind: "Agent",
    title: a.name,
    site: "Workspace",
    required_level: 1,
    status: "Local specialist",
    detail: a.description,
    content: `${a.description} ${a.terms}`,
    source_id: a.source,
    source_mode: "Demo connector",
  }));
}
export function migrateWorkspace(db) {
  for (const [name, ddl] of [
    ["building", "TEXT NOT NULL DEFAULT ''"],
    ["floor", "INTEGER"],
    ["room", "TEXT NOT NULL DEFAULT ''"],
    ["location_note", "TEXT NOT NULL DEFAULT 'Location not provided'"],
  ]) {
    if (
      !db
        .prepare("PRAGMA table_info(people)")
        .all()
        .some((c) => c.name === name)
    )
      db.exec(`ALTER TABLE people ADD COLUMN ${name} ${ddl}`);
  }
  if (
    !db
      .prepare("PRAGMA table_info(knowledge_records)")
      .all()
      .some((c) => c.name === "source_id")
  )
    db.exec("ALTER TABLE knowledge_records ADD COLUMN source_id TEXT");
  db.exec(`CREATE TABLE IF NOT EXISTS uploads (
    id TEXT PRIMARY KEY REFERENCES knowledge_records(id), filename TEXT NOT NULL, mime TEXT NOT NULL,
    bytes BLOB NOT NULL, size INTEGER NOT NULL, uploaded_by INTEGER NOT NULL,
    destination TEXT NOT NULL, created_at TEXT NOT NULL
  );`);
  if (db.prepare("SELECT 1 FROM operation_migrations WHERE version=2").get())
    return;
  db.exec("BEGIN");
  try {
    const people = db
      .prepare(
        "SELECT id,site FROM people WHERE id LIKE 'DEMO-PER-%' ORDER BY id",
      )
      .all();
    const update = db.prepare(
      "UPDATE people SET building=?,floor=?,room=?,location_note=? WHERE id=?",
    );
    people.forEach((p, i) =>
      update.run(
        i % 2 ? "Operations Block B" : "Engineering Block A",
        (i % 3) + 1,
        `${i % 2 ? "B" : "A"}-${(i % 3) + 1}0${(i % 4) + 1}`,
        "Demo assigned workspace; not live tracking or an actual Seatrium floor plan.",
        p.id,
      ),
    );
    const insert = db.prepare(
      "INSERT OR IGNORE INTO knowledge_records (id,kind,title,site,required_level,content,owner,status,updated_at,source_id) VALUES (?,?,?,?,?,?,?,?,?,?)",
    );
    for (let i = 1; i <= 15; i++) {
      const p = people[(i - 1) % people.length];
      insert.run(
        `DEMO-EMAIL-${String(i).padStart(3, "0")}`,
        "Email",
        `Engineering shift handover ${i}`,
        p.site,
        (i % 7) + 1,
        `Simulated Exchange message. Subject: vessel maintenance handover. Review the pump inspection checklist, confirm equipment isolation and contact the assigned engineering team in ${i % 2 ? "Engineering Block A" : "Operations Block B"}. This is demo content; no mailbox is connected.`,
        "Demo Shift Coordinator",
        "Demo message",
        new Date().toISOString(),
        "exchange",
      );
    }
    db.prepare(
      "INSERT OR IGNORE INTO users (username,password_hash,name,role,email,cyber_level) VALUES (?,?,?,?,?,?)",
    ).run(
      "engineer",
      hashPassword("Engineer@2026"),
      "Demo Engineer",
      "engineer",
      "engineer@example.invalid",
      4,
    );
    db.prepare("INSERT INTO operation_migrations VALUES (2)").run();
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
const EXTENSIONS = new Set([
  "txt",
  "md",
  "csv",
  "json",
  "pdf",
  "docx",
  "xlsx",
  "pptx",
  "png",
  "jpg",
  "jpeg",
]);
export function saveUpload(db, user, body) {
  const fail = (message, status = 400) => {
    throw Object.assign(new Error(message), { status });
  };
  if (
    !body ||
    typeof body.filename !== "string" ||
    typeof body.data !== "string"
  )
    fail("Choose a file to upload.");
  const filename = body.filename.trim();
  if (!filename || filename.length > 180 || /[\\/\x00-\x1f\x7f]/.test(filename))
    fail("Invalid filename.");
  const ext = filename.split(".").pop().toLowerCase();
  if (!EXTENSIONS.has(ext))
    fail(
      "Supported files: TXT, MD, CSV, JSON, PDF, DOCX, XLSX, PPTX, PNG and JPG.",
    );
  const level = body.required_level;
  if (!Number.isInteger(level) || level < 1 || level > user.cyber_level)
    fail("File classification must be within your account clearance.");
  if (!["local", "onedrive_demo"].includes(body.destination))
    fail("Choose platform storage or the OneDrive demo target.");
  if (
    typeof body.site !== "string" ||
    body.site.length > 150 ||
    typeof body.description !== "string" ||
    body.description.length > 2000
  )
    fail("Invalid file metadata.");
  if (
    !body.data.length ||
    body.data.length > Math.ceil(MAX_FILE_BYTES / 3) * 4 ||
    body.data.length % 4 ||
    /[^A-Za-z0-9+/=]/.test(body.data)
  )
    fail("Invalid file data or file exceeds 5 MB.");
  const bytes = Buffer.from(body.data, "base64");
  if (bytes.toString("base64") !== body.data) fail("Invalid file encoding.");
  if (!bytes.length || bytes.length > MAX_FILE_BYTES)
    fail("File must be between 1 byte and 5 MB.");
  const used = db
    .prepare("SELECT COALESCE(SUM(size),0) n FROM uploads WHERE uploaded_by=?")
    .get(user.id).n;
  const total = db
    .prepare("SELECT COALESCE(SUM(size),0) n FROM uploads")
    .get().n;
  if (
    used + bytes.length > 50 * 1024 * 1024 ||
    total + bytes.length > 100 * 1024 * 1024
  )
    fail("Demo storage limit reached (50 MB per uploader, 100 MB total).", 413);
  const isText = ["txt", "md", "csv", "json"].includes(ext);
  let extracted = "";
  if (isText) {
    try {
      extracted = new TextDecoder("utf-8", { fatal: true })
        .decode(bytes)
        .slice(0, 50000);
    } catch {
      fail("Text files must use UTF-8 encoding.");
    }
  }
  const now = new Date().toISOString(),
    id = `UPLOAD-${randomUUID()}`;
  const content = [
    body.description,
    `Uploaded file: ${filename}. ${bytes.length} bytes.`,
    isText
      ? "Searchable text (up to 50,000 characters):"
      : "Binary file: search uses filename and description; full text extraction is not enabled.",
    extracted,
  ]
    .filter(Boolean)
    .join("\n\n");
  db.exec("BEGIN");
  try {
    db.prepare(
      "INSERT INTO knowledge_records (id,kind,title,site,required_level,content,owner,status,updated_at,is_demo,source_id) VALUES (?,?,?,?,?,?,?,?,?,0,'intellipath')",
    ).run(
      id,
      "Document",
      filename,
      body.site || "Workspace",
      level,
      content,
      user.name,
      "Uploaded",
      now,
    );
    db.prepare("INSERT INTO uploads VALUES (?,?,?,?,?,?,?,?)").run(
      id,
      filename,
      "application/octet-stream",
      bytes,
      bytes.length,
      user.id,
      body.destination,
      now,
    );
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
  return {
    id,
    filename,
    size: bytes.length,
    required_level: level,
    storage: "IntelliPath",
    destination: body.destination,
    syncStatus:
      body.destination === "onedrive_demo"
        ? "Demo only — not sent to OneDrive"
        : "Stored locally",
    indexed: isText ? "text" : "metadata",
  };
}
