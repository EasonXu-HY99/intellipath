import MaritimeScene from "../components/MaritimeScene.jsx";
import { useState } from "react";
import { LogIn, ShieldCheck, User, Lock, KeyRound } from "lucide-react";
import { useAuth } from "../auth.jsx";
import { GlassCard, fieldCls } from "../components/ui.jsx";

const DEMO_ACCOUNTS = [
  { role: "Engineer", username: "engineer", password: "Engineer@2026" },
  { role: "Administrator", username: "admin", password: "Admin@2026" },
  { role: "Operations Manager", username: "fsun", password: "Manager@2026" },
  { role: "Security Analyst", username: "mlim", password: "Analyst@2026" },
  { role: "Viewer", username: "jtan", password: "Viewer@2026" },
];

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-layout">
      <section className="login-story">
        <div className="story-brand">
          <img
            src="/brands/seatrium-white.svg"
            alt="Seatrium"
            className="seatrium-login-logo"
          />{" "}
          <span>MARITIME OPERATIONS</span>
        </div>
        <div className="story-copy">
          <p className="eyebrow">ENGINEERING WITH PURPOSE</p>
          <h1>
            Connected people.
            <br />
            Safer operations.
            <br />
            <span>One shared horizon.</span>
          </h1>
          <p>
            Bring your teams, vessels and operational knowledge together — from
            the workshop to the waterfront.
          </p>
        </div>
        <MaritimeScene className="login-scene" />
        <div className="story-values">
          <span>01 / PEOPLE FIRST</span>
          <span>02 / ENGINEERING EXCELLENCE</span>
          <span>03 / SAFETY ALWAYS</span>
        </div>
        <p className="story-disclaimer">
          IntelliPath concept workspace · Simulated operational data
        </p>
      </section>
      <section className="login-form-panel">
        <div className="w-full max-w-md">
          <div className="mb-7">
            <div className="inline-flex w-12 h-12 rounded-2xl items-center justify-center font-display font-bold text-2xl text-slate-900 brand-fill shadow-lg shadow-cyan-500/20">
              IP
            </div>
            <h1 className="font-display text-3xl font-bold text-slate-900 mt-5">
              Intelli<span className="text-gradient">Path</span>
            </h1>
            <p className="text-slate-600 text-sm mt-2">
              Welcome back. Your operations start here.
            </p>
          </div>

          <GlassCard className="p-6">
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label
                  htmlFor="username"
                  className="text-xs uppercase tracking-wider text-slate-600"
                >
                  Username
                </label>
                <div className="relative mt-1.5">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    className={`${fieldCls} pl-9`}
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="username"
                    autoFocus
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="text-xs uppercase tracking-wider text-slate-600"
                >
                  Password
                </label>
                <div className="relative mt-1.5">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    id="password"
                    type="password"
                    className={`${fieldCls} pl-9`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-400/10 border border-rose-400/20 text-rose-700 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={busy || !username || !password}
                className="w-full py-3 rounded-xl text-sm font-semibold text-slate-900 brand-fill disabled:opacity-50 transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
              >
                <LogIn className="w-4 h-4" />
                {busy ? "Signing in…" : "Sign in"}
              </button>
            </form>
          </GlassCard>

          <div className="mt-6 glass-soft rounded-2xl p-4">
            <p className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-3">
              <ShieldCheck className="w-4 h-4 text-cyan-700" /> Demo accounts
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.username}
                  type="button"
                  onClick={() => {
                    setUsername(a.username);
                    setPassword(a.password);
                  }}
                  className="flex items-center justify-between text-left px-3 py-2 rounded-lg hover:bg-slate-100 transition group"
                >
                  <span className="text-sm text-slate-700">
                    {a.role}
                    <span className="text-slate-500 ml-2 font-mono text-xs">
                      {a.username}
                    </span>
                  </span>
                  <KeyRound className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-700" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
