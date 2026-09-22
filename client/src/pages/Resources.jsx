import { accessName } from "../../../shared/access.js";
import { useState } from "react";
import {
  Boxes,
  Database,
  Users,
  Lock,
  Activity,
  Plus,
  Download,
  RefreshCw,
  X,
} from "lucide-react";
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
    .map((r) =>
      r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","),
    )
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
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <GlassCard
        className="relative w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto"
        glow
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            {title}
          </h2>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-900">
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
      <span className="text-xs uppercase tracking-wider text-slate-600">
        {label}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const TYPES = [
  "Laptop",
  "Server",
  "Camera",
  "Network",
  "Equipment",
  "Badge",
  "Access Control",
  "Printer",
  "Tablet",
];
const STATUSES = ["Active", "Assigned", "Maintenance", "Offline"];
const RISKS = ["Low", "Medium", "High"];
const REQUEST_STATUSES = [
  "Approved",
  "In Review",
  "Escalated",
  "Not Requested",
  "Pending",
];

export default function Resources() {
  const { hasPermission, user: account } = useAuth();
  const canWrite = hasPermission("resources.write");

  const [userId, setUserId] = useState(null);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [requestId, setRequestId] = useState(null);
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

  const emptyResource = {
    name: "",
    type: "Laptop",
    status: "Active",
    owner: "",
    location: "",
    risk: "Low",
    permission: "Assigned",
    request_status: "Not Requested",
    required_level: 1,
    manufacturer: "",
    model: "",
    serial_number: "",
    ip_address: "",
    os: "",
    health: "Healthy",
  };
  const [r, setR] = useState(emptyResource);

  function notify(msg, kind = "success") {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 3000);
  }

  async function submitRequest() {
    if (!reqResource || !reqPerson)
      return notify("Choose a resource and a requester.", "error");
    try {
      await api.createPermissionRequest({
        resourceId: reqResource,
        requesterId: reqPerson,
        title: reqNote || "Access request",
      });
      setShowRequest(false);
      notify("Permission request submitted.");
      requests.reload();
    } catch (e) {
      notify(e.message, "error");
    }
  }

  async function submitResource() {
    if (!r.name || !r.owner)
      return notify("Name and owner are required.", "error");
    try {
      await api.createResource({
        name: r.name,
        type: r.type,
        status: r.status,
        owner: r.owner,
        location: r.location,
        risk: r.risk,
        permission: r.permission,
        request_status: r.request_status,
        required_level: Number(r.required_level),
        manufacturer: r.manufacturer,
        model: r.model,
        serial_number: r.serial_number,
        ip_address: r.ip_address,
        os: r.os,
        health: r.health,
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
      x.id,
      x.name,
      `${x.manufacturer} ${x.model}`,
      x.type,
      x.status,
      x.owner,
      x.location,
      x.permission,
      x.health,
      accessName(x.required_level),
      x.accessResult,
      x.request_status,
    ]);
    downloadCsv("intellipath-resources.csv", [
      [
        "ID",
        "Resource",
        "Make/Model",
        "Type",
        "Status",
        "Owner",
        "Location",
        "Permission",
        "Health",
        "Minimum role",
        "Access",
        "Request Status",
      ],
      ...rows,
    ]);
    notify("Resources exported.");
  }

  const rc = metrics.data?.resources;
  const user = res.data?.user;
  const filteredRows = (res.data?.resources || []).filter((r) =>
    [r.id, r.name, r.location, r.owner, r.type]
      .join(" ")
      .toLowerCase()
      .includes(filter.toLowerCase()),
  );
  const resourceRows = filteredRows.slice((page - 1) * 20, page * 20);
  const reqs = requests.data?.requests || [];
  const currentRequest =
    reqs.find((r) => r.id === Number(requestId)) || reqs[0];

  return (
    <div>
      <SectionTitle
        title="Asset Inventory"
        subtitle="Track devices, permission ownership, access role, request status, and approval flow."
        icon={Boxes}
        action={
          canWrite && (
            <div className="flex gap-2">
              <GhostButton onClick={() => setShowResource(true)}>
                <span className="inline-flex items-center gap-2">
                  <Plus className="w-4 h-4" /> New Resource
                </span>
              </GhostButton>
              <PrimaryButton onClick={() => setShowRequest(true)}>
                <span className="inline-flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Permission Request
                </span>
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
          <Metric
            icon={Database}
            title="Tracked Resources"
            value={rc?.tracked}
            note="Assets, devices, tools, and systems"
            tone="cyan"
          />
          <Metric
            icon={Users}
            title="Active Permissions"
            value={rc?.activePermissions}
            note="Assigned to employees and contractors"
            tone="emerald"
          />
          <Metric
            icon={Lock}
            title="Highest Access Role"
            value={accessName(rc?.highestLevel)}
            note="Admin can access every access group"
            tone="violet"
          />
          <Metric
            icon={Activity}
            title="Pending Reviews"
            value={rc?.pendingReviews}
            note="Permission requests awaiting validation"
            tone="amber"
          />
        </div>
      )}

      <GlassCard className="access-roles-panel mb-6">
        <div className="access-roles-heading">
          <div className="min-w-0">
            <h2 className="font-display font-semibold text-slate-900">
              Access roles
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Your role includes its own records and all lower access groups.
            </p>
          </div>
          <span className="access-current-role">{accessName(account.cyber_level)} access</span>
        </div>
          <div className="access-role-grid" aria-label="Access roles from highest to lowest">
            {(rules.data?.rules || []).map((rule) => (
              <div
                key={rule.level}
                title={rule.scope}
                className={`access-role-card ${rule.level > account.cyber_level ? "is-restricted" : "is-visible"} ${rule.level === account.cyber_level ? "is-current" : ""}`}
              >
                <p className="access-role-name">
                  {accessName(rule.level)}
                </p>
                <p className="access-role-status">
                  {rule.level <= account.cyber_level ? "Visible" : "Restricted"}
                </p>
              </div>
            ))}
          </div>
      </GlassCard>

      <GlassCard className="overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="font-display font-semibold text-slate-900">
              Device & Permission Registry
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Ownership, permission, minimum access role, health, and access result
              for {user?.name || "the selected user"}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <input
              aria-label="Filter resources"
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setPage(1);
              }}
              placeholder="Filter visible resources…"
              className={`${fieldCls} !w-auto`}
            />
            {account.role === "admin" && (
              <select
                aria-label="Preview person access"
                value={userId || ""}
                onChange={(e) => setUserId(e.target.value || null)}
                className={`${fieldCls} !w-auto max-w-60`}
              >
                <option value="">My account clearance</option>
                {(people.data?.people || []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({accessName(p.cyber_level)})
                  </option>
                ))}
              </select>
            )}
            <GhostButton onClick={exportResources}>
              <Download className="w-4 h-4" />
            </GhostButton>
            <GhostButton
              onClick={() => {
                res.reload();
                notify("Synced with backend.");
              }}
            >
              <RefreshCw className="w-4 h-4" />
            </GhostButton>
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
            <table className="w-full text-sm min-w-[1050px]">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  {[
                    "ID",
                    "Resource",
                    "Type",
                    "Status",
                    "Owner",
                    "Location",
                    "Permission",
                    "Health",
                    "Minimum Role",
                    "Access role",
                    "Access",
                    "Request",
                  ].map((h) => (
                    <th key={h} className="text-left p-4 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {resourceRows.map((x) => {
                  const allowed = x.accessResult === "Approved";
                  return (
                    <tr
                      key={x.id}
                      className="border-t border-slate-200 align-top hover:bg-white/[0.02]"
                    >
                      <td className="p-4 font-mono text-xs text-slate-600">
                        {x.id}
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-slate-900">{x.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {x.manufacturer} {x.model}
                        </p>
                      </td>
                      <td className="p-4 text-slate-700">{x.type}</td>
                      <td className="p-4">
                        <StatusBadge status={x.status} />
                      </td>
                      <td className="p-4 text-slate-700">{x.owner}</td>
                      <td className="p-4 text-slate-600">{x.location}</td>
                      <td className="p-4 text-slate-700">{x.permission}</td>
                      <td className="p-4">
                        <StatusBadge status={x.health} />
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-slate-900">
                          {accessName(x.required_level)}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-slate-700">{accessName(x.userLevel)}</span>
                      </td>
                      <td className="p-4">
                        <StatusBadge status={allowed ? "Allowed" : "Denied"} />
                      </td>
                      <td className="p-4">
                        <StatusBadge status={x.request_status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      <div className="flex flex-wrap justify-between items-center gap-3 mt-3 text-xs text-slate-600">
        <span>
          {filteredRows.length} visible matches · page {page} of{" "}
          {Math.max(1, Math.ceil(filteredRows.length / 20))}
          {userId
            ? " · Person preview does not change your record visibility"
            : ""}
        </span>
        <div className="flex gap-2">
          <button
            className="small-button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <button
            className="small-button"
            disabled={page * 20 >= filteredRows.length}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-6">
        <GlassCard className="p-6 xl:col-span-2">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h3 className="font-display font-semibold text-slate-900">
                Permission Request Flow
              </h3>
              <select
                aria-label="Select permission request"
                value={currentRequest?.id || ""}
                onChange={(e) => setRequestId(e.target.value)}
                className={`${fieldCls} mt-2`}
              >
                {reqs.map((r) => (
                  <option value={r.id} key={r.id}>
                    {r.title}
                  </option>
                ))}
              </select>
              <p className="text-sm text-slate-500 mt-1">
                {currentRequest ? currentRequest.title : "No open request."}
              </p>
            </div>
            {currentRequest && (
              <StatusBadge status={currentRequest.overall_status} />
            )}
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
                          ? "bg-emerald-400/10 text-emerald-700 border-emerald-400/20"
                          : step.status === "In Review"
                            ? "bg-amber-400/10 text-amber-800 border-amber-400/20"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}
                    >
                      {index + 1}
                    </div>
                    {index < currentRequest.steps.length - 1 && (
                      <div className="w-px h-12 bg-slate-100 mt-2" />
                    )}
                  </div>
                  <div className="flex-1 pb-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-slate-900">{step.step}</p>
                        <p className="text-xs text-slate-500">
                          Owner: {step.owner}
                        </p>
                      </div>
                      <StatusBadge status={step.status} />
                    </div>
                    <p className="text-sm text-slate-600 mt-2">{step.note}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              No permission requests yet.
            </p>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="font-display font-semibold text-slate-900 mb-4">
            Access Statement
          </h3>
          {user && <p className="p-4 rounded-xl glass-soft mb-4 text-sm">{user.name} · {accessName(user.cyber_level)} access</p>}
          <h3 className="font-display font-semibold text-slate-900 mb-3">
            AI Insight
          </h3>
          <p className="text-sm text-slate-500">
            {user
              ? `${user.name} has ${accessName(user.cyber_level)} access. This preview never expands your signed-in ${accessName(account.cyber_level)} access to records or exports.`
              : "Select a user to see their access posture."}
          </p>
        </GlassCard>
      </div>

      {showRequest && (
        <Modal
          title="New Permission Request"
          onClose={() => setShowRequest(false)}
        >
          <div className="space-y-4">
            <Field label="Resource">
              <select
                value={reqResource}
                onChange={(e) => setReqResource(e.target.value)}
                className={fieldCls}
              >
                <option value="">Select resource…</option>
                {(res.data?.resources || []).map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name} ({accessName(x.required_level)})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Requester">
              <select
                value={reqPerson}
                onChange={(e) => setReqPerson(e.target.value)}
                className={fieldCls}
              >
                <option value="">Select person…</option>
                {(people.data?.people || []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({accessName(p.cyber_level)})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Purpose / note">
              <textarea
                value={reqNote}
                onChange={(e) => setReqNote(e.target.value)}
                rows={3}
                className={fieldCls}
                placeholder="e.g. Maintenance access for Pump Unit-A12"
              />
            </Field>
            <PrimaryButton onClick={submitRequest} className="w-full">
              Submit Request
            </PrimaryButton>
          </div>
        </Modal>
      )}

      {showResource && (
        <Modal
          title="New Resource / Device"
          onClose={() => setShowResource(false)}
        >
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name">
              <input
                value={r.name}
                onChange={(e) => setR({ ...r, name: e.target.value })}
                className={fieldCls}
                placeholder="Pump Unit-B14"
              />
            </Field>
            <Field label="Type">
              <select
                value={r.type}
                onChange={(e) => setR({ ...r, type: e.target.value })}
                className={fieldCls}
              >
                {TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Manufacturer">
              <input
                value={r.manufacturer}
                onChange={(e) => setR({ ...r, manufacturer: e.target.value })}
                className={fieldCls}
                placeholder="Dell / Cisco / KSB…"
              />
            </Field>
            <Field label="Model">
              <input
                value={r.model}
                onChange={(e) => setR({ ...r, model: e.target.value })}
                className={fieldCls}
                placeholder="Latitude 5540"
              />
            </Field>
            <Field label="Serial number">
              <input
                value={r.serial_number}
                onChange={(e) => setR({ ...r, serial_number: e.target.value })}
                className={fieldCls}
                placeholder="DL-0000000"
              />
            </Field>
            <Field label="IP address">
              <input
                value={r.ip_address}
                onChange={(e) => setR({ ...r, ip_address: e.target.value })}
                className={fieldCls}
                placeholder="10.24.x.x"
              />
            </Field>
            <Field label="OS / firmware">
              <input
                value={r.os}
                onChange={(e) => setR({ ...r, os: e.target.value })}
                className={fieldCls}
                placeholder="Windows 11 Enterprise"
              />
            </Field>
            <Field label="Status">
              <select
                value={r.status}
                onChange={(e) => setR({ ...r, status: e.target.value })}
                className={fieldCls}
              >
                {STATUSES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Owner">
              <input
                value={r.owner}
                onChange={(e) => setR({ ...r, owner: e.target.value })}
                className={fieldCls}
                placeholder="Maintenance Team"
              />
            </Field>
            <Field label="Location">
              <input
                value={r.location}
                onChange={(e) => setR({ ...r, location: e.target.value })}
                className={fieldCls}
                placeholder="Workshop"
              />
            </Field>
            <Field label="Risk">
              <select
                value={r.risk}
                onChange={(e) => setR({ ...r, risk: e.target.value })}
                className={fieldCls}
              >
                {RISKS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Permission">
              <input
                value={r.permission}
                onChange={(e) => setR({ ...r, permission: e.target.value })}
                className={fieldCls}
                placeholder="Assigned"
              />
            </Field>
            <Field label="Request Status">
              <select
                value={r.request_status}
                onChange={(e) => setR({ ...r, request_status: e.target.value })}
                className={fieldCls}
              >
                {REQUEST_STATUSES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Health">
              <select
                value={r.health}
                onChange={(e) => setR({ ...r, health: e.target.value })}
                className={fieldCls}
              >
                {["Healthy", "Warning", "Critical"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Minimum role">
              <select
                value={r.required_level}
                onChange={(e) =>
                  setR({ ...r, required_level: Number(e.target.value) })
                }
                className={fieldCls}
              >
                {[1, 2, 3, 4, 5]
                  .filter((n) => n <= account.cyber_level)
                  .map((n) => (
                    <option key={n} value={n}>
                      {accessName(n)}
                    </option>
                  ))}
              </select>
            </Field>
          </div>
          <PrimaryButton onClick={submitResource} className="w-full mt-5">
            Create Resource
          </PrimaryButton>
        </Modal>
      )}

      <Toast
        message={toast?.msg}
        kind={toast?.kind}
        onDismiss={() => setToast(null)}
      />
    </div>
  );
}
