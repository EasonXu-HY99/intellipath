import { useState } from "react";
import { Search, Users, Database, Sparkles, FileText } from "lucide-react";
import { api } from "../api.js";
import { GlassCard, IconBox, SectionTitle, Spinner, ErrorBox, PrimaryButton, fieldCls } from "../components/ui.jsx";

const ICONS = { users: Users, database: Database, sparkles: Sparkles, file: FileText };

export default function CentralSearch() {
  const [query, setQuery] = useState("John Tan Pump Unit-A12");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  async function runSearch(q) {
    const term = (q ?? query).trim();
    if (!term) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const res = await api.search(term);
      setResults(res.results);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <SectionTitle
        title="Centralized Search"
        subtitle="One path to find people, devices, documents, maintenance records, and operational data."
        icon={Search}
      />

      <GlassCard className="p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
              className={`${fieldCls} pl-10`}
            />
          </div>
          <PrimaryButton onClick={() => runSearch()} disabled={loading}>Search</PrimaryButton>
        </div>
      </GlassCard>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorBox error={error} onRetry={runSearch} />
      ) : searched && results?.length === 0 ? (
        <GlassCard className="p-10 text-center text-slate-500">
          No results found for “{query}”. Try a person name, device, or location.
        </GlassCard>
      ) : results?.length ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {results.map((r, i) => {
            const Icon = ICONS[r.icon] || FileText;
            return (
              <GlassCard key={`${r.kind}-${i}`} className="p-5 flow-border" glow>
                <div className="flex items-start gap-4">
                  <IconBox icon={Icon} tone={r.icon === "users" ? "emerald" : r.icon === "sparkles" ? "violet" : "cyan"} />
                  <div>
                    <h3 className="font-medium text-white">{r.title}</h3>
                    <p className="text-[11px] text-slate-500 uppercase tracking-wide mt-0.5">{r.kind}</p>
                    <p className="text-sm text-slate-400 mt-1">{r.detail}</p>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      ) : (
        <GlassCard className="p-10 text-center text-slate-500">
          Enter a query and press Search to explore the directory.
        </GlassCard>
      )}
    </div>
  );
}
