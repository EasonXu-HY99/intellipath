import { useState } from "react";
import { Bot, Map, ChevronRight, Send, Sparkles } from "lucide-react";
import { api } from "../api.js";
import { GlassCard, IconBox, SectionTitle, fieldCls } from "../components/ui.jsx";

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
        subtitle="Search enterprise data, summarize operations, check cybersecurity level, and recommend actions."
        icon={Bot}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <GlassCard className="p-6 xl:col-span-2">
          <div className="flex items-center gap-3 mb-5">
            <IconBox icon={Bot} tone="violet" />
            <div>
              <h2 className="font-display font-semibold text-white">Ask IntelliPath AI</h2>
              <p className="text-sm text-slate-500">Query enterprise data, access rules, and operational context.</p>
            </div>
          </div>

          <div className="rounded-2xl glass-soft p-5 min-h-[360px]">
            <div className="text-xs uppercase tracking-wider text-slate-500">User</div>
            <div className="mt-2 p-4 rounded-2xl bg-white/5 border border-white/10 text-sm text-slate-200">{prompt}</div>

            <div className="mt-5 text-xs uppercase tracking-wider text-slate-500">AI Response</div>
            <div className="mt-2 p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              {loading ? (
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Sparkles className="w-4 h-4 animate-pulse text-cyan-300" /> Reasoning…
                </div>
              ) : error ? (
                <p className="text-rose-300 text-sm">{error}</p>
              ) : answer ? (
                <>
                  <p className="text-sm text-slate-200 whitespace-pre-line">{answer.reply}</p>
                  {answer.person && (
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-sm">
                      <span className="text-slate-500">Person:</span>{" "}
                      <span className="text-white font-medium">{answer.person.name}</span> ·{" "}
                      {answer.person.type} · {answer.person.company} · Level {answer.person.cyber_level}
                    </div>
                  )}
                  {answer.accessChecks?.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {answer.accessChecks.map((c) => (
                        <div key={c.resourceId} className="p-3 rounded-xl bg-white/5 border border-white/10">
                          {c.resourceName}:{" "}
                          <span className={c.allowed ? "text-emerald-300" : "text-rose-300"}>
                            {c.allowed ? "Allowed" : "Denied"}
                          </span>{" "}
                          <span className="text-slate-500">
                            (req L{c.requiredLevel} / user L{c.userLevel})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {answer.rule && <p className="text-xs text-slate-500">{answer.rule}</p>}
                </>
              ) : (
                <p className="text-sm text-slate-500">Ask a question to analyze operations, check access, or generate a summary.</p>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 mt-4">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && ask()}
              className={`${fieldCls} flex-1`}
            />
            <button
              onClick={() => ask()}
              disabled={loading}
              className="px-5 py-3 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-cyan-500/80 to-violet-500/80 hover:from-cyan-400 hover:to-violet-400 disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" /> Ask AI
            </button>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="font-display font-semibold text-white mb-4">Quick AI Actions</h2>
          <div className="space-y-2.5">
            {QUICK_ACTIONS.map((item) => (
              <button
                key={item}
                onClick={() => { setPrompt(item); ask(item); }}
                className="w-full text-left p-3 rounded-xl glass-soft hover:bg-white/10 text-sm text-slate-300 flex items-center justify-between transition"
              >
                {item}
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-6">
        <GlassCard className="p-6 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-semibold text-white">Site Location View</h2>
              <p className="text-sm text-slate-500 mt-1">Mock site map for resource and location tracking.</p>
            </div>
            <Map className="w-5 h-5 text-cyan-300" />
          </div>

          <div className="relative h-80 rounded-3xl overflow-hidden border border-white/10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, rgba(148,163,184,0.14) 1px, transparent 1px), linear-gradient(rgba(148,163,184,0.14) 1px, transparent 1px)",
                backgroundSize: "42px 42px",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-violet-500/10 to-slate-900/60" />
            <div className="absolute left-6 right-6 top-1/2 h-8 -translate-y-1/2 bg-slate-500/20 rounded-full border border-white/10" />
            <div className="absolute top-6 bottom-6 left-1/2 w-8 -translate-x-1/2 bg-slate-500/20 rounded-full border border-white/10" />
            <div className="absolute left-[18%] top-[22%] px-3 py-2 rounded-xl glass text-xs text-slate-200">Main Gate</div>
            <div className="absolute left-[56%] top-[28%] px-3 py-2 rounded-xl glass text-xs text-slate-200">Workshop</div>
            <div className="absolute left-[64%] top-[58%] px-3 py-2 rounded-xl glass text-xs text-slate-200">Pump Unit-A12</div>
            <div className="absolute left-[32%] top-[62%] px-3 py-2 rounded-xl glass text-xs text-slate-200">Admin Office</div>
            <div className="absolute left-[68%] top-[47%] w-12 h-12 rounded-full bg-rose-500/20 border-2 border-rose-400 flex items-center justify-center">
              <div className="w-5 h-5 rounded-full bg-rose-400 shadow-lg" />
            </div>
            <div className="absolute left-[6%] bottom-5 glass rounded-2xl p-4 w-72">
              <p className="text-xs text-slate-500">Selected Location</p>
              <p className="font-medium text-white mt-1">Pump Unit-A12 · Workshop Zone</p>
              <p className="text-xs text-slate-500 mt-1">Tuas Yard · Maintenance area · Level 6 required</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="font-display font-semibold text-white mb-4">Location Intelligence</h2>
          <div className="space-y-3 text-sm">
            <div className="p-4 rounded-2xl glass-soft">
              <p className="font-medium text-white">Current Resource</p>
              <p className="mt-1 text-slate-400">Pump Unit-A12</p>
            </div>
            <div className="p-4 rounded-2xl glass-soft">
              <p className="font-medium text-white">Site</p>
              <p className="mt-1 text-slate-400">Tuas Yard · Workshop Zone</p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-400/10 border border-emerald-400/20">
              <p className="font-medium text-emerald-200">Access Check</p>
              <p className="mt-1 text-emerald-300/80">John Tan Level 6 can access this Level 6 resource.</p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
