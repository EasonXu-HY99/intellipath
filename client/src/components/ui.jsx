import { Loader2, X, AlertTriangle } from "lucide-react";

export function GlassCard({ children, className = "", glow = false }) {
  return (
    <div className={`glass rounded-2xl ${glow ? "flow-border" : ""} ${className}`}>
      {children}
    </div>
  );
}

export function IconBox({ icon: Icon, tone = "neutral", className = "" }) {
  const tones = {
    neutral: "bg-white/8 text-slate-200 border-white/10",
    cyan: "bg-cyan-400/10 text-cyan-300 border-cyan-400/20",
    violet: "bg-violet-400/10 text-violet-300 border-violet-400/20",
    emerald: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
    amber: "bg-amber-400/10 text-amber-300 border-amber-400/20",
    rose: "bg-rose-400/10 text-rose-300 border-rose-400/20",
  };
  return (
    <div
      className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${tones[tone] || tones.neutral} ${className}`}
    >
      {Icon ? <Icon className="w-5 h-5" strokeWidth={1.75} /> : null}
    </div>
  );
}

const STATUS = {
  Active: "emerald",
  Success: "emerald",
  Completed: "emerald",
  Approved: "emerald",
  Allowed: "emerald",
  Passed: "emerald",
  Healthy: "emerald",
  Maintenance: "amber",
  Warning: "amber",
  Expiring: "amber",
  "In Review": "amber",
  Pending: "amber",
  "Not Started": "amber",
  Offline: "rose",
  Failed: "rose",
  Escalated: "rose",
  Denied: "rose",
  Critical: "rose",
  Error: "rose",
  Assigned: "sky",
  info: "sky",
  "Not Requested": "slate",
};

const TONE = {
  emerald: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
  amber: "bg-amber-400/10 text-amber-300 border-amber-400/20",
  rose: "bg-rose-400/10 text-rose-300 border-rose-400/20",
  sky: "bg-sky-400/10 text-sky-300 border-sky-400/20",
  slate: "bg-white/5 text-slate-300 border-white/10",
};

export function StatusBadge({ status }) {
  const tone = STATUS[status] || "slate";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border whitespace-nowrap ${TONE[tone]}`}
    >
      {status}
    </span>
  );
}

const RISK = { Low: "emerald", Medium: "amber", High: "rose" };

export function RiskBadge({ risk }) {
  const tone = RISK[risk] || "slate";
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs border ${TONE[tone]}`}>
      {risk}
    </span>
  );
}

export function SectionTitle({ title, subtitle, action, icon: Icon }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
      <div className="flex items-start gap-4">
        {Icon && (
          <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center text-cyan-300 shrink-0 mt-0.5">
            <Icon className="w-6 h-6" strokeWidth={1.75} />
          </div>
        )}
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-white tracking-tight">
            {title}
          </h1>
          <p className="text-slate-400 mt-1 max-w-4xl text-sm">{subtitle}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

export function Metric({ icon: Icon, title, value, note, tone = "cyan" }) {
  return (
    <GlassCard className="p-5 flow-border" glow>
      <div className="flex items-center justify-between">
        <IconBox icon={Icon} tone={tone} />
        <span className="text-[11px] uppercase tracking-wider text-slate-400">Snapshot</span>
      </div>
      <div className="mt-4">
        <p className="text-sm text-slate-400">{title}</p>
        <p className="font-display text-3xl font-bold text-white mt-1">{value}</p>
        <p className="text-xs text-slate-500 mt-1.5">{note}</p>
      </div>
    </GlassCard>
  );
}

export function Spinner({ label = "Loading…" }) {
  return (
    <div className="flex items-center justify-center py-16 text-slate-400">
      <span className="inline-flex items-center gap-2 text-sm">
        <Loader2 className="w-4 h-4 animate-spin text-cyan-300" />
        {label}
      </span>
    </div>
  );
}

export function ErrorBox({ error, onRetry }) {
  return (
    <div className="p-5 rounded-2xl bg-rose-400/10 border border-rose-400/20 text-rose-200">
      <p className="font-semibold flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" /> Failed to load data
      </p>
      <p className="text-sm mt-1 text-rose-200/80">{String(error?.message || error)}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 px-3 py-1.5 rounded-lg bg-rose-400/20 text-rose-100 text-sm hover:bg-rose-400/30"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function Toast({ message, kind = "success", onDismiss }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl glass text-white shadow-xl">
      <span className={`w-2 h-2 rounded-full ${kind === "error" ? "bg-rose-400" : "bg-emerald-400"}`} />
      <span className="text-sm">{message}</span>
      <button onClick={onDismiss} className="text-slate-400 hover:text-white">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function PrimaryButton({ children, onClick, disabled, className = "" }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-cyan-500/80 to-violet-500/80 hover:from-cyan-400 hover:to-violet-400 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-cyan-500/10 ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick, disabled, className = "" }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-xl text-sm font-medium text-slate-200 glass-soft hover:bg-white/10 disabled:opacity-50 transition ${className}`}
    >
      {children}
    </button>
  );
}

export const fieldCls = "field w-full px-3 py-2 rounded-xl text-sm placeholder:text-slate-500";
