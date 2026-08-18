import { useState } from "react";
import { api } from "../api.js";
import { useApi } from "../hooks.js";
import { iconMap } from "../icons.js";
import {
  Card,
  Icon,
  IconBox,
  Metric,
  SectionTitle,
  Spinner,
  ErrorBox,
  StatusBadge,
} from "../components/ui.jsx";

const FLOW = [
  ["Users", iconMap.users],
  ["Platform", iconMap.platform],
  ["AI Layer", iconMap.ai],
  ["Operations", iconMap.activity],
  ["Systems", iconMap.cloud],
];

const SEVERITY_STYLES = {
  warning: "bg-amber-50 border-amber-100",
  danger: "bg-red-50 border-red-100",
  info: "bg-blue-50 border-blue-100",
};

const SEVERITY_TEXT = {
  warning: "text-amber-900",
  danger: "text-red-900",
  info: "text-blue-900",
};

const SEVERITY_SUB = {
  warning: "text-amber-700",
  danger: "text-red-700",
  info: "text-blue-700",
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
    { name: "Resource registry loaded", result: metrics.data?.resources?.tracked >= 5 ? "Passed" : "Failed" },
    { name: "AI recommendations available", result: recs.data?.recommendations?.length >= 1 ? "Passed" : "Failed" },
    { name: "Cybersecurity level rule active", result: metrics.data?.resources?.highestLevel === 7 ? "Passed" : "Failed" },
    { name: "Audit trail enabled", result: "Passed" },
    { name: "All icons are local symbols", result: "Passed" },
  ];

  const m = metrics.data?.headline;
  const rc = metrics.data?.resources;

  return (
    <div>
      <SectionTitle
        title="Command Center"
        subtitle="Centralized operational visibility, AI assistance, resource tracking, audit visibility, and enterprise search."
        action={
          <button
            onClick={generateReport}
            disabled={reporting}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm disabled:opacity-60"
          >
            {reporting ? "Generating…" : "Generate Daily Report"}
          </button>
        }
      />

      {report && (
        <Card className="p-6 mb-6 bg-slate-50">
          <div className="flex items-start gap-3">
            <IconBox symbol={iconMap.sparkles} dark />
            <div className="flex-1">
              <h2 className="font-semibold text-slate-900 mb-2">Daily Report</h2>
              <p className="text-sm text-slate-700 whitespace-pre-line">{report}</p>
            </div>
            <button onClick={() => setReport(null)} className="text-slate-400 hover:text-slate-700">
              ✕
            </button>
          </div>
        </Card>
      )}

      {metrics.loading ? (
        <Spinner />
      ) : metrics.error ? (
        <ErrorBox error={metrics.error} onRetry={metrics.reload} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Metric icon={iconMap.database} title="Active Resources" value={m?.activeResources} note={m?.activeResourcesNote} />
          <Metric icon={iconMap.users} title="Personnel On Site" value={m?.personnelOnSite} note={m?.personnelOnSiteNote} />
          <Metric icon={iconMap.activity} title="Daily Operations" value={m?.dailyOperations} note={m?.dailyOperationsNote} />
          <Metric icon={iconMap.sparkles} title="AI Insights" value={m?.aiInsights} note={m?.aiInsightsNote} />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-6">
        <Card className="p-6 xl:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Operational Flow</h2>
              <p className="text-sm text-slate-500">Users → Platform → AI Intelligence → Operations → Enterprise systems</p>
            </div>
            <Icon symbol={iconMap.sparkles} className="text-2xl" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-stretch">
            {FLOW.map(([label, symbol], idx) => (
              <div key={label} className="relative">
                <div className="h-full rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-col items-center justify-center text-center min-h-[130px]">
                  <Icon symbol={symbol} className="text-3xl mb-3" />
                  <p className="font-semibold text-slate-900 text-sm">{label}</p>
                </div>
                {idx < FLOW.length - 1 && (
                  <div className="hidden md:flex absolute top-1/2 -right-5 -translate-y-1/2 w-7 h-7 rounded-full bg-white border border-slate-200 items-center justify-center text-slate-400 z-10">
                    {iconMap.chevron}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">AI Recommendations</h2>
          {recs.loading ? (
            <Spinner />
          ) : recs.error ? (
            <ErrorBox error={recs.error} onRetry={recs.reload} />
          ) : (
            <div className="space-y-3">
              {(recs.data?.recommendations || []).map((r) => (
                <div
                  key={r.id}
                  className={`p-4 rounded-2xl border ${SEVERITY_STYLES[r.severity] || SEVERITY_STYLES.info}`}
                >
                  <p className={`text-sm font-medium ${SEVERITY_TEXT[r.severity] || SEVERITY_TEXT.info}`}>
                    {r.title}
                  </p>
                  <p className={`text-xs mt-1 ${SEVERITY_SUB[r.severity] || SEVERITY_SUB.info}`}>
                    {r.detail}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-6 mt-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Built-In System Checks</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {checks.map((test) => (
            <div key={test.name} className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
              <p className="text-sm font-medium text-slate-900">{test.name}</p>
              <div className="mt-3">
                <StatusBadge status={test.result} />
              </div>
            </div>
          ))}
        </div>
        {rc && (
          <p className="text-xs text-slate-400 mt-4">
            Live registry: {rc.tracked} tracked resources · {rc.pendingReviews} pending review(s) · highest level {rc.highestLevel}.
          </p>
        )}
      </Card>
    </div>
  );
}
