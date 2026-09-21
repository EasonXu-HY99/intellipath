import { accessName } from "../../../shared/access.js";
import { useState } from "react";
import {
  Activity,
  Database,
  Users,
  ShieldAlert,
  Bell,
  Download,
  RefreshCw,
} from "lucide-react";
import { api, download } from "../api.js";
import { useApi } from "../hooks.js";
import {
  GlassCard,
  SectionTitle,
  Metric,
  Spinner,
  ErrorBox,
  PrimaryButton,
  fieldCls,
} from "../components/ui.jsx";

export default function Overview() {
  const { data, loading, error, reload } = useApi(api.getMetrics);
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const [date, setDate] = useState(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Singapore",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date()),
  );
  async function report() {
    setBusy(true);
    setMessage("");
    try {
      await download(
        `/reports/daily.pdf?date=${date}`,
        `IntelliPath-Cybersecurity-${date}.pdf`,
      );
      setMessage(
        "PDF downloaded. Includes daily activity, unresolved carry-over and your authorized inventory.",
      );
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  const m = data?.headline,
    s = data?.security;
  return (
    <div>
      <SectionTitle
        title="Cybersecurity Center"
        subtitle="Your security operations brief: exposure, incidents and the work required to recover."
        icon={Activity}
        action={
          <div className="flex flex-wrap gap-2">
            <input
              aria-label="Report date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`${fieldCls} !w-auto`}
            />
            <PrimaryButton disabled={busy || !date} onClick={report}>
              <span className="inline-flex gap-2 items-center">
                <Download size={16} />
                {busy ? "Generating PDF…" : "Generate Daily Report"}
              </span>
            </PrimaryButton>
          </div>
        }
      />
      <section className="operations-hero">
        <div className="hero-copy">
          <p className="eyebrow">SEATRIUM / CONNECTED OPERATIONS</p>
          <h2>
            People at the heart.
            <br />
            Engineering on the horizon.
          </h2>
          <p>
            A shared view of your people, assets and security priorities across
            Singapore's yards.
          </p>
          <div className="hero-tags">
            <span>MARINE &amp; OFFSHORE</span>
            <span>ENGINEERING</span>
            <span>PEOPLE &amp; SAFETY</span>
          </div>
        </div>
        <img src="/images/shipyard-dawn.png" alt="" className="security-hero-photo" />
      </section>
      <div className="scope-banner">
        <span>DEMO WORKSPACE · SINGAPORE</span>
        <span>
          Access group: {accessName(s?.level)} · Snapshot{" "}
          {data?.generatedAt
            ? new Date(data.generatedAt).toLocaleTimeString()
            : ""}
        </span>
        <button onClick={reload} aria-label="Refresh cybersecurity center">
          <RefreshCw size={15} />
        </button>
      </div>
      {message && (
        <p role="status" className="text-sm p-4 my-4 glass-soft rounded-xl">
          {message}
        </p>
      )}
      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorBox error={error} onRetry={reload} />
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Metric
              icon={Database}
              title="Active resources"
              value={m.activeResources}
              note={m.activeResourcesNote}
            />
            <Metric
              icon={Users}
              title="Active personnel"
              value={m.personnelOnSite}
              note={m.personnelOnSiteNote}
              tone="emerald"
            />
            <Metric
              icon={ShieldAlert}
              title="Open incidents"
              value={m.dailyOperations}
              note={m.dailyOperationsNote}
              tone="violet"
            />
            <Metric
              icon={Bell}
              title="Priority alerts"
              value={m.aiInsights}
              note={m.aiInsightsNote}
              tone="amber"
            />
          </div>
          <div className="grid lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-5 items-start">
            <GlassCard className="p-5">
              <h2 className="font-display text-lg font-semibold">
                Incident watchlist
              </h2>
              <p className="text-xs text-slate-600 mt-1 mb-4">
                Highest severity first · simulated events
              </p>
              <div className="space-y-3 max-h-[540px] overflow-y-auto">
                {[...s.incidents]
                  .sort(
                    (a, b) =>
                      (b.severity === "critical") - (a.severity === "critical"),
                  )
                  .slice(0, 12)
                  .map((r) => (
                    <div
                      key={r.id}
                      className="p-4 rounded-xl bg-rose-400/5 border border-rose-400/15"
                    >
                      <div className="flex flex-wrap justify-between gap-2">
                        <span className="severity-tag">{r.severity}</span>
                        <span className="text-xs text-slate-600">
                          {r.id} · {accessName(r.required_level)}
                        </span>
                      </div>
                      <h3 className="font-medium mt-2">{r.title}</h3>
                      <p className="text-xs text-slate-600 mt-2">
                        {r.owner} · {r.status}
                      </p>
                    </div>
                  ))}
                {!s.incidents.length && (
                  <p className="text-slate-600">No visible open incidents.</p>
                )}
              </div>
            </GlassCard>
            <div className="space-y-5">
              <GlassCard className="p-5">
                <h2 className="font-display text-lg font-semibold">
                  Remediation queue
                </h2>
                <p className="text-xs text-slate-600 mt-1 mb-4">
                  Unverified actions, earliest due first
                </p>
                <div className="space-y-3">
                  {s.remediation
                    .filter((r) => r.status !== "verified")
                    .sort((a, b) => a.due_at.localeCompare(b.due_at))
                    .slice(0, 6)
                    .map((r) => (
                      <div
                        key={r.id}
                        className="border-b border-slate-200 pb-3"
                      >
                        <p className="text-sm">{r.title}</p>
                        <p className="text-xs text-slate-600 mt-1">
                          {r.owner} · Due {r.due_at.slice(0, 10)}
                        </p>
                        <span className="text-xs text-amber-800">
                          {new Date(r.due_at) < new Date() ? "Overdue · " : ""}
                          {r.status}
                        </span>
                      </div>
                    ))}
                </div>
              </GlassCard>
              <GlassCard className="p-5">
                <h2 className="font-semibold mb-2">Cybersecurity daily PDF</h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Executive overview, Govern, Identify, Protect, Detect, Respond
                  and Recover. Includes incidents, alerts, remediation owners,
                  deadlines, evidence, inventory and knowledge records.
                </p>
                <p className="text-xs text-slate-600 mt-3">
                  Singapore reporting day. Open carry-over is included;
                  historical inventory is not reconstructed. Appendix options
                  are controlled in Settings.
                </p>
              </GlassCard>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
