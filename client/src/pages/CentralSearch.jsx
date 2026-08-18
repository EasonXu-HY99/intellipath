import { useState } from "react";
import { api } from "../api.js";
import { iconMap } from "../icons.js";
import { Card, IconBox, SectionTitle, Spinner, ErrorBox } from "../components/ui.jsx";

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
        subtitle="One path to find people, resources, documents, maintenance records, operational data, and enterprise information."
      />

      <Card className="p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-4 top-3 text-xl">{iconMap.search}</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200"
            />
          </div>
          <button
            onClick={() => runSearch()}
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-slate-900 text-white disabled:opacity-60"
          >
            Search
          </button>
        </div>
      </Card>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorBox error={error} onRetry={runSearch} />
      ) : searched && results?.length === 0 ? (
        <Card className="p-10 text-center text-slate-500">
          No results found for “{query}”. Try a person name, resource, or location.
        </Card>
      ) : results?.length ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {results.map((r, i) => (
            <Card key={`${r.kind}-${i}`} className="p-5">
              <div className="flex items-start gap-4">
                <IconBox symbol={iconMap[r.icon] || iconMap.file} />
                <div>
                  <h3 className="font-semibold text-slate-900">{r.title}</h3>
                  <p className="text-xs text-slate-400 uppercase tracking-wide mt-0.5">{r.kind}</p>
                  <p className="text-sm text-slate-500 mt-1">{r.detail}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-10 text-center text-slate-400">
          Enter a query and press Search to explore the directory.
        </Card>
      )}
    </div>
  );
}
