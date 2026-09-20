import { useEffect, useState } from "react";
import { Settings, Save } from "lucide-react";
import { api } from "../api.js";
import {
  GlassCard,
  SectionTitle,
  Spinner,
  ErrorBox,
  PrimaryButton,
  fieldCls,
} from "../components/ui.jsx";

export default function SettingsPage() {
  const [form, setForm] = useState(null),
    [ai, setAI] = useState(null),
    [error, setError] = useState(null),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  useEffect(() => {
    api
      .getSettings()
      .then((d) => {
        setForm(d.settings);
        setAI(d.ai);
      })
      .catch(setError);
  }, []);
  const change = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setMessage("Unsaved changes");
  };
  async function save() {
    setBusy(true);
    setError(null);
    try {
      const d = await api.updateSettings(form);
      setForm(d.settings);
      setAI(d.ai);
      setMessage(
        "Saved. Report, search, AI and alert preferences take effect on the next request; session duration applies at the next sign-in.",
      );
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  if (!form) return error ? <ErrorBox error={error} /> : <Spinner />;
  return (
    <div>
      <SectionTitle
        title="Settings"
        subtitle="Operational controls with a direct effect on reports, search, security and AI."
        icon={Settings}
        action={
          <PrimaryButton onClick={save} disabled={busy}>
            <span className="inline-flex items-center gap-2">
              <Save size={15} />
              {busy ? "Saving…" : "Save changes"}
            </span>
          </PrimaryButton>
        }
      />
      {error && <ErrorBox error={error} />}
      {message && (
        <p role="status" className="text-sm text-cyan-700 mb-5">
          {message}
        </p>
      )}
      <div className="grid lg:grid-cols-2 gap-5">
        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold mb-4">AI assistant</h2>
          <label className="setting-field">
            Answer mode
            <select
              className={fieldCls}
              value={form.aiMode}
              onChange={(e) => change("aiMode", e.target.value)}
            >
              <option value="auto">
                Groq (Free plan supported), local fallback
              </option>
              <option value="local">Local retrieval only</option>
            </select>
          </label>
          <p className="text-sm text-slate-600 mt-3">
            {ai.configured
              ? `Groq configured · ${ai.model}`
              : "Groq key not configured. Local retrieval remains available."}
          </p>
          <p className="text-xs text-slate-600 mt-3">
            Groq receives only authorized evidence. Credentials are managed in
            server environment variables, never in this browser. Use a Groq Free
            plan account to avoid charges. The app cannot verify your billing
            tier.
          </p>
          <a
            href="https://console.groq.com/keys"
            target="_blank"
            rel="noreferrer"
            className="inline-block text-sm text-blue-700 underline mt-3"
          >
            Get a Groq API key
          </a>
        </GlassCard>
        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold mb-4">PDF report contents</h2>
          {[
            ["reportAppendix", "Include full inventory and knowledge appendix"],
            ["reportLogs", "Include daily system and audit evidence"],
          ].map(([k, label]) => (
            <label className="flex items-start gap-3 mb-4 text-sm" key={k}>
              <input
                type="checkbox"
                checked={form[k]}
                onChange={(e) => change(k, e.target.checked)}
                className="mt-1 accent-cyan-500"
              />
              {label}
            </label>
          ))}
          <p className="text-xs text-slate-600">
            Incidents, alerts and remediation are always included within your
            clearance. Reporting days use Singapore time; evidence timestamps
            retain their recorded offsets.
          </p>
        </GlassCard>
        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold mb-4">Search and alerts</h2>
          <label className="setting-field">
            Default search page size
            <select
              className={fieldCls}
              value={form.searchPageSize}
              onChange={(e) => change("searchPageSize", Number(e.target.value))}
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n} records
                </option>
              ))}
            </select>
          </label>
          <label className="setting-field mt-4">
            Minimum dashboard alert severity
            <select
              className={fieldCls}
              value={form.alertSeverity}
              onChange={(e) => change("alertSeverity", e.target.value)}
            >
              {["info", "warning", "high", "critical"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <p className="text-xs text-slate-600 mt-3">
            Changes dashboard alert counts and recommendations. Full reports
            retain every alert severity.
          </p>
        </GlassCard>
        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold mb-4">Session security</h2>
          <label className="setting-field">
            New session lifetime (hours)
            <input
              type="number"
              min={1}
              max={168}
              className={fieldCls}
              value={form.sessionHours}
              onChange={(e) => change("sessionHours", Number(e.target.value))}
            />
          </label>
          <p className="text-xs text-slate-600 mt-3">
            1–168 hours. Existing sessions keep their expiry. Changing an
            account clearance revokes its sessions immediately. Classification
            enforcement and audit recording are always enabled.
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
