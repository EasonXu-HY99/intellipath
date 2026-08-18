import { useEffect, useState } from "react";
import { api } from "../api.js";
import { Card, SectionTitle, Spinner, ErrorBox, Toast } from "../components/ui.jsx";

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
      .then((d) => {
        setEngines(d.engines);
        setGovernance(d.governance);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  function toggle(list, setList, index) {
    const next = list.map((item, i) =>
      i === index ? { ...item, enabled: !item.enabled } : item
    );
    setList(next);
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
        subtitle="Configure AI behavior, enterprise integrations, notifications, and operational preferences."
        action={
          <button
            onClick={save}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white text-sm disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card className="p-6">
          <h2 className="font-semibold mb-4">AI Engine</h2>
          <div className="space-y-3">
            {engines.map((engine, index) => (
              <label
                key={engine.name}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 cursor-pointer"
              >
                <span>{engine.name}</span>
                <input
                  type="checkbox"
                  checked={engine.enabled}
                  onChange={() => toggle(engines, setEngines, index)}
                />
              </label>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold mb-4">Governance Controls</h2>
          <div className="space-y-3">
            {governance.map((control, index) => (
              <label
                key={control.name}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 cursor-pointer"
              >
                <span>{control.name}</span>
                <input
                  type="checkbox"
                  checked={control.enabled}
                  onChange={() => toggle(governance, setGovernance, index)}
                />
              </label>
            ))}
          </div>
        </Card>
      </div>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
