import { useState } from "react";
import { api } from "../api.js";
import { iconMap } from "../icons.js";
import { Card, Icon, IconBox, SectionTitle, Spinner } from "../components/ui.jsx";

const QUICK_ACTIONS = [
  "Check cybersecurity level",
  "Show accessible resources",
  "Find denied resources",
  "Generate daily operations report",
  "Summarize resource status",
  "Generate management summary",
];

const DEFAULT_PROMPT =
  "Show John Tan resource assignment, cybersecurity level, and site location";

export default function AIAssistant() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function ask(text) {
    const q = text ?? prompt;
    if (!q?.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.askAI(q);
      setAnswer(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <SectionTitle
        title="AI Assistant"
        subtitle="Rule-based assistant for search, reporting, operational reasoning, and cybersecurity access checks."
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Card className="p-6 xl:col-span-2">
          <div className="flex items-center gap-3 mb-5">
            <IconBox symbol={iconMap.ai} dark />
            <div>
              <h2 className="font-semibold text-slate-900">Ask IntelliPath AI</h2>
              <p className="text-sm text-slate-500">
                Search enterprise data, summarize operations, check cybersecurity level, and recommend actions.
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-950 p-5 text-white min-h-[360px]">
            <div className="text-sm text-slate-400">User</div>
            <div className="mt-2 p-4 bg-slate-900 rounded-2xl border border-slate-800">{prompt}</div>

            <div className="mt-6 text-sm text-slate-400">AI Response</div>
            <div className="mt-2 p-5 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
              {loading ? (
                <div className="flex items-center gap-2 text-slate-300 text-sm">
                  <span className="w-4 h-4 rounded-full border-2 border-slate-600 border-t-slate-200 animate-spin" />
                  Reasoning…
                </div>
              ) : error ? (
                <p className="text-red-300 text-sm">{error}</p>
              ) : answer ? (
                <>
                  <p className="text-sm text-slate-200 whitespace-pre-line">{answer.reply}</p>
                  {answer.person && (
                    <div className="p-3 rounded-xl bg-slate-800 text-sm">
                      <span className="text-slate-400">Person:</span>{" "}
                      <span className="text-white font-medium">{answer.person.name}</span> ·{" "}
                      {answer.person.type} · {answer.person.company} · Level {answer.person.cyber_level}
                    </div>
                  )}
                  {answer.accessChecks?.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {answer.accessChecks.map((c) => (
                        <div key={c.resourceId} className="p-3 rounded-xl bg-slate-800">
                          {c.resourceName}:{" "}
                          <span className={c.allowed ? "text-emerald-300" : "text-red-300"}>
                            {c.allowed ? "Allowed" : "Denied"}
                          </span>{" "}
                          <span className="text-slate-400">
                            (required L{c.requiredLevel} / user L{c.userLevel})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {answer.rule && <p className="text-sm text-slate-400">{answer.rule}</p>}
                </>
              ) : (
                <p className="text-sm text-slate-400">
                  Ask a question to analyze operations, check access, or generate a summary.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 mt-4">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && ask()}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm"
            />
            <button
              onClick={() => ask()}
              disabled={loading}
              className="px-5 py-3 rounded-xl bg-slate-900 text-white text-sm disabled:opacity-60"
            >
              Ask AI
            </button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Quick AI Actions</h2>
          <div className="space-y-3">
            {QUICK_ACTIONS.map((item) => (
              <button
                key={item}
                onClick={() => {
                  setPrompt(item);
                  ask(item);
                }}
                className="w-full text-left p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm flex items-center justify-between"
              >
                {item}
                <span className="text-slate-400 text-xl">{iconMap.chevron}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-6">
        <Card className="p-6 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-slate-900">Site Location View</h2>
              <p className="text-sm text-slate-500 mt-1">Mock embedded map for site and resource location tracking.</p>
            </div>
            <Icon symbol={iconMap.map} className="text-2xl" />
          </div>

          <div className="relative h-80 rounded-3xl overflow-hidden border border-slate-200 bg-slate-200">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, rgba(148,163,184,0.28) 1px, transparent 1px), linear-gradient(rgba(148,163,184,0.28) 1px, transparent 1px)",
                backgroundSize: "42px 42px",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/70 via-sky-50/70 to-slate-100/80" />
            <div className="absolute left-6 right-6 top-1/2 h-8 -translate-y-1/2 bg-slate-300/80 rounded-full border border-white" />
            <div className="absolute top-6 bottom-6 left-1/2 w-8 -translate-x-1/2 bg-slate-300/80 rounded-full border border-white" />
            <div className="absolute left-[18%] top-[22%] px-3 py-2 rounded-xl bg-white shadow text-xs font-medium text-slate-700">Main Gate</div>
            <div className="absolute left-[56%] top-[28%] px-3 py-2 rounded-xl bg-white shadow text-xs font-medium text-slate-700">Workshop</div>
            <div className="absolute left-[64%] top-[58%] px-3 py-2 rounded-xl bg-white shadow text-xs font-medium text-slate-700">Pump Unit-A12</div>
            <div className="absolute left-[32%] top-[62%] px-3 py-2 rounded-xl bg-white shadow text-xs font-medium text-slate-700">Admin Office</div>
            <div className="absolute left-[68%] top-[47%] w-12 h-12 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center">
              <div className="w-5 h-5 rounded-full bg-red-600 shadow-lg" />
            </div>
            <div className="absolute left-[6%] bottom-5 bg-white/95 rounded-2xl p-4 shadow border border-slate-200 w-72">
              <p className="text-xs text-slate-500">Selected Location</p>
              <p className="font-semibold text-slate-900 mt-1">Pump Unit-A12 · Workshop Zone</p>
              <p className="text-xs text-slate-500 mt-1">Tuas Yard · Maintenance area · Level 6 required</p>
            </div>
            <div className="absolute right-4 top-4 flex flex-col rounded-xl overflow-hidden shadow border border-slate-200">
              <button className="w-9 h-9 bg-white text-slate-800 font-bold">+</button>
              <button className="w-9 h-9 bg-white text-slate-800 font-bold border-t border-slate-200">−</button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Location Intelligence</h2>
          <div className="space-y-3 text-sm text-slate-600">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <p className="font-medium text-slate-900">Current Resource</p>
              <p className="mt-1">Pump Unit-A12</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <p className="font-medium text-slate-900">Site</p>
              <p className="mt-1">Tuas Yard · Workshop Zone</p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <p className="font-medium text-emerald-900">Access Check</p>
              <p className="mt-1 text-emerald-700">John Tan Level 6 can access this Level 6 resource.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
