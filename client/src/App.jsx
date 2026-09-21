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
  Menu,
  X,
  UploadCloud,
} from "lucide-react";
import { useAuth } from "./auth.jsx";
import { api } from "./api.js";
import { GlassCard, Toast, fieldCls } from "./components/ui.jsx";
import Login from "./pages/Login.jsx";
import Overview from "./pages/Overview.jsx";
import AIAssistant from "./pages/AIAssistant.jsx";
import CentralSearch from "./pages/ResourceWorkspace.jsx";
import PeoplePlaces from "./pages/PeoplePlaces.jsx";
import Resources from "./pages/Resources.jsx";
import Audit from "./pages/Audit.jsx";
import SettingsPage from "./pages/Settings.jsx";
import UsersPage from "./pages/Users.jsx";

const NAV = [
  { id: "search", label: "Resource Workspace", icon: Search, perm: "search" },
  { id: "people", label: "Human Resources", icon: UsersRound, perm: "search" },
  {
    id: "overview",
    label: "Cybersecurity Center",
    icon: LayoutDashboard,
    perm: "overview",
  },
  { id: "ai", label: "AI Assistant", icon: Bot, perm: "ai" },
  {
    id: "resources",
    label: "Asset Inventory",
    icon: Boxes,
    perm: "resources.read",
  },
  { id: "audit", label: "Activity Log", icon: ScrollText, perm: "audit.read" },
  { id: "settings", label: "Settings", icon: Settings, perm: "settings" },
  { id: "users", label: "User Management", icon: UsersRound, perm: "users" },
];

const PAGES = {
  overview: Overview,
  ai: AIAssistant,
  search: CentralSearch,
  people: PeoplePlaces,
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
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <GlassCard className="relative w-full max-w-sm p-6" glow>
        <h2 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-cyan-700" /> Change password
        </h2>
        {done ? (
          <div className="mt-4">
            <p className="text-sm text-emerald-700">
              Password updated successfully.
            </p>
            <button
              onClick={onClose}
              className="mt-4 w-full py-2 rounded-xl glass-soft text-sm text-slate-900 hover:bg-slate-100"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-4 space-y-3">
            <input
              type="password"
              className={fieldCls}
              placeholder="Current password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
            />
            <input
              type="password"
              className={fieldCls}
              placeholder="New password (min 8)"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              required
              minLength={8}
            />
            <input
              type="password"
              className={fieldCls}
              placeholder="Confirm new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
            {error && <p className="text-xs text-rose-700">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-slate-900 brand-fill disabled:opacity-50"
            >
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
  const [active, setActive] = useState("search");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [workspaceUpload, setWorkspaceUpload] = useState(false);
  const [toast, setToast] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => { setActive("search"); }, [user?.id]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setMenuOpen(false);
    setWorkspaceUpload(false);
  }, [active, user?.id]);

  useEffect(() => {
    function onClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const nav = useMemo(
    () => NAV.filter((n) => hasPermission(n.perm)),
    [hasPermission],
  );

  useEffect(() => {
    if (!nav.some((n) => n.id === active)) {
      setActive(nav[0]?.id || "search");
    }
  }, [nav, active]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex w-14 h-14 rounded-2xl items-center justify-center font-display font-bold text-xl text-slate-900 brand-fill">
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
    setActive("search");
    setToast("Signed out.");
    setTimeout(() => setToast(null), 2500);
  }

  if (active === "search") return (
    <div className="ocean-shell">
      <header className="ocean-header">
        <a className="ocean-wordmark" href="/" aria-label="IntelliPath home"><img src="/brands/seatrium-white.svg" alt="Seatrium"/><span>IntelliPath</span></a>
        <div className="ocean-account" ref={menuRef} onKeyDown={e=>{if(e.key === "Escape") setMenuOpen(false);}}>
          <span className="ocean-clearance">{user.roleLabel}</span>
          <button className="ocean-menu-toggle" aria-label="Open workspace menu" aria-expanded={menuOpen} aria-controls="workspace-menu" onClick={()=>setMenuOpen(o=>!o)}>{menuOpen ? <X size={20}/> : <Menu size={20}/>}</button>
          {menuOpen && <nav className="ocean-menu" id="workspace-menu" aria-label="Workspace navigation">
            <div className="ocean-menu-person"><strong>{user.name}</strong><span>{user.roleLabel} access</span></div>
            {nav.map(n=><button key={n.id} onClick={()=>{setActive(n.id);setMenuOpen(false);}} aria-current={active === n.id ? "page" : undefined}><n.icon size={17}/>{n.label}</button>)}
            {hasPermission("files.upload") && <button onClick={()=>{setWorkspaceUpload(true);setMenuOpen(false);}}><UploadCloud size={17}/>Upload file</button>}
            <div className="ocean-menu-account"><button onClick={()=>{setShowPw(true);setMenuOpen(false);}}><KeyRound size={17}/>Change password</button><button onClick={signOut}><LogOut size={17}/>Sign out</button></div>
          </nav>}
        </div>
      </header>
      <main><CentralSearch key={user.id} uploadOpen={workspaceUpload} onUploadClose={()=>setWorkspaceUpload(false)}/></main>
      {showPw && <ChangePasswordModal onClose={()=>setShowPw(false)}/>}
      <Toast message={toast} onDismiss={()=>setToast(null)}/>
    </div>
  );

  return (
    <div className="min-h-screen text-slate-700">
      <div className="aurora" />

      <div className="flex min-h-screen">
        <aside className="marine-sidebar w-60 shrink-0 h-screen sticky top-0 overflow-y-auto p-4 hidden lg:flex flex-col glass rounded-none border-y-0 border-l-0">
          <div className="sidebar-identity">
            <img src="/brands/seatrium-white.svg" alt="Seatrium" />
          </div>
          <div className="flex items-center gap-3 mb-8 px-1">
            <div className="w-11 h-11 rounded-xl brand-fill flex items-center justify-center font-display font-bold text-slate-900 shadow-lg shadow-cyan-500/20">
              IP
            </div>
            <div>
              <h1 className="font-display font-bold text-lg text-slate-900 leading-none">
                Intelli<span className="text-gradient">Path</span>
              </h1>
              <p className="text-[11px] text-slate-500 mt-1">
                MARITIME OPERATIONS
              </p>
            </div>
          </div>

          <nav aria-label="Main navigation" className="space-y-1 flex-1">
            {nav.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setActive(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition ${
                    isActive
                      ? "nav-active"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-5 h-5" strokeWidth={1.75} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-4 glass-soft rounded-xl p-3">
            <p className="text-[11px] text-slate-500 uppercase tracking-wider">
              Built around your people
            </p>
            <p className="flex items-center gap-2 text-xs mt-1 text-slate-700">
              <Sparkles className="w-3.5 h-3.5 text-cyan-700" /> People.
              Engineering. Progress.
            </p>
          </div>
        </aside>

        <main className="flex-1 min-w-0 flex flex-col">
          <header className="glass rounded-none border-x-0 border-t-0 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 sticky top-0 z-30">
            <div>
              <p className="text-[11px] text-slate-600 uppercase tracking-wider">
                Seatrium · Singapore / Demo workspace
              </p>
              <p className="font-semibold text-slate-900">
                Welcome, {user.name}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs text-blue-700 bg-blue-50 border border-blue-100">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                {user.roleLabel} access
              </span>

              {hasPermission("ai") && (
                <button
                  onClick={() => setActive("ai")}
                  className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-900 brand-fill transition"
                >
                  <Sparkles className="w-4 h-4" /> Ask AI
                </button>
              )}

              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-100 transition"
                >
                  <div className="w-9 h-9 rounded-lg brand-fill border border-slate-200 flex items-center justify-center font-semibold text-slate-900">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-600" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl glass p-1.5 shadow-2xl z-40">
                    <div className="px-3 py-2 border-b border-slate-200">
                      <p className="text-sm font-medium text-slate-900">
                        {user.name}
                      </p>
                      <p className="text-xs text-slate-500">{user.roleLabel}</p>
                    </div>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setShowPw(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100"
                    >
                      <KeyRound className="w-4 h-4" /> Change password
                    </button>
                    <button
                      onClick={signOut}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-rose-700 hover:bg-rose-400/10"
                    >
                      <LogOut className="w-4 h-4" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <nav
            aria-label="Mobile navigation"
            className="lg:hidden flex gap-2 overflow-x-auto p-3 border-b border-slate-200"
          >
            {nav.map((n) => (
              <button
                key={n.id}
                onClick={() => setActive(n.id)}
                className={`shrink-0 rounded-lg px-3 py-2 text-xs ${active === n.id ? "bg-cyan-500/20 text-cyan-700" : "text-slate-700"}`}
              >
                {n.label}
              </button>
            ))}
          </nav>
          <div className="p-4 sm:p-6 lg:p-7 flex-1 w-full max-w-[1600px] mx-auto">
            <Page key={`${user.id}-${active}`} />
          </div>
        </main>
      </div>

      {showPw && <ChangePasswordModal onClose={() => setShowPw(false)} />}
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
