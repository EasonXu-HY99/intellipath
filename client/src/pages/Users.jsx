import { useState } from "react";
import {
  Users as UsersIcon,
  UserPlus,
  Trash2,
  ShieldCheck,
} from "lucide-react";
import { api } from "../api.js";
import { useApi } from "../hooks.js";
import { useAuth } from "../auth.jsx";
import {
  GlassCard,
  SectionTitle,
  Spinner,
  ErrorBox,
  StatusBadge,
  Toast,
  PrimaryButton,
  fieldCls,
} from "../components/ui.jsx";

const ROLES = [
  { id: "admin", label: "Administrator" },
  { id: "manager", label: "Operations Manager" },
  { id: "analyst", label: "Security Analyst" },
  { id: "engineer", label: "Engineer" },
  { id: "viewer", label: "Viewer" },
];

export default function UsersPage() {
  const { user: me } = useAuth();
  const users = useApi(api.getUsers);
  const [toast, setToast] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
    name: "",
    role: "viewer",
    email: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  function notify(msg, kind = "success") {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 3000);
  }

  async function createUser(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.createUser(form);
      setForm({
        username: "",
        password: "",
        name: "",
        role: "viewer",
        email: "",
      });
      setShowForm(false);
      notify("Account created.");
      users.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeUser(u) {
    if (!window.confirm(`Delete account "${u.username}" (${u.name})?`)) return;
    try {
      await api.deleteUser(u.id);
      notify("Account deleted.");
      users.reload();
    } catch (err) {
      notify(err.message, "error");
    }
  }

  return (
    <div>
      <SectionTitle
        title="User Management"
        subtitle="Provision accounts, assign roles, and control who can access which parts of the platform."
        icon={UsersIcon}
        action={
          <PrimaryButton onClick={() => setShowForm((s) => !s)}>
            <span className="inline-flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> New User
            </span>
          </PrimaryButton>
        }
      />

      {showForm && (
        <GlassCard className="p-6 mb-6" glow>
          <form
            onSubmit={createUser}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div>
              <label className="text-xs uppercase tracking-wider text-slate-600">
                Username
              </label>
              <input
                className={`${fieldCls} mt-1.5`}
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="e.g. cwong"
                required
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-slate-600">
                Full name
              </label>
              <input
                className={`${fieldCls} mt-1.5`}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Cheryl Wong"
                required
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-slate-600">
                Role
              </label>
              <select
                className={`${fieldCls} mt-1.5`}
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                {ROLES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-slate-600">
                Password
              </label>
              <input
                type="password"
                className={`${fieldCls} mt-1.5`}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="min 8 characters"
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-slate-600">
                Email (optional)
              </label>
              <input
                className={`${fieldCls} mt-1.5`}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="name@seatrium.com"
              />
            </div>
            <div className="flex items-end gap-2">
              <PrimaryButton disabled={busy}>
                {busy ? "Creating…" : "Create Account"}
              </PrimaryButton>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-sm text-slate-600 hover:text-slate-900 px-2"
              >
                Cancel
              </button>
            </div>
            {error && (
              <p className="text-rose-700 text-sm md:col-span-3">{error}</p>
            )}
          </form>
        </GlassCard>
      )}

      <GlassCard className="overflow-hidden">
        {users.loading ? (
          <Spinner />
        ) : users.error ? (
          <div className="p-6">
            <ErrorBox error={users.error} onRetry={users.reload} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  {[
                    "User",
                    "Role / Clearance",
                    "Email",
                    "Created",
                    "Actions",
                  ].map((h) => (
                    <th key={h} className="text-left p-4 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(users.data?.users || []).map((u) => (
                  <tr
                    key={u.id}
                    className="border-t border-slate-200 align-middle"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg glass-soft flex items-center justify-center text-slate-700 font-semibold">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{u.name}</p>
                          <p className="text-xs text-slate-500 font-mono">
                            {u.username}
                          </p>
                        </div>
                        {Number(u.id) === Number(me?.id) && (
                          <span className="text-[10px] text-cyan-700 border border-cyan-400/20 rounded-full px-2 py-0.5">
                            You
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 text-slate-700">
                        <ShieldCheck className="w-4 h-4 text-cyan-700" />
                        {u.roleLabel || u.role}
                      </span>
                      <select
                        aria-label={`Clearance for ${u.username}`}
                        value={u.cyber_level}
                        disabled={u.id === me.id}
                        className={`${fieldCls} mt-2`}
                        onChange={async (e) => {
                          try {
                            await api.updateClearance(
                              u.id,
                              Number(e.target.value),
                            );
                            users.reload();
                            notify(
                              "Clearance updated; existing sessions revoked.",
                            );
                          } catch (err) {
                            notify(err.message, "error");
                          }
                        }}
                      >
                        {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                          <option value={n} key={n}>
                            L{n} — records L1–L{n}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4 text-slate-600">{u.email || "—"}</td>
                    <td className="p-4 text-slate-500 text-xs">
                      {u.created_at}
                    </td>
                    <td className="p-4">
                      {Number(u.id) !== Number(me?.id) ? (
                        <button
                          onClick={() => removeUser(u)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-rose-700 hover:bg-rose-400/10 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      ) : (
                        <span className="text-xs text-slate-600">
                          Current account
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      <Toast
        message={toast?.msg}
        kind={toast?.kind}
        onDismiss={() => setToast(null)}
      />
    </div>
  );
}
