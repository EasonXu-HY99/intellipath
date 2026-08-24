import { useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutDashboard,
  Bot,
  Search,
  Boxes,
  ScrollText,
  Settings,
  UsersRound,
  LogOut,
  KeyRound,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "./auth.jsx";
import { api } from "./api.js";
import { GlassCard, Toast, fieldCls } from "./components/ui.jsx";
import Login from "./pages/Login.jsx";
import Overview from "./pages/Overview.jsx";
import AIAssistant from "./pages/AIAssistant.jsx";
import CentralSearch from "./pages/CentralSearch.jsx";
import Resources from "./pages/Resources.jsx";
import Audit from "./pages/Audit.jsx";
import SettingsPage from "./pages/Settings.jsx";
import UsersPage from "./pages/Users.jsx";

const NAV = [
  { id: "overview", label: "Command Center", icon: LayoutDashboard, perm: "overview" },
  { id: "ai", label: "AI Assistant", icon: Bot, perm: "ai" },
  { id: "search", label: "Central Search", icon: Search, perm: "search" },
  { id: "resources", label: "Resource Tracking", icon: Boxes, perm: "resources.read" },
  { id: "audit", label: "Audit Logs", icon: ScrollText, perm: "audit.read" },
  { id: "settings", label: "Settings", icon: Settings, perm: "settings" },
  { id: "users", label: "Users", icon: UsersRound, perm: "users" },
];

const PAGES = {
  overview: Overview,
  ai: AIAssistant,
  search: CentralSearch,
  resources: Resources,
  audit: Audit,
  settings: SettingsPage,
  users: UsersPage,
};

function ChangePasswordModal({ onClose }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    if (next !== confirm) {
      setError("New passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await api.changePassword(current, next);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <GlassCard className="relative w-full max-w-sm p-6" glow>
        <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-cyan-300" /> Change password
        </h2>
        {done ? (
          <div className="mt-4">
            <p className="text-sm text-emerald-300">Password updated successfully.</p>
            <button onClick={onClose} className="mt-4 w-full py-2 rounded-xl glass-soft text-sm text-white hover:bg-white/10">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-4 space-y-3">
            <input type="password" className={fieldCls} placeholder="Current password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
            <input type="password" className={fieldCls} placeholder="New password (min 8)" value={next} onChange={(e) => setNext(e.target.value)} required minLength={8} />
            <input type="password" className={fieldCls} placeholder="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            {error && <p className="text-xs text-rose-300">{error}</p>}
            <button type="submit" disabled={busy} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 disabled:opacity-50">
              {busy ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
      </GlassCard>
    </div>
  );
}

export default function App() {
  const { user, loading, logout, hasPermission } = useAuth();
  const [active, setActive] = useState("overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [toast, setToast] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const nav = useMemo(() => NAV.filter((n) => hasPermission(n.perm)), [hasPermission]);

  useEffect(() => {
    if (!nav.some((n) => n.id === active)) {
      setActive(nav[0]?.id || "overview");
    }
  }, [nav, active]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex w-14 h-14 rounded-2xl items-center justify-center font-display font-bold text-xl text-white bg-gradient-to-br from-cyan-400 to-violet-500">
            IP
          </div>
          <p className="text-slate-500 text-sm mt-4">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) return <Login />;

  const Page = PAGES[active] || Overview;

  async function signOut() {
    await logout();
    setToast("Signed out.");
    setTimeout(() => setToast(null), 2500);
  }

  return (
    <div className="min-h-screen text-slate-100">
      <div className="aurora" />

      <div className="flex min-h-screen">
        <aside className="w-72 min-h-screen p-5 hidden lg:flex flex-col glass rounded-none border-y-0 border-l-0">
          <div className="flex items-center gap-3 mb-8 px-1">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center font-display font-bold text-white shadow-lg shadow-cyan-500/20">
              IP
            </div>
            <div>
              <h1 className="font-display font-bold text-lg text-white leading-none">
                Intelli<span className="text-gradient">Path</span>
              </h1>
              <p className="text-[11px] text-slate-500 mt-1">Smart Operations</p>
            </div>
          </div>

          <nav className="space-y-1 flex-1">
            {nav.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActive(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-white border border-white/10"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-5 h-5" strokeWidth={1.75} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-4 glass-soft rounded-xl p-3">
            <p className="text-[11px] text-slate-500 uppercase tracking-wider">AI Layer</p>
            <p className="flex items-center gap-2 text-xs mt-1 text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" /> Rule engine · LLM-ready
            </p>
          </div>
        </aside>

        <main className="flex-1 min-w-0 flex flex-col">
          <header className="glass rounded-none border-x-0 border-t-0 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30">
            <div>
              <p className="text-[11px] text-slate-500 uppercase tracking-wider">Enterprise Sandbox · Tuas Yard</p>
              <p className="font-semibold text-white">Welcome, {user.name}</p>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs text-emerald-300 bg-emerald-400/10 border border-emerald-400/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                All critical services operational
              </span>

              {hasPermission("ai") && (
                <button
                  onClick={() => setActive("ai")}
                  className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-cyan-500/80 to-violet-500/80 hover:from-cyan-400 hover:to-violet-400 transition"
                >
                  <Sparkles className="w-4 h-4" /> Ask AI
                </button>
              )}

              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-white/5 transition"
                >
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400/30 to-violet-500/30 border border-white/10 flex items-center justify-center font-semibold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl glass p-1.5 shadow-2xl z-40">
                    <div className="px-3 py-2 border-b border-white/5">
                      <p className="text-sm font-medium text-white">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.roleLabel}</p>
                    </div>
                    <button
                      onClick={() => { setMenuOpen(false); setShowPw(true); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5"
                    >
                      <KeyRound className="w-4 h-4" /> Change password
                    </button>
                    <button
                      onClick={signOut}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-rose-300 hover:bg-rose-400/10"
                    >
                      <LogOut className="w-4 h-4" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <div className="p-6 lg:p-8 flex-1">
            <Page />
          </div>
        </main>
      </div>

      {showPw && <ChangePasswordModal onClose={() => setShowPw(false)} />}
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
