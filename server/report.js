import { accessName } from "../shared/access.js";
import PDFDocument from "pdfkit";
import { catalog, severityRank } from "./operations.js";

export function reportingWindow(date) {
  const day =
    date ||
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Singapore",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(day) ||
    Number.isNaN(Date.parse(`${day}T00:00:00+08:00`)) ||
    new Date(`${day}T00:00:00Z`).toISOString().slice(0, 10) !== day
  )
    throw new Error("Invalid report date.");
  const start = new Date(`${day}T00:00:00+08:00`);
  return { day, start, end: new Date(start.getTime() + 86400000) };
}
export function buildReport(s, config, user, date) {
  const w = reportingWindow(date),
    at = new Date().toISOString();
  const inDay = (v) => {
    const d = new Date(v?.includes("T") ? v : `${v?.replace(" ", "T")}+08:00`);
    return d >= w.start && d < w.end;
  };
  const incidents = s.records.filter(
    (r) =>
      r.kind === "Incident" &&
      new Date(r.updated_at) < w.end &&
      (inDay(r.updated_at) || !["closed", "resolved"].includes(r.status)),
  );
  const alerts = s.records.filter(
    (r) =>
      r.kind === "Alert" &&
      new Date(r.updated_at) < w.end &&
      (inDay(r.updated_at) || r.status === "open"),
  );
  const remediation = s.records.filter(
    (r) =>
      r.kind === "Remediation" &&
      new Date(r.updated_at) < w.end &&
      (inDay(r.updated_at) || r.status !== "verified"),
  );
  return {
    s,
    config,
    user,
    window: w,
    generatedAt: at,
    incidents,
    alerts,
    remediation,
    logs: s.logs.filter((l) => inDay(l.timestamp)),
    audit: s.audit.filter((a) => inDay(a.time)),
  };
}
export function reportPDF(report) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
        size: "A4",
        margin: 42,
        bufferPages: true,
        info: {
          Title: "IntelliPath Cybersecurity Daily Report",
          Author: "IntelliPath",
        },
      }),
      chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    const { s, config, user, window: w } = report;
    const clean = (v) => String(v ?? "-").replace(/[^\x20-\x7e\n]/g, " ");
    const ensure = (h) => {
      if (doc.y + h > 770) doc.addPage();
    };
    const para = (text, size = 9, color = "#334155") => {
      doc.font("Helvetica").fontSize(size).fillColor(color);
      const t = clean(text),
        h = doc.heightOfString(t, { width: 510 });
      ensure(h + 8);
      doc.text(t, { width: 510 });
      doc.moveDown(0.55);
    };
    const heading = (t) => {
      ensure(58);
      doc.moveDown(0.6);
      doc.font("Helvetica-Bold").fontSize(16).fillColor("#0e7490").text(t);
      doc.moveDown(0.5);
    };
    const rows = (items, format) => {
      if (!items.length) para("No authorized records in this section.");
      items.forEach((x) => {
        const [title, ...body] = clean(format(x)).split("\n");
        const highlighted = ["Incident", "Alert", "Remediation"].includes(
          x.kind,
        );
        if (!highlighted) {
          para(format(x), 8);
          return;
        }
        doc.font("Helvetica").fontSize(8);
        ensure(
          doc.heightOfString(body.join("\n"), { width: 510 }) +
            doc.heightOfString(title, { width: 510 }) +
            28,
        );
        const color =
          x.severity === "critical"
            ? "#be123c"
            : x.kind === "Remediation"
              ? "#0f766e"
              : "#9a3412";
        doc
          .font("Helvetica-Bold")
          .fontSize(8.5)
          .fillColor(color)
          .text(title, { width: 510 });
        doc.moveDown(0.3);
        para(body.join("\n"), 8);
      });
    };
    doc.rect(0, 0, 595, 155).fill("#0b1730");
    doc
      .fillColor("#67e8f9")
      .fontSize(11)
      .text("INTELLIPATH  /  SECURITY OPERATIONS", 42, 36);
    doc
      .fillColor("white")
      .font("Helvetica-Bold")
      .fontSize(25)
      .text("Cybersecurity Daily Report", 42, 65);
    doc
      .font("Helvetica")
      .fontSize(11)
      .text(`${w.day} | Singapore (UTC+08:00) | ${accessName(s.level)}`, 42, 108);
    doc.y = 180;
    para(
      `Prepared for ${user.name} (${user.role}) | Generated ${report.generatedAt}`,
    );
    para(
      `Reporting window: ${w.start.toISOString()} inclusive to ${w.end.toISOString()} exclusive. Daily activity plus unresolved incident/alert/remediation carry-over. Inventory is a current snapshot, not a historical reconstruction.`,
    );
    para(
      "DEMONSTRATION DATA. Synthetic incidents and telemetry illustrate workflows and are not evidence of actual Seatrium security events. Site addresses are public directory information. This report is organized by NIST CSF 2.0 functions; it is not a compliance certification.",
      9,
      "#9a3412",
    );
    heading("01 / Executive overview");
    para(
      `${s.resources.length} assets | ${s.people.length} people | ${report.incidents.length} incidents | ${report.alerts.length} alerts | ${report.remediation.length} remediation actions`,
    );
    para(
      `Critical/high incidents: ${report.incidents.filter((r) => severityRank[r.severity] >= 2).length}. Unverified remediation: ${report.remediation.filter((r) => r.status !== "verified").length}. Overdue unverified actions: ${report.remediation.filter((r) => r.status !== "verified" && new Date(r.due_at) < new Date(report.generatedAt)).length}.`,
    );
    heading("02 / GOVERN - Scope and accountability");
    para(
      `Record visibility is enforced by server-side classification: user level >= record level. Report scope: ${accessName(s.level)}. Hidden records, counts and contents are excluded. Role permissions govern actions separately. Each action below has an accountable team; completion requires verification evidence.`,
    );
    heading("03 / IDENTIFY - Assets and exposure");
    rows(
      s.sites,
      (x) =>
        `${x.name} | ${x.address} | ${s.resources.filter((r) => r.location === x.name).length} visible assets`,
    );
    para(
      `High-risk assets: ${s.resources.filter((r) => r.risk === "High").length}. Offline assets: ${s.resources.filter((r) => r.status === "Offline").length}. Personnel records do not represent physical attendance.`,
    );
    heading("04 / PROTECT - Access governance");
    rows(
      s.requests,
      (r) =>
        `Request ${r.id}: ${r.title} | ${r.overall_status}\n${r.steps.map((x) => `${x.step}: ${x.status}`).join(" / ")}`,
    );
    para(
      "Viewer is the minimum access group; Admin covers all five access groups. Administrative privileges do not come from selecting a person in a preview. Physical site admission requires separate approval.",
    );
    heading("05 / DETECT - Alert register");
    para(
      "Alerts are signals requiring triage; an alert alone does not confirm compromise. All severities are included in the report, regardless of dashboard alert threshold.",
    );
    rows(
      report.alerts,
      (r) =>
        `[${r.severity.toUpperCase()}] ${r.id} | ${r.title} | ${accessName(r.required_level)}\n${r.content} Status: ${r.status}. Updated: ${r.updated_at}.`,
    );
    heading("06 / RESPOND - Incident register");
    rows(
      [...report.incidents].sort(
        (a, b) => severityRank[b.severity] - severityRank[a.severity],
      ),
      (r) =>
        `[${r.severity.toUpperCase()}] ${r.id} | ${r.title}\n${r.content} Status: ${r.status}. Owner: ${r.owner}. Updated: ${r.updated_at}.`,
    );
    heading("07 / RECOVER - Remediation and verification");
    rows(
      report.remediation,
      (r) =>
        `${r.id} | ${r.status.toUpperCase()} | Owner: ${r.owner} | Due: ${r.due_at}\n${r.content}`,
    );
    if (config.reportLogs) {
      heading("08 / Daily evidence timeline");
      rows(
        report.logs,
        (r) => `${r.timestamp} | ${r.severity} | ${r.device_id} | ${r.message}`,
      );
      heading("Daily audit trail");
      rows(
        report.audit,
        (r) => `${r.time} | ${r.user} | ${r.action} | ${r.result}`,
      );
    } else {
      heading("08 / Evidence timeline");
      para("Detailed logs omitted by report settings.");
    }
    if (config.reportAppendix) {
      heading("09 / Full authorized inventory and knowledge appendix");
      rows(
        catalog(s).filter(
          (r) =>
            !["Incident", "Alert", "Remediation", "Log", "Audit"].includes(
              r.kind,
            ),
        ),
        (r) =>
          `[${r.kind} / ${accessName(r.required_level)}] ${r.id} | ${r.title} | ${r.site}\n${r.detail}`,
      );
    } else {
      heading("09 / Inventory appendix");
      para("Inventory appendix omitted by report settings.");
    }
    heading("Sources and interpretation");
    para(
      "Site directory: https://www.seatrium.com/contact.php (verified 2026-09-20).\nFramework: https://www.nist.gov/cyberframework (CSF 2.0).\nRecord IDs refer to the authorized IntelliPath dataset. No external threat-intelligence or live sensor integration is implied.",
    );
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#64748b")
        .text(
          `INTELLIPATH | DEMO | ${accessName(s.level)} | ${w.day}                         ${i + 1} / ${pages.count}`,
          42,
          802,
          { lineBreak: false },
        );
    }
    doc.end();
  });
}
