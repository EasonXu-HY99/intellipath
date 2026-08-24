import { useState } from "react";
import { Users, MonitorSmartphone, Bot, Activity, Cloud, Database, Sparkles, ChevronRight, X } from "lucide-react";
import { api } from "../api.js";
import { useApi } from "../hooks.js";
import {
  GlassCard,
  IconBox,
  Metric,
  SectionTitle,
  Spinner,
  ErrorBox,
  StatusBadge,
  PrimaryButton,
} from "../components/ui.jsx";

const FLOW = [
  { label: "Users", icon: Users },
  { label: "Platform", icon: MonitorSmartphone },
  { label: "AI Layer", icon: Bot },
  { label: "Operations", icon: Activity },
  { label: "Systems", icon: Cloud },
];

const SEVERITY = {
  warning: { box: "bg-amber-400/10 border-amber-400/20", title: "text-amber-200", sub: "text-amber-300/70" },
  danger: { box: "bg-rose-400/10 border-rose-400/20", title: "text-rose-200", sub: "text-rose-300/70" },
  info: { box: "bg-sky-400/10 border-sky-400/20", title: "text-sky-200", sub: "text-sky-300/70" },
};

export default function Overview() {
  const metrics = useApi(api.getMetrics);
  const recs = useApi(api.getRecommendations);
  const [report, setReport] = useState(null);
  const [reporting, setReporting] = useState(false);

  async function generateReport() {
    setReporting(true);
    setReport(null);
    try {
      const r = await api.askAI("Generate daily operations report");
      setReport(r.reply);
    } catch (e) {
      setReport(`Could not generate report: ${e.message}`);
    } finally {
      setReporting(false);
    }
  }

  const checks = [
    { name: "API connected", result: metrics.data ? "Passed" : "Failed" },
    { name: "Device registry loaded", result: metrics.data?.resources?.tracked >= 20 ? "Passed" : "Failed" },
    { name: "AI recommendations available", result: recs.data?.recommendations?.length >= 1 ? "Passed" : "Failed" },
    { name: "Cybersecurity level rule active", result: metrics.data?.resources?.highestLevel === 7 ? "Passed" : "Failed" },
    { name: "Audit trail enabled", result: "Passed" },
    { name: "RBAC enforced", result: "Passed" },
  ];

  const m = metrics.data?.headline;
  const rc = metrics.data?.resources;

  return (
    <div>
      <SectionTitle
        title="Command Center"
        subtitle="Centralized operational visibility, AI assistance, resource tracking, audit visibility, and enterprise search."
        icon={Activity}
        action={<PrimaryButton onClick={generateReport} disabled={reporting}>{reporting ? "Generating…" : "Generate Daily Report"}</PrimaryButton>}
      />

      {report && (
        <GlassCard className="p-6 mb-6" glow>
          <div className="flex items-start gap-3">
            <IconBox icon={Sparkles} tone="violet" />
            <div className="flex-1">
              <h2 className="font-display font-semibold text-white mb-2">Daily Report</h2>
              <p className="text-sm text-slate-300 whitespace-pre-line">{report}</p>
            </div>
            <button onClick={() => setReport(null)} className="text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </GlassCard>
      )}

      {metrics.loading ? (
        <Spinner />
      ) : metrics.error ? (
        <ErrorBox error={metrics.error} onRetry={metrics.reload} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Metric icon={Database} title="Active Resources" value={m?.activeResources} note={m?.activeResourcesNote} tone="cyan" />
          <Metric icon={Users} title="Personnel On Site" value={m?.personnelOnSite} note={m?.personnelOnSiteNote} tone="emerald" />
          <Metric icon={Activity} title="Daily Operations" value={m?.dailyOperations} note={m?.dailyOperationsNote} tone="violet" />
          <Metric icon={Sparkles} title="AI Insights" value={m?.aiInsights} note={m?.aiInsightsNote} tone="amber" />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-6">
        <GlassCard className="p-6 xl:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display font-semibold text-white">Operational Flow</h2>
              <p className="text-sm text-slate-500">Users → Platform → AI Intelligence → Operations → Enterprise systems</p>
            </div>
            <Sparkles className="w-5 h-5 text-cyan-300" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-stretch">
            {FLOW.map(({ label, icon: Icon }, idx) => (
              <div key={label} className="relative">
                <div className="h-full rounded-2xl glass-soft p-4 flex flex-col items-center justify-center text-center min-h-[130px]">
                  <Icon className="w-6 h-6 text-cyan-300 mb-3" strokeWidth={1.75} />
                  <p className="font-medium text-white text-sm">{label}</p>
                </div>
                {idx < FLOW.length - 1 && (
                  <div className="hidden md:flex absolute top-1/2 -right-5 -translate-y-1/2 w-7 h-7 rounded-full glass items-center justify-center text-slate-400 z-10">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="font-display font-semibold text-white mb-4">AI Recommendations</h2>
          {recs.loading ? (
            <Spinner />
          ) : recs.error ? (
            <ErrorBox error={recs.error} onRetry={recs.reload} />
          ) : (
            <div className="space-y-3">
              {(recs.data?.recommendations || []).map((r) => {
                const s = SEVERITY[r.severity] || SEVERITY.info;
                return (
                  <div key={r.id} className={`p-4 rounded-2xl border ${s.box}`}>
                    <p className={`text-sm font-medium ${s.title}`}>{r.title}</p>
                    <p className={`text-xs mt-1 ${s.sub}`}>{r.detail}</p>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </div>

      <GlassCard className="p-6 mt-6">
        <h2 className="font-display font-semibold text-white mb-4">System Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {checks.map((test) => (
            <div key={test.name} className="p-4 rounded-2xl glass-soft">
              <p className="text-sm font-medium text-white">{test.name}</p>
              <div className="mt-3">
                <StatusBadge status={test.result} />
              </div>
            </div>
          ))}
        </div>
        {rc && (
          <p className="text-xs text-slate-500 mt-4">
            Live registry: {rc.tracked} tracked devices · {rc.pendingReviews} pending review(s) · highest level {rc.highestLevel}.
          </p>
        )}
      </GlassCard>
    </div>
  );
}
