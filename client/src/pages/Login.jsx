import { useState } from "react";
import PathBackdrop from "../components/PathBackdrop.jsx";
import { LogIn, ShieldCheck, User, Lock } from "lucide-react";
import { useAuth } from "../auth.jsx";

const DEMO_ACCOUNTS = [
  { role: "Engineer", username: "engineer", password: "Engineer@2026" },
  { role: "Admin", username: "admin", password: "Admin@2026" },
  { role: "Manager", username: "fsun", password: "Manager@2026" },
  { role: "Analysis", username: "mlim", password: "Analyst@2026" },
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
    <div className="harbor-login">
      <section className="harbor-story" aria-label="Maritime engineering">
        <div className="harbor-photo" />
        <div className="harbor-shade" />
        <img className="harbor-logo" src="/brands/seatrium-white.svg" alt="Seatrium"/>
        <div className="harbor-story-copy">
          <p>People. Engineering. Possibility.</p>
          <h1>A shared horizon.<br/>A world of expertise.</h1>
          <span>Connect with the people and knowledge<br className="hidden sm:block"/> that keep your work moving.</span>
        </div>
        <div className="harbor-story-footer"><span>IntelliPath / Maritime workspace</span><span>Concept shipyard imagery</span></div>
      </section>
      <section className="harbor-form-panel">
        <PathBackdrop />
        <div className="harbor-product"><span className="harbor-monogram">ip</span><span>IntelliPath</span></div>
        <div className="harbor-form-content">
          <h2>Welcome aboard.</h2>
          <p>Your people. Your resources. One place.</p>
          <form onSubmit={submit} className="harbor-form">
            <label htmlFor="username">Username</label>
            <div className="harbor-input"><User size={18}/><input id="username" value={username} onChange={e=>setUsername(e.target.value)} placeholder="Enter your username" autoComplete="username" required/></div>
            <label htmlFor="password">Password</label>
            <div className="harbor-input"><Lock size={18}/><input id="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" required/></div>
            {error && <p role="alert" className="harbor-error">{error}</p>}
            <button className="harbor-signin" type="submit" disabled={busy || !username || !password}>{busy ? "Signing in…" : "Sign in"}<LogIn size={18}/></button>
          </form>
          <details className="harbor-demo" open>
            <summary><ShieldCheck size={16}/>Explore with a demo account</summary>
            <div className="harbor-demo-accounts">{DEMO_ACCOUNTS.map(a=><button type="button" key={a.username} aria-pressed={username === a.username} onClick={()=>{setUsername(a.username);setPassword(a.password);setError(null);}}>{a.role}</button>)}</div>
            <p>Choose a role to experience its view of the workspace.</p>
          </details>
        </div>
        <div className="harbor-form-footer"><ShieldCheck size={15}/><span>Access follows your assigned clearance.<br/>Demonstration workspace · Simulated operational data</span></div>
      </section>
    </div>
  );
}
