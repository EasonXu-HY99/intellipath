import { iconMap } from "../icons.js";

export function Icon({ symbol, className = "", label }) {
  return (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      role="img"
      aria-label={label || symbol}
    >
      {symbol}
    </span>
  );
}

export function Card({ children, className = "" }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-2xl shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function IconBox({ symbol, dark = false }) {
  return (
    <div
      className={`${
        dark ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-800"
      } w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0`}
    >
      <Icon symbol={symbol} />
    </div>
  );
}

const STATUS_STYLES = {
  Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Assigned: "bg-blue-50 text-blue-700 border-blue-200",
  Maintenance: "bg-amber-50 text-amber-700 border-amber-200",
  Offline: "bg-red-50 text-red-700 border-red-200",
  Success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Warning: "bg-amber-50 text-amber-700 border-amber-200",
  Completed: "bg-blue-50 text-blue-700 border-blue-200",
  Expiring: "bg-amber-50 text-amber-700 border-amber-200",
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Allowed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Denied: "bg-red-50 text-red-700 border-red-200",
  "In Review": "bg-amber-50 text-amber-700 border-amber-200",
  Pending: "bg-blue-50 text-blue-700 border-blue-200",
  "Not Requested": "bg-slate-50 text-slate-700 border-slate-200",
  Escalated: "bg-red-50 text-red-700 border-red-200",
  "Not Started": "bg-slate-50 text-slate-700 border-slate-200",
  Passed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Failed: "bg-red-50 text-red-700 border-red-200",
};

export function StatusBadge({ status }) {
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs border ${
        STATUS_STYLES[status] || "bg-slate-50 text-slate-700 border-slate-200"
      }`}
    >
      {status}
    </span>
  );
}

const RISK_STYLES = {
  Low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  High: "bg-red-50 text-red-700 border-red-200",
};

export function RiskBadge({ risk }) {
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs border ${
        RISK_STYLES[risk] || "bg-slate-50 text-slate-700 border-slate-200"
      }`}
    >
      {risk}
    </span>
  );
}

export function SectionTitle({ title, subtitle, action }) {
  return (
    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{title}</h1>
        <p className="text-slate-500 mt-1 max-w-4xl">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

export function Metric({ icon, title, value, note }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <IconBox symbol={icon} />
        <span className="text-xs text-slate-500">Live</span>
      </div>
      <div className="mt-5">
        <p className="text-sm text-slate-500">{title}</p>
        <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
        <p className="text-xs text-slate-500 mt-2">{note}</p>
      </div>
    </Card>
  );
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-16 text-slate-400">
      <span className="inline-flex items-center gap-2 text-sm">
        <span className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-slate-700 animate-spin" />
        Loading…
      </span>
    </div>
  );
}

export function ErrorBox({ error, onRetry }) {
  return (
    <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-700">
      <p className="font-semibold flex items-center gap-2">
        <Icon symbol={iconMap.warning} /> Failed to load data
      </p>
      <p className="text-sm mt-1">{String(error?.message || error)}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function Toast({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900 text-white shadow-lg">
      <Icon symbol={iconMap.success} />
      <span className="text-sm">{message}</span>
      <button onClick={onDismiss} className="text-slate-400 hover:text-white text-sm">
        ✕
      </button>
    </div>
  );
}
