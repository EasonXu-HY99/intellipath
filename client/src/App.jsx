import { useMemo, useState } from "react";
import { iconMap, navItems } from "./icons.js";
import { Icon } from "./components/ui.jsx";
import Overview from "./pages/Overview.jsx";
import AIAssistant from "./pages/AIAssistant.jsx";
import CentralSearch from "./pages/CentralSearch.jsx";
import Resources from "./pages/Resources.jsx";
import Audit from "./pages/Audit.jsx";
import SettingsPage from "./pages/Settings.jsx";

const pages = {
  overview: Overview,
  ai: AIAssistant,
  search: CentralSearch,
  resources: Resources,
  audit: Audit,
  settings: SettingsPage,
};

export default function App() {
  const [active, setActive] = useState("overview");
  const Page = useMemo(() => pages[active] || Overview, [active]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex">
      <aside className="w-80 bg-slate-950 text-white min-h-screen p-5 hidden lg:flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-white text-slate-950 flex items-center justify-center font-black">
            IP
          </div>
          <div>
            <h1 className="font-bold text-xl">IntelliPath</h1>
            <p className="text-xs text-slate-400">Smart Operations Platform</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 mb-5">
          <p className="text-xs text-slate-400">AI Layer</p>
          <p className="font-semibold mt-1">Rule Engine + LLM-ready</p>
          <p className="text-xs text-emerald-300 mt-2">● Connected</p>
        </div>

        <nav className="space-y-1 flex-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition ${
                active === item.id
                  ? "bg-white text-slate-950"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <Icon symbol={item.icon} className="text-lg w-6" />
              {item.label}
            </button>
          ))}
        </nav>

        <p className="text-[11px] text-slate-600 mt-4">IntelliPath v1.0 · Full-stack demo</p>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 rounded-xl border border-slate-200">
              <Icon symbol={iconMap.menu} />
            </button>
            <div>
              <p className="text-sm text-slate-500">Enterprise Sandbox · Tuas Yard</p>
              <p className="font-semibold text-slate-900">Welcome, Haiyang Xu</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 text-sm">
              <Icon symbol={iconMap.success} /> All critical services operational
            </div>
            <button
              onClick={() => setActive("ai")}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm"
            >
              Ask AI
            </button>
          </div>
        </header>

        <div className="p-6 lg:p-8">
          <Page />
        </div>
      </main>
    </div>
  );
}
