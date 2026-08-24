import { useState } from "react";
import { Boxes, Database, Users, Lock, Activity, Plus, Download, RefreshCw, X } from "lucide-react";
import { api } from "../api.js";
import { useApi } from "../hooks.js";
import { useAuth } from "../auth.jsx";
import {
  GlassCard,
  IconBox,
  Metric,
  SectionTitle,
  Spinner,
  ErrorBox,
  StatusBadge,
  Toast,
  PrimaryButton,
  GhostButton,
  fieldCls,
} from "../components/ui.jsx";

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

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <GlassCard className="relative w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto" glow>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </GlassCard>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-slate-400">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const TYPES = ["Laptop", "Server", "Camera", "Network", "Equipment", "Badge", "Access Control", "Printer", "Tablet"];
const STATUSES = ["Active", "Assigned", "Maintenance", "Offline"];
const RISKS = ["Low", "Medium", "High"];
const REQUEST_STATUSES = ["Approved", "In Review", "Escalated", "Not Requested", "Pending"];

export default function Resources() {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission("resources.write");

  const [userId, setUserId] = useState(null);
  const res = useApi(() => api.getResources(userId || undefined), [userId]);
  const metrics = useApi(api.getMetrics);
  const rules = useApi(api.getLevelRules);
  const requests = useApi(api.getPermissionRequests);
  const people = useApi(api.getPeople);

  const [toast, setToast] = useState(null);
  const [showRequest, setShowRequest] = useState(false);
  const [showResource, setShowResource] = useState(false);

  const [reqResource, setReqResource] = useState("");
  const [reqPerson, setReqPerson] = useState("");
  const [reqNote, setReqNote] = useState("");

  const emptyResource = { name: "", type: "Laptop", status: "Active", owner: "", location: "", risk: "Low", permission: "Assigned", request_status: "Not Requested", required_level: 1, manufacturer: "", model: "", serial_number: "", ip_address: "", os: "", health: "Healthy" };
  const [r, setR] = useState(emptyResource);

  function notify(msg, kind = "success") {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 3000);
  }

  async function submitRequest() {
    if (!reqResource || !reqPerson) return notify("Choose a resource and a requester.", "error");
    try {
      await api.createPermissionRequest({ resourceId: reqResource, requesterId: reqPerson, title: reqNote || "Access request" });
      setShowRequest(false);
      notify("Permission request submitted.");
      requests.reload();
    } catch (e) {
      notify(e.message, "error");
    }
  }

  async function submitResource() {
    if (!r.name || !r.owner) return notify("Name and owner are required.", "error");
    try {
      await api.createResource({
        name: r.name, type: r.type, status: r.status, owner: r.owner, location: r.location,
        risk: r.risk, permission: r.permission, request_status: r.request_status,
        required_level: Number(r.required_level), manufacturer: r.manufacturer, model: r.model,
        serial_number: r.serial_number, ip_address: r.ip_address, os: r.os, health: r.health,
      });
      setShowResource(false);
      setR(emptyResource);
      notify("Resource created.");
      res.reload();
      metrics.reload();
    } catch (e) {
      notify(e.message, "error");
    }
  }

  function exportResources() {
    const rows = (res.data?.resources || []).map((x) => [
      x.id, x.name, `${x.manufacturer} ${x.model}`, x.type, x.status, x.owner, x.location,
      x.permission, x.health, `Level ${x.required_level}`, x.accessResult, x.request_status,
    ]);
    downloadCsv("intellipath-resources.csv", [
      ["ID", "Resource", "Make/Model", "Type", "Status", "Owner", "Location", "Permission", "Health", "Required Level", "Access", "Request Status"],
      ...rows,
    ]);
    notify("Resources exported.");
  }

  const rc = metrics.data?.resources;
  const user = res.data?.user;
  const resourceRows = res.data?.resources || [];
  const reqs = requests.data?.requests || [];
  const currentRequest = reqs[0];

  return (
    <div>
      <SectionTitle
        title="Resource Tracking"
        subtitle="Track devices, permission ownership, cybersecurity level, request status, and approval flow."
        icon={Boxes}
        action={
          canWrite && (
            <div className="flex gap-2">
              <GhostButton onClick={() => setShowResource(true)}>
                <span className="inline-flex items-center gap-2"><Plus className="w-4 h-4" /> New Resource</span>
              </GhostButton>
              <PrimaryButton onClick={() => setShowRequest(true)}>
                <span className="inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Permission Request</span>
              </PrimaryButton>
            </div>
          )
        }
      />

      {metrics.loading ? (
        <Spinner />
      ) : metrics.error ? (
        <ErrorBox error={metrics.error} onRetry={metrics.reload} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Metric icon={Database} title="Tracked Resources" value={rc?.tracked} note="Assets, devices, tools, and systems" tone="cyan" />
          <Metric icon={Users} title="Active Permissions" value={rc?.activePermissions} note="Assigned to employees and contractors" tone="emerald" />
          <Metric icon={Lock} title="Highest Level" value={rc?.highestLevel} note="Level 7 can access Level 7 and below" tone="violet" />
          <Metric icon={Activity} title="Pending Reviews" value={rc?.pendingReviews} note="Permission requests awaiting validation" tone="amber" />
        </div>
      )}

      <GlassCard className="p-6 mb-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div>
            <h2 className="font-display font-semibold text-white">Cybersecurity Level Rule</h2>
            <p className="text-sm text-slate-500 mt-1">
              Access is granted only when the user cybersecurity level is equal to or higher than the resource required level.
            </p>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
            {(rules.data?.rules || []).map((rule) => (
              <div key={rule.level} className="p-3 rounded-xl glass-soft text-center">
                <p className="font-display font-bold text-white">L{rule.level}</p>
                <p className="text-[10px] text-slate-500 mt-1">≤ {rule.level}</p>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      <GlassCard className="overflow-hidden">
        <div className="p-5 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="font-display font-semibold text-white">Device & Permission Registry</h2>
            <p className="text-sm text-slate-500 mt-1">
              Ownership, permission, required level, health, and access result for {user?.name || "the selected user"}.
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <select value={userId || ""} onChange={(e) => setUserId(e.target.value || null)} className={`${fieldCls} w-auto`}>
              <option value="">Default user</option>
              {(people.data?.people || []).map((p) => (
                <option key={p.id} value={p.id}>{p.name} (L{p.cyber_level})</option>
              ))}
            </select>
            <GhostButton onClick={exportResources}><Download className="w-4 h-4" /></GhostButton>
            <GhostButton onClick={() => { res.reload(); notify("Synced with backend."); }}><RefreshCw className="w-4 h-4" /></GhostButton>
          </div>
        </div>

        {res.loading ? (
          <Spinner />
        ) : res.error ? (
          <div className="p-6"><ErrorBox error={res.error} onRetry={res.reload} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1250px]">
              <thead className="bg-white/5 text-slate-400">
                <tr>
                  {["ID", "Resource", "Type", "Status", "Owner", "Location", "Permission", "Health", "Req. Level", "User Level", "Access", "Request"].map((h) => (
                    <th key={h} className="text-left p-4 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {resourceRows.map((x) => {
                  const allowed = x.accessResult === "Approved";
                  return (
                    <tr key={x.id} className="border-t border-white/5 align-top hover:bg-white/[0.02]">
                      <td className="p-4 font-mono text-xs text-slate-400">{x.id}</td>
                      <td className="p-4">
                        <p className="font-medium text-white">{x.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{x.manufacturer} {x.model}</p>
                      </td>
                      <td className="p-4 text-slate-300">{x.type}</td>
                      <td className="p-4"><StatusBadge status={x.status} /></td>
                      <td className="p-4 text-slate-300">{x.owner}</td>
                      <td className="p-4 text-slate-400">{x.location}</td>
                      <td className="p-4 text-slate-300">{x.permission}</td>
                      <td className="p-4"><StatusBadge status={x.health} /></td>
                      <td className="p-4"><span className="font-semibold text-white">L{x.required_level}</span></td>
                      <td className="p-4"><span className="text-slate-300">L{x.userLevel}</span></td>
                      <td className="p-4"><StatusBadge status={allowed ? "Allowed" : "Denied"} /></td>
                      <td className="p-4"><StatusBadge status={x.request_status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-6">
        <GlassCard className="p-6 xl:col-span-2">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h3 className="font-display font-semibold text-white">Permission Request Flow</h3>
              <p className="text-sm text-slate-500 mt-1">{currentRequest ? currentRequest.title : "No open request."}</p>
            </div>
            {currentRequest && <StatusBadge status={currentRequest.overall_status} />}
          </div>

          {requests.loading ? (
            <Spinner />
          ) : currentRequest ? (
            <div className="space-y-4">
              {currentRequest.steps.map((step, index) => (
                <div key={step.step} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border ${
                      step.status === "Completed" ? "bg-emerald-400/10 text-emerald-300 border-emerald-400/20"
                      : step.status === "In Review" ? "bg-amber-400/10 text-amber-300 border-amber-400/20"
                      : "bg-white/5 text-slate-500 border-white/10"
                    }`}>
                      {index + 1}
                    </div>
                    {index < currentRequest.steps.length - 1 && <div className="w-px h-12 bg-white/10 mt-2" />}
                  </div>
                  <div className="flex-1 pb-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-white">{step.step}</p>
                        <p className="text-xs text-slate-500">Owner: {step.owner}</p>
                      </div>
                      <StatusBadge status={step.status} />
                    </div>
                    <p className="text-sm text-slate-400 mt-2">{step.note}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No permission requests yet.</p>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="font-display font-semibold text-white mb-4">Access Statement</h3>
          {user ? (
            <div className="p-4 rounded-2xl glass-soft mb-4 text-sm text-slate-300">
              <p><span className="text-slate-500">User:</span> {user.name}</p>
              <p className="mt-1"><span className="text-slate-500">User Level:</span> Level {user.cyber_level}</p>
              <p className="mt-1"><span className="text-slate-500">Resource:</span> Pump Unit-A12</p>
              <p className="mt-1"><span className="text-slate-500">Required Level:</span> Level 6</p>
              <p className="mt-1">
                <span className="text-slate-500">Access Result:</span>{" "}
                <span className={user.cyber_level >= 6 ? "text-emerald-300" : "text-rose-300"}>
                  {user.cyber_level >= 6 ? "Allowed" : "Denied"}
                </span>
              </p>
            </div>
          ) : null}
          <h3 className="font-display font-semibold text-white mb-3">AI Insight</h3>
          <p className="text-sm text-slate-500">
            {user
              ? `${user.name} can access Level ${user.cyber_level} and below. They can access Pump Unit-A12 but not Server-SG01, which requires Level 7.`
              : "Select a user to see their access posture."}
          </p>
        </GlassCard>
      </div>

      {showRequest && (
        <Modal title="New Permission Request" onClose={() => setShowRequest(false)}>
          <div className="space-y-4">
            <Field label="Resource">
              <select value={reqResource} onChange={(e) => setReqResource(e.target.value)} className={fieldCls}>
                <option value="">Select resource…</option>
                {(res.data?.resources || []).map((x) => <option key={x.id} value={x.id}>{x.name} (Level {x.required_level})</option>)}
              </select>
            </Field>
            <Field label="Requester">
              <select value={reqPerson} onChange={(e) => setReqPerson(e.target.value)} className={fieldCls}>
                <option value="">Select person…</option>
                {(people.data?.people || []).map((p) => <option key={p.id} value={p.id}>{p.name} (Level {p.cyber_level})</option>)}
              </select>
            </Field>
            <Field label="Purpose / note">
              <textarea value={reqNote} onChange={(e) => setReqNote(e.target.value)} rows={3} className={fieldCls} placeholder="e.g. Maintenance access for Pump Unit-A12" />
            </Field>
            <PrimaryButton onClick={submitRequest} className="w-full">Submit Request</PrimaryButton>
          </div>
        </Modal>
      )}

      {showResource && (
        <Modal title="New Resource / Device" onClose={() => setShowResource(false)}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name"><input value={r.name} onChange={(e) => setR({ ...r, name: e.target.value })} className={fieldCls} placeholder="Pump Unit-B14" /></Field>
            <Field label="Type">
              <select value={r.type} onChange={(e) => setR({ ...r, type: e.target.value })} className={fieldCls}>
                {TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Manufacturer"><input value={r.manufacturer} onChange={(e) => setR({ ...r, manufacturer: e.target.value })} className={fieldCls} placeholder="Dell / Cisco / KSB…" /></Field>
            <Field label="Model"><input value={r.model} onChange={(e) => setR({ ...r, model: e.target.value })} className={fieldCls} placeholder="Latitude 5540" /></Field>
            <Field label="Serial number"><input value={r.serial_number} onChange={(e) => setR({ ...r, serial_number: e.target.value })} className={fieldCls} placeholder="DL-0000000" /></Field>
            <Field label="IP address"><input value={r.ip_address} onChange={(e) => setR({ ...r, ip_address: e.target.value })} className={fieldCls} placeholder="10.24.x.x" /></Field>
            <Field label="OS / firmware"><input value={r.os} onChange={(e) => setR({ ...r, os: e.target.value })} className={fieldCls} placeholder="Windows 11 Enterprise" /></Field>
            <Field label="Status">
              <select value={r.status} onChange={(e) => setR({ ...r, status: e.target.value })} className={fieldCls}>
                {STATUSES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Owner"><input value={r.owner} onChange={(e) => setR({ ...r, owner: e.target.value })} className={fieldCls} placeholder="Maintenance Team" /></Field>
            <Field label="Location"><input value={r.location} onChange={(e) => setR({ ...r, location: e.target.value })} className={fieldCls} placeholder="Workshop" /></Field>
            <Field label="Risk">
              <select value={r.risk} onChange={(e) => setR({ ...r, risk: e.target.value })} className={fieldCls}>
                {RISKS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Permission"><input value={r.permission} onChange={(e) => setR({ ...r, permission: e.target.value })} className={fieldCls} placeholder="Assigned" /></Field>
            <Field label="Request Status">
              <select value={r.request_status} onChange={(e) => setR({ ...r, request_status: e.target.value })} className={fieldCls}>
                {REQUEST_STATUSES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Health">
              <select value={r.health} onChange={(e) => setR({ ...r, health: e.target.value })} className={fieldCls}>
                {["Healthy", "Warning", "Critical"].map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Required Level">
              <select value={r.required_level} onChange={(e) => setR({ ...r, required_level: Number(e.target.value) })} className={fieldCls}>
                {[1, 2, 3, 4, 5, 6, 7].map((n) => <option key={n} value={n}>Level {n}</option>)}
              </select>
            </Field>
          </div>
          <PrimaryButton onClick={submitResource} className="w-full mt-5">Create Resource</PrimaryButton>
        </Modal>
      )}

      <Toast message={toast?.msg} kind={toast?.kind} onDismiss={() => setToast(null)} />
    </div>
  );
}
