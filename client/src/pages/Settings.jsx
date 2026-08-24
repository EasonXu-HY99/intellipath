import { useEffect, useState } from "react";
import { Settings, Bot, ShieldCheck, Save } from "lucide-react";
import { api } from "../api.js";
import { GlassCard, SectionTitle, Spinner, ErrorBox, Toast, PrimaryButton } from "../components/ui.jsx";

function ToggleRow({ name, enabled, onChange }) {
  return (
    <label className="flex items-center justify-between p-4 rounded-xl glass-soft cursor-pointer">
      <span className="text-sm text-slate-200">{name}</span>
      <button
        type="button"
        onClick={onChange}
        className={`relative w-11 h-6 rounded-full transition ${enabled ? "bg-gradient-to-r from-cyan-500 to-violet-500" : "bg-white/10"}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${enabled ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </label>
  );
}

export default function SettingsPage() {
  const [engines, setEngines] = useState(null);
  const [governance, setGovernance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    api
      .getSettings()
      .then((d) => { setEngines(d.engines); setGovernance(d.governance); })
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  function toggle(list, setList, index) {
    setList(list.map((item, i) => (i === index ? { ...item, enabled: !item.enabled } : item)));
  }

  async function save() {
    setSaving(true);
    try {
      const d = await api.updateSettings({ engines, governance });
      setEngines(d.engines);
      setGovernance(d.governance);
      setToast("Settings saved.");
      setTimeout(() => setToast(null), 3000);
    } catch (e) {
      setError(e);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner />;
  if (error) return <ErrorBox error={error} />;

  return (
    <div>
      <SectionTitle
        title="Settings"
        subtitle="Configure AI behaviour, enterprise integrations, notifications, and operational preferences."
        icon={Settings}
        action={<PrimaryButton onClick={save} disabled={saving}><span className="inline-flex items-center gap-2"><Save className="w-4 h-4" /> {saving ? "Saving…" : "Save Changes"}</span></PrimaryButton>}
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <GlassCard className="p-6">
          <h2 className="font-display font-semibold text-white flex items-center gap-2 mb-4">
            <Bot className="w-5 h-5 text-cyan-300" /> AI Engine
          </h2>
          <div className="space-y-2.5">
            {engines.map((engine, index) => (
              <ToggleRow key={engine.name} name={engine.name} enabled={engine.enabled} onChange={() => toggle(engines, setEngines, index)} />
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="font-display font-semibold text-white flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-emerald-300" /> Governance Controls
          </h2>
          <div className="space-y-2.5">
            {governance.map((control, index) => (
              <ToggleRow key={control.name} name={control.name} enabled={control.enabled} onChange={() => toggle(governance, setGovernance, index)} />
            ))}
          </div>
        </GlassCard>
      </div>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
