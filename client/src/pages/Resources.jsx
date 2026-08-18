import { useState } from "react";
import { api } from "../api.js";
import { useApi } from "../hooks.js";
import { iconMap } from "../icons.js";
import {
  Card,
  IconBox,
  Metric,
  SectionTitle,
  Spinner,
  ErrorBox,
  StatusBadge,
  Toast,
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
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputCls =
  "w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300";

export default function Resources() {
  const [userId, setUserId] = useState(null); // null → backend default (first person)
  const res = useApi(() => api.getResources(userId || undefined), [userId]);
  const metrics = useApi(api.getMetrics);
  const rules = useApi(api.getLevelRules);
  const requests = useApi(api.getPermissionRequests);
  const people = useApi(api.getPeople);

  const [toast, setToast] = useState(null);
  const [showRequest, setShowRequest] = useState(false);
  const [showResource, setShowResource] = useState(false);

  // New permission request form state
  const [reqResource, setReqResource] = useState("");
  const [reqPerson, setReqPerson] = useState("");
  const [reqNote, setReqNote] = useState("");

  // New resource form state
  const [rName, setRName] = useState("");
  const [rType, setRType] = useState("Device");
  const [rStatus, setRStatus] = useState("Active");
  const [rOwner, setROwner] = useState("");
  const [rLocation, setRLocation] = useState("");
  const [rRisk, setRRisk] = useState("Low");
  const [rPermission, setRPermission] = useState("Assigned");
  const [rRequestStatus, setRRequestStatus] = useState("Not Requested");
  const [rLevel, setRLevel] = useState(1);

  function notify(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function submitRequest() {
    if (!reqResource || !reqPerson) {
      notify("Choose a resource and a requester.");
      return;
    }
    try {
      await api.createPermissionRequest({
        resourceId: reqResource,
        requesterId: reqPerson,
        title: reqNote || "Access request",
      });
      setShowRequest(false);
      notify("Permission request submitted.");
      requests.reload();
      res.reload();
    } catch (e) {
      notify(`Error: ${e.message}`);
    }
  }

  async function submitResource() {
    if (!rName || !rOwner) {
      notify("Name and owner are required.");
      return;
    }
    try {
      await api.createResource({
        name: rName,
        type: rType,
        status: rStatus,
        owner: rOwner,
        location: rLocation || "—",
        risk: rRisk,
        permission: rPermission,
        request_status: rRequestStatus,
        required_level: Number(rLevel),
      });
      setShowResource(false);
      notify("Resource created.");
      res.reload();
      metrics.reload();
    } catch (e) {
      notify(`Error: ${e.message}`);
    }
  }

  function exportResources() {
    const rows = (res.data?.resources || []).map((r) => [
      r.id, r.name, r.type, r.status, r.owner, r.location, r.permission,
      `Level ${r.required_level}`, r.accessResult, r.request_status,
    ]);
    downloadCsv("intellipath-resources.csv", [
      ["ID", "Resource", "Type", "Status", "Owner", "Location", "Permission", "Required Level", "Access", "Request Status"],
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
        subtitle="Track resources together with permission ownership, cybersecurity level, request status, approval flow, and operational usage."
        action={
          <div className="flex gap-2">
            <button onClick={() => setShowResource(true)} className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm">
              New Resource
            </button>
            <button onClick={() => setShowRequest(true)} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm">
              New Permission Request
            </button>
          </div>
        }
      />

      {metrics.loading ? (
        <Spinner />
      ) : metrics.error ? (
        <ErrorBox error={metrics.error} onRetry={metrics.reload} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Metric icon={iconMap.database} title="Tracked Resources" value={rc?.tracked} note="Assets, devices, tools, systems, and shared resources" />
          <Metric icon={iconMap.users} title="Active Permissions" value={rc?.activePermissions} note="Assigned to employees, contractors, and teams" />
          <Metric icon={iconMap.lock} title="Highest Level" value={rc?.highestLevel} note="Level 7 can access Level 7 and below" />
          <Metric icon={iconMap.activity} title="Pending Reviews" value={rc?.pendingReviews} note="Permission requests awaiting validation" />
        </div>
      )}

      <Card className="p-6 mb-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div>
            <h2 className="font-semibold text-slate-900">Cybersecurity Level Rule</h2>
            <p className="text-sm text-slate-500 mt-1">
              Access is granted only when the user cybersecurity level is equal to or higher than the resource required level.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2">
            {(rules.data?.rules || []).map((rule) => (
              <div key={rule.level} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <p className="font-bold text-slate-900">L{rule.level}</p>
                <p className="text-[10px] text-slate-500 mt-1">Access ≤ {rule.level}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-slate-900">Resource & Permission Registry</h2>
            <p className="text-sm text-slate-500 mt-1">
              Shows resource ownership, permission statement, required cybersecurity level, and access result for{" "}
              {user?.name || "the selected user"}.
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <select
              value={userId || ""}
              onChange={(e) => setUserId(e.target.value || null)}
              className="px-3 py-2 text-sm rounded-xl border border-slate-200"
            >
              <option value="">Default user</option>
              {(people.data?.people || []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (L{p.cyber_level})
                </option>
              ))}
            </select>
            <button onClick={exportResources} className="px-3 py-2 text-sm rounded-xl border border-slate-200">
              Export
            </button>
            <button onClick={() => { res.reload(); notify("Synced with backend."); }} className="px-3 py-2 text-sm rounded-xl border border-slate-200">
              Sync Data
            </button>
          </div>
        </div>

        {res.loading ? (
          <Spinner />
        ) : res.error ? (
          <div className="p-6">
            <ErrorBox error={res.error} onRetry={res.reload} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1150px]">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  {["ID", "Resource", "Type", "Status", "Owner", "Location", "Permission Statement", "Required Level", "User Level", "Access Result", "Request Status"].map((h) => (
                    <th key={h} className="text-left p-4 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {resourceRows.map((r) => {
                  const allowed = r.accessResult === "Approved";
                  return (
                    <tr key={r.id} className="border-t border-slate-100 align-top">
                      <td className="p-4 font-medium">{r.id}</td>
                      <td className="p-4">{r.name}</td>
                      <td className="p-4">{r.type}</td>
                      <td className="p-4"><StatusBadge status={r.status} /></td>
                      <td className="p-4">{r.owner}</td>
                      <td className="p-4">{r.location}</td>
                      <td className="p-4">
                        <div className="font-medium text-slate-800">{r.permission}</div>
                        <div className="text-xs text-slate-500 mt-1">Defines who can use, approve, or maintain this resource.</div>
                      </td>
                      <td className="p-4"><span className="font-semibold text-slate-900">Level {r.required_level}</span></td>
                      <td className="p-4"><span className="font-semibold text-slate-900">Level {r.userLevel}</span></td>
                      <td className="p-4"><StatusBadge status={allowed ? "Allowed" : "Denied"} /></td>
                      <td className="p-4"><StatusBadge status={r.request_status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-6">
        <Card className="p-6 xl:col-span-2">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h3 className="font-semibold text-slate-900">Permission Request Flow</h3>
              <p className="text-sm text-slate-500 mt-1">
                {currentRequest ? currentRequest.title : "No open request."}
              </p>
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
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border ${
                        step.status === "Completed"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : step.status === "In Review"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-slate-50 text-slate-500 border-slate-200"
                      }`}
                    >
                      {index + 1}
                    </div>
                    {index < currentRequest.steps.length - 1 && (
                      <div className="w-px h-12 bg-slate-200 mt-2" />
                    )}
                  </div>
                  <div className="flex-1 pb-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-slate-900">{step.step}</p>
                        <p className="text-xs text-slate-500">Owner: {step.owner}</p>
                      </div>
                      <StatusBadge status={step.status} />
                    </div>
                    <p className="text-sm text-slate-500 mt-2">{step.note}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No permission requests yet.</p>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Cybersecurity Access Statement</h3>
          {user ? (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-4">
              <p className="text-sm text-slate-700">
                <b>User:</b> {user.name}<br />
                <b>User Level:</b> Level {user.cyber_level}<br />
                <b>Resource:</b> Pump Unit-A12<br />
                <b>Required Level:</b> Level 6<br />
                <b>Access Result:</b> {user.cyber_level >= 6 ? "Allowed" : "Denied"}<br />
                <b>Rule:</b> User level must be equal to or higher than required resource level.
              </p>
            </div>
          ) : null}
          <h3 className="font-semibold text-slate-900 mb-3">AI Insight</h3>
          <p className="text-sm text-slate-500">
            {user
              ? `${user.name} can access Level ${user.cyber_level} and below resources. They can access Pump Unit-A12, but cannot access Server-SG01 because that resource requires Level 7 clearance.`
              : "Select a user to see their access posture."}
          </p>
        </Card>
      </div>

      {showRequest && (
        <Modal title="New Permission Request" onClose={() => setShowRequest(false)}>
          <div className="space-y-4">
            <Field label="Resource">
              <select value={reqResource} onChange={(e) => setReqResource(e.target.value)} className={inputCls}>
                <option value="">Select resource…</option>
                {(res.data?.resources || []).map((r) => (
                  <option key={r.id} value={r.id}>{r.name} (Level {r.required_level})</option>
                ))}
              </select>
            </Field>
            <Field label="Requester">
              <select value={reqPerson} onChange={(e) => setReqPerson(e.target.value)} className={inputCls}>
                <option value="">Select person…</option>
                {(people.data?.people || []).map((p) => (
                  <option key={p.id} value={p.id}>{p.name} (Level {p.cyber_level})</option>
                ))}
              </select>
            </Field>
            <Field label="Purpose / note">
              <textarea
                value={reqNote}
                onChange={(e) => setReqNote(e.target.value)}
                rows={3}
                className={inputCls}
                placeholder="e.g. Maintenance access for Pump Unit-A12"
              />
            </Field>
            <button onClick={submitRequest} className="w-full px-4 py-3 rounded-xl bg-slate-900 text-white text-sm">
              Submit Request
            </button>
          </div>
        </Modal>
      )}

      {showResource && (
        <Modal title="New Resource" onClose={() => setShowResource(false)}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name">
              <input value={rName} onChange={(e) => setRName(e.target.value)} className={inputCls} placeholder="Pump Unit-B14" />
            </Field>
            <Field label="Type">
              <select value={rType} onChange={(e) => setRType(e.target.value)} className={inputCls}>
                {["Device", "Badge", "Equipment", "Server", "Camera", "Tool", "System"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select value={rStatus} onChange={(e) => setRStatus(e.target.value)} className={inputCls}>
                {["Active", "Assigned", "Maintenance", "Offline"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Owner">
              <input value={rOwner} onChange={(e) => setROwner(e.target.value)} className={inputCls} placeholder="Maintenance Team" />
            </Field>
            <Field label="Location">
              <input value={rLocation} onChange={(e) => setRLocation(e.target.value)} className={inputCls} placeholder="Workshop" />
            </Field>
            <Field label="Risk">
              <select value={rRisk} onChange={(e) => setRRisk(e.target.value)} className={inputCls}>
                {["Low", "Medium", "High"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Permission">
              <input value={rPermission} onChange={(e) => setRPermission(e.target.value)} className={inputCls} placeholder="Assigned" />
            </Field>
            <Field label="Request Status">
              <select value={rRequestStatus} onChange={(e) => setRRequestStatus(e.target.value)} className={inputCls}>
                {["Approved", "In Review", "Escalated", "Not Requested", "Pending"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Required Level">
              <select value={rLevel} onChange={(e) => setRLevel(Number(e.target.value))} className={inputCls}>
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <option key={n} value={n}>Level {n}</option>
                ))}
              </select>
            </Field>
          </div>
          <button onClick={submitResource} className="w-full mt-5 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm">
            Create Resource
          </button>
        </Modal>
      )}

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
