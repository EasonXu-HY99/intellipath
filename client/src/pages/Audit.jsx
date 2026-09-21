import { useState } from "react";
import { ScrollText, Terminal, Download } from "lucide-react";
import { api } from "../api.js";
import { useApi } from "../hooks.js";
import { GlassCard, SectionTitle, Spinner, ErrorBox, StatusBadge, Toast, GhostButton } from "../components/ui.jsx";

function downloadCsv(filename, rows) {
  const csv = rows
    .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const SEV = { info: "sky", warning: "amber", critical: "rose", error: "rose" };

export default function Audit() {
  const [tab, setTab] = useState("audit");
  const audit = useApi(api.getAuditLogs);
  const system = useApi(api.getSystemLogs);
  const [toast, setToast] = useState(null);

  function exportLogs() {
    if (tab === "audit") {
      const rows = (audit.data?.logs || []).map((l) => [l.time, l.user, l.action, l.result, l.category]);
      downloadCsv("intellipath-audit-logs.csv", [["Time", "User", "Action", "Result", "Category"], ...rows]);
    } else {
      const rows = (system.data?.logs || []).map((l) => [l.timestamp, l.device_name, l.source, l.event_type, l.severity, l.message]);
      downloadCsv("intellipath-system-logs.csv", [["Time", "Device", "Source", "Event", "Severity", "Message"], ...rows]);
    }
    setToast("Logs exported.");
    setTimeout(() => setToast(null), 3000);
  }

  return (
    <div>
      <SectionTitle
        title="Activity Log"
        subtitle="Track operational activity, AI actions, device events, and enterprise system records."
        icon={ScrollText}
        action={<GhostButton onClick={exportLogs}><span className="inline-flex items-center gap-2"><Download className="w-4 h-4" /> Export</span></GhostButton>}
      />

      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setTab("audit")}
          className={`px-4 py-2 rounded-xl text-sm font-medium inline-flex items-center gap-2 transition ${tab === "audit" ? "brand-fill text-slate-900 border border-slate-200" : "glass-soft text-slate-600 hover:text-slate-900"}`}
        >
          <ScrollText className="w-4 h-4" /> Audit Trail
        </button>
        <button
          onClick={() => setTab("system")}
          className={`px-4 py-2 rounded-xl text-sm font-medium inline-flex items-center gap-2 transition ${tab === "system" ? "brand-fill text-slate-900 border border-slate-200" : "glass-soft text-slate-600 hover:text-slate-900"}`}
        >
          <Terminal className="w-4 h-4" /> System & Device Logs
        </button>
      </div>

      <GlassCard className="overflow-hidden">
        {tab === "audit" ? (
          audit.loading ? (
            <Spinner />
          ) : audit.error ? (
            <div className="p-6"><ErrorBox error={audit.error} onRetry={audit.reload} /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[820px]">
                <thead className="bg-slate-100 text-slate-600">
                  <tr>
                    {["Time", "User", "Action", "Category", "Result"].map((h) => (
                      <th key={h} className="text-left p-4 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(audit.data?.logs || []).map((log) => (
                    <tr key={log.id} className="border-t border-slate-200">
                      <td className="p-4 font-mono text-xs text-slate-600 whitespace-nowrap">{log.time}</td>
                      <td className="p-4 text-slate-700">{log.user}</td>
                      <td className="p-4 text-slate-700">{log.action}</td>
                      <td className="p-4"><span className="text-xs text-slate-500 uppercase">{log.category}</span></td>
                      <td className="p-4"><StatusBadge status={log.result} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : system.loading ? (
          <Spinner />
        ) : system.error ? (
          <div className="p-6"><ErrorBox error={system.error} onRetry={system.reload} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  {["Time", "Device", "Source", "Event", "Severity", "Message"].map((h) => (
                    <th key={h} className="text-left p-4 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(system.data?.logs || []).map((log) => (
                  <tr key={log.id} className="border-t border-slate-200">
                    <td className="p-4 font-mono text-xs text-slate-600 whitespace-nowrap">{log.timestamp}</td>
                    <td className="p-4">
                      <p className="text-slate-700 font-medium">{log.device_name}</p>
                      <p className="text-xs text-slate-500 font-mono">{log.device_id}</p>
                    </td>
                    <td className="p-4 text-slate-600">{log.source}</td>
                    <td className="p-4 text-slate-700">{log.event_type}</td>
                    <td className="p-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs border ${
                        SEV[log.severity] === "rose" ? "bg-rose-400/10 text-rose-700 border-rose-400/20"
                        : SEV[log.severity] === "amber" ? "bg-amber-400/10 text-amber-800 border-amber-400/20"
                        : "bg-sky-400/10 text-sky-700 border-sky-400/20"
                      }`}>{log.severity}</span>
                    </td>
                    <td className="p-4 text-slate-600">{log.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
