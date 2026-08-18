import { useState } from "react";
import { api } from "../api.js";
import { useApi } from "../hooks.js";
import { Card, SectionTitle, Spinner, ErrorBox, StatusBadge, Toast } from "../components/ui.jsx";

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

export default function Audit() {
  const logs = useApi(api.getAuditLogs);
  const [toast, setToast] = useState(null);

  function exportLogs() {
    const rows = (logs.data?.logs || []).map((l) => [l.time, l.user, l.action, l.result]);
    downloadCsv("intellipath-audit-logs.csv", [
      ["Time", "User", "Action", "Result"],
      ...rows,
    ]);
    setToast("Audit logs exported.");
    setTimeout(() => setToast(null), 3000);
  }

  return (
    <div>
      <SectionTitle
        title="Audit Logs"
        subtitle="Track operational activity, AI actions, resource updates, and enterprise system events."
        action={
          <button onClick={exportLogs} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm">
            Export Logs
          </button>
        }
      />

      <Card className="overflow-hidden">
        {logs.loading ? (
          <Spinner />
        ) : logs.error ? (
          <div className="p-6">
            <ErrorBox error={logs.error} onRetry={logs.reload} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  {["Time", "User", "Action", "Result"].map((h) => (
                    <th key={h} className="text-left p-4 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(logs.data?.logs || []).map((log) => (
                  <tr key={log.id} className="border-t border-slate-100">
                    <td className="p-4 font-medium">{log.time}</td>
                    <td className="p-4">{log.user}</td>
                    <td className="p-4">{log.action}</td>
                    <td className="p-4"><StatusBadge status={log.result} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
