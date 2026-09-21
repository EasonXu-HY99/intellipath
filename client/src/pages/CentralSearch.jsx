import { accessName } from "../../../shared/access.js";
import { useEffect, useRef, useState } from "react";
import { Search, X, Download, FileText } from "lucide-react";
import { api, download } from "../api.js";
import {
  GlassCard,
  SectionTitle,
  Spinner,
  ErrorBox,
  PrimaryButton,
  fieldCls,
} from "../components/ui.jsx";

export default function CentralSearch() {
  const [query, setQuery] = useState(""),
    [kind, setKind] = useState(""),
    [site, setSite] = useState(""),
    [data, setData] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(null),
    [selected, setSelected] = useState(null),
    [downloadError, setDownloadError] = useState("");
  const seq = useRef(0);
  async function run(page = 1) {
    const id = ++seq.current;
    setBusy(true);
    setError(null);
    try {
      const d = await api.search(query, { kind, site, page });
      if (id === seq.current) setData(d);
    } catch (e) {
      if (id === seq.current) setError(e);
    } finally {
      if (id === seq.current) setBusy(false);
    }
  }
  useEffect(() => {
    run();
    return () => {
      seq.current++;
    };
  }, []);
  useEffect(() => {
    function esc(e) {
      if (e.key === "Escape") setSelected(null);
    }
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, []);
  async function inspect(r) {
    setDownloadError("");
    try {
      setSelected((await api.getRecord(r.id)).record);
    } catch (e) {
      setError(e);
    }
  }
  return (
    <div>
      <SectionTitle
        title="Centralized Search"
        subtitle="Explore people, assets, locations, documents, maintenance, incidents, alerts and evidence."
        icon={Search}
      />
      <GlassCard className="p-5 mb-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run();
          }}
          className="grid md:grid-cols-[minmax(0,1fr)_160px_220px_auto] gap-3"
        >
          <input
            aria-label="Search records"
            className={fieldCls}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, serial number, IP, device ID or topic…"
          />
          <select
            aria-label="Record type"
            className={fieldCls}
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            <option value="">All types</option>
            {data?.facets.kinds.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
          <select
            aria-label="Site filter"
            className={fieldCls}
            value={site}
            onChange={(e) => setSite(e.target.value)}
          >
            <option value="">All locations</option>
            {data?.facets.sites.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <PrimaryButton disabled={busy}>Search</PrimaryButton>
        </form>
        <p className="text-xs text-slate-600 mt-3">
          Multi-word relevance ranking · Empty search browses records ·{" "}
          {data?.levels} only · Demo documents are downloadable
        </p>
      </GlassCard>
      {busy ? (
        <Spinner />
      ) : error ? (
        <ErrorBox error={error} onRetry={() => run()} />
      ) : (
        <>
          <div className="flex justify-between mb-3 text-sm text-slate-600">
            <span>{data?.total ?? 0} matching records</span>
            <span>
              Page {data?.page ?? 1} of{" "}
              {Math.max(
                1,
                Math.ceil((data?.total || 0) / (data?.pageSize || 20)),
              )}
            </span>
          </div>
          <div className="grid lg:grid-cols-2 gap-3">
            {data?.results.map((r) => (
              <button
                key={r.id}
                onClick={() => inspect(r)}
                className="text-left rounded-xl border border-slate-200 bg-white/[.025] p-5 hover:border-cyan-400/40 transition min-w-0"
              >
                <div className="flex justify-between gap-2 text-xs text-slate-600">
                  <span>
                    {r.kind} · {r.id}
                  </span>
                  <span className="text-cyan-700 shrink-0">
                    {accessName(r.required_level)}
                  </span>
                </div>
                <h3 className="text-slate-900 font-medium mt-2">{r.title}</h3>
                <p className="text-xs text-slate-600 mt-1">
                  {r.site} · {r.status}
                </p>
                <p className="text-sm text-slate-700 mt-3 line-clamp-2 break-words">
                  {r.detail}
                </p>
                <span className="text-xs text-cyan-700 mt-3 block">
                  View record →
                </span>
              </button>
            ))}
          </div>
          {data?.total === 0 && (
            <GlassCard className="p-10 text-center text-slate-600">
              No authorized matches. Try fewer words or clear the filters.
            </GlassCard>
          )}
          <div className="flex justify-end gap-3 mt-5">
            <button
              className="small-button"
              disabled={!data || data.page <= 1}
              onClick={() => run(data.page - 1)}
            >
              Previous
            </button>
            <button
              className="small-button"
              disabled={!data || data.page * data.pageSize >= data.total}
              onClick={() => run(data.page + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center"
          onClick={() => setSelected(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Record details"
            onClick={(e) => e.stopPropagation()}
            className="rounded-2xl border border-slate-200 bg-slate-950 p-6 w-full max-w-2xl max-h-[85vh] overflow-auto"
          >
            <div className="flex justify-between gap-4">
              <div>
                <p className="text-xs text-cyan-700">
                  {selected.kind} · {accessName(selected.required_level)} · {selected.id}
                </p>
                <h2 className="text-xl font-semibold mt-2">{selected.title}</h2>
              </div>
              <button
                autoFocus
                aria-label="Close record"
                onClick={() => setSelected(null)}
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-slate-600 mt-4">
              {selected.site} · {selected.status}
            </p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed mt-4 break-words">
              {selected.detail}
            </p>
            {selected.content && selected.content !== selected.detail && (
              <details className="mt-4 text-xs">
                <summary className="text-cyan-700 cursor-pointer">
                  Full record
                </summary>
                <pre className="whitespace-pre-wrap break-all mt-3">
                  {selected.content}
                </pre>
              </details>
            )}
            {selected.kind === "Document" && (
              <button
                className="small-button mt-5"
                onClick={async () => {
                  try {
                    await download(
                      `/documents/${selected.id}/download`,
                      `${selected.id}.md`,
                    );
                  } catch (e) {
                    setDownloadError(e.message);
                  }
                }}
              >
                <Download size={15} /> Download demo document (.md)
              </button>
            )}
            {downloadError && (
              <p className="text-rose-700 mt-2">{downloadError}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
