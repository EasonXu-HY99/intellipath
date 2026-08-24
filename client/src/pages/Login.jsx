import { useState } from "react";
import { LogIn, ShieldCheck, User, Lock, KeyRound } from "lucide-react";
import { useAuth } from "../auth.jsx";
import { GlassCard, fieldCls } from "../components/ui.jsx";

const DEMO_ACCOUNTS = [
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl items-center justify-center font-display font-bold text-2xl text-white bg-gradient-to-br from-cyan-400 to-violet-500 shadow-lg shadow-cyan-500/20">
            IP
          </div>
          <h1 className="font-display text-3xl font-bold text-white mt-5">
            Intelli<span className="text-gradient">Path</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2">Smart Operations Platform</p>
        </div>

        <GlassCard className="p-8" glow>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-slate-400">Username</label>
              <div className="relative mt-1.5">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  className={`${fieldCls} pl-9`}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  autoFocus
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-slate-400">Password</label>
              <div className="relative mt-1.5">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
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
              <div className="p-3 rounded-xl bg-rose-400/10 border border-rose-400/20 text-rose-200 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy || !username || !password}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 disabled:opacity-50 transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              <LogIn className="w-4 h-4" />
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </GlassCard>

        <div className="mt-6 glass-soft rounded-2xl p-4">
          <p className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-3">
            <ShieldCheck className="w-4 h-4 text-cyan-300" /> Demo accounts
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
                className="flex items-center justify-between text-left px-3 py-2 rounded-lg hover:bg-white/5 transition group"
              >
                <span className="text-sm text-slate-300">
                  {a.role}
                  <span className="text-slate-500 ml-2 font-mono text-xs">{a.username}</span>
                </span>
                <KeyRound className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-300" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
