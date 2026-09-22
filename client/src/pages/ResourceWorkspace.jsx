import { accessName } from "../../../shared/access.js";
import OceanFleet from "../components/OceanFleet.jsx";
import PathBackdrop from "../components/PathBackdrop.jsx";
import { useEffect, useRef, useState } from "react";
import {
  Search,
  UploadCloud,
  Bot,
  ArrowRight,
  X,
  Download,
  MapPin,
  FileText,
  Users,
  Boxes,
  Layers,
} from "lucide-react";
import { api, download } from "../api.js";
import { useAuth } from "../auth.jsx";
import { useApi } from "../hooks.js";
import { GlassCard, Spinner, ErrorBox, fieldCls } from "../components/ui.jsx";
import SourceBadge, { SourceIcon } from "../components/SourceBadge.jsx";
import FileUpload from "../components/FileUpload.jsx";
import { PersonLocation } from "./PeoplePlaces.jsx";

const TYPES = [
  ["", "Everything", Layers],
  ["Document", "Files", FileText],
  ["Person", "People", Users],
  ["Resource", "Devices", Boxes],
  ["Agent", "Agents", Bot],
];
const INITIAL = {
  q: "",
  kind: "",
  source: "",
  site: "",
  mode: "direct",
  agentId: "",
};
export default function ResourceWorkspace({ uploadOpen = false, onUploadClose }) {
  const { user, hasPermission } = useAuth(),
    workspace = useApi(api.workspace),
    sites = useApi(api.getSites);
  const [hasSearched, setHasSearched] = useState(false),
    [params, setParams] = useState(INITIAL),
    [applied, setApplied] = useState(INITIAL),
    [data, setData] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(null),
    [selected, setSelected] = useState(null),
    [showUpload, setShowUpload] = useState(false),
    [notice, setNotice] = useState(""),
    [detailError, setDetailError] = useState("");
  const seq = useRef(0),
    searchInput = useRef(null);
  async function run(page = 1, overrides = {}) {
    const next = { ...params, ...overrides };
    setHasSearched(true);
    setParams(next);
    setApplied(next);
    const id = ++seq.current;
    setBusy(true);
    setError(null);
    try {
      const result =
        next.mode === "agent" && next.kind !== "Agent"
          ? await api.agentSearch({ ...next, page })
          : await api.search(next.q, {
              kind: next.kind,
              site: next.site,
              source: next.source,
              page,
            });
      if (id === seq.current) setData(result);
    } catch (e) {
      if (id === seq.current) setError(e);
    } finally {
      if (id === seq.current) setBusy(false);
    }
  }
  useEffect(() => {
    return () => {
      seq.current++;
    };
  }, []);
  useEffect(() => {
    const esc = (e) => {
      if (e.key === "Escape") {
        setSelected(null);
      }
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, []);
  async function inspect(record) {
    if (record.kind === "Agent") {
      run(1, {
        mode: "agent",
        agentId: record.id,
        q: "",
        kind: "",
        source: "",
        site: "",
      });
      return;
    }
    setDetailError("");
    try {
      setSelected((await api.getRecord(record.id)).record);
    } catch (e) {
      setError(e);
    }
  }
  const currentAgent = workspace.data?.agents.find(
    (a) => a.id === params.agentId,
  );
  return (
    <div className={`resource-workspace voyage-workspace ${hasSearched ? "has-results" : "at-sea"}`}>
      <section className="voyage-hero" aria-label="Unified resource search">
        <OceanFleet level={user.cyber_level}/>
        <div className="voyage-search-wrap">
          <h1 className={hasSearched ? "voyage-result-heading" : "sr-only"}>{hasSearched ? "Your next discovery." : "Search your workspace"}</h1>
          <form className="voyage-search-form" role="search" onSubmit={e=>{e.preventDefault();run();}}>
            <Search className="voyage-search-icon" size={23}/>
            <input ref={searchInput} aria-label="Search the workspace" maxLength={4000} value={params.q} onChange={e=>setParams(p=>({...p,q:e.target.value}))} placeholder="Find a person, file, device or agent…" />
            <select aria-label="Search mode" value={params.mode} onChange={e=>setParams(p=>({...p,mode:e.target.value,agentId:"",kind:p.kind === "Agent" ? "" : p.kind}))}>
              <option value="direct">Search</option><option value="agent">Agents</option>
            </select>
            <button className="voyage-submit" type="submit" disabled={busy} aria-label={busy ? "Searching" : params.mode === "agent" ? "Ask agents" : "Search"}><ArrowRight size={22}/></button>
          </form>
          {hasSearched && <div className="voyage-search-options">
            <button onClick={()=>{seq.current++;setHasSearched(false);setBusy(false);setData(null);setParams(INITIAL);setApplied(INITIAL);setError(null);setNotice("");window.scrollTo(0,0);searchInput.current?.focus();}}>Back to ocean</button>
            <span>{params.mode === "agent" ? currentAgent ? currentAgent.name : "Local specialist agents" : "People, files, equipment and knowledge"}</span>
          </div>}
        </div>
      </section>
      {hasSearched && <div className="path-results"><PathBackdrop /><div className="voyage-content">
      <div className="workspace-toolbar">
        <div className="type-tabs" aria-label="Resource types">
          {TYPES.map(([kind, label, Icon]) => (
            <button
              key={label}
              aria-pressed={params.kind === kind}
              onClick={() =>
                run(1, {
                  kind,
                  agentId: "",
                  ...(kind === "Agent" ? { mode: "direct" } : {}),
                })
              }
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
        {hasPermission("files.upload") && (
          <button className="upload-action" onClick={() => setShowUpload(true)}>
            <UploadCloud size={17} /> Upload file
          </button>
        )}
      </div>
      {notice && (
        <div className="workspace-notice" role="status">
          {notice}
          <button
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      <div className="workspace-columns">
        <div className="min-w-0">
          <details className="specialist-section specialist-disclosure">
            <summary>Explore specialist agents <Bot size={16}/></summary>
            <div className="section-label">
              <h2>Find a specialist agent</h2>
              <span>Local search capabilities</span>
            </div>
            <div className="specialist-grid">
              {workspace.data?.agents.map((a) => (
                <button
                  className={`specialist-card ${params.agentId === a.id ? "selected" : ""}`}
                  key={a.id}
                  onClick={() =>
                    run(1, {
                      mode: "agent",
                      agentId: a.id,
                      kind: "",
                      source: "",
                      q: "",
                    })
                  }
                >
                  <SourceIcon source={a.source} />
                  <h3>{a.name}</h3>
                  <p>{a.description}</p>
                  <span>
                    Use agent <ArrowRight size={13} />
                  </span>
                </button>
              ))}
            </div>
            {workspace.error && (
              <ErrorBox error={workspace.error} onRetry={workspace.reload} />
            )}
          </details>
          <section className="workspace-results" aria-label="Search results">
            <div className="section-label">
              <h2>
                {applied.q
                  ? `Results for “${applied.q}”`
                  : "Explore your workspace"}
              </h2>
              <span>
                {data?.total ?? 0} matches · {data?.levels}
              </span>
            </div>
            <div className="result-filters">
              <select
                aria-label="Search site"
                className={fieldCls}
                value={params.site}
                onChange={(e) => run(1, { site: e.target.value })}
              >
                <option value="">All sites</option>
                {data?.facets.sites.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <button className="small-button" onClick={() => run(1, INITIAL)}>
                Clear filters
              </button>
              {params.source && (
                <span className="text-xs text-blue-700">
                  Source: {params.source}
                </span>
              )}
            </div>
            {busy ? (
              <Spinner label="Searching authorized resources…" />
            ) : error ? (
              <ErrorBox error={error} onRetry={() => run()} />
            ) : (
              <>
                {data?.plan && (
                  <div className="agent-plan">
                    <p>
                      <Bot size={16} />
                      <strong>
                        Coordinator → specialist agents → combined results
                      </strong>
                    </p>
                    <div>
                      {data.plan.map((a) => (
                        <span key={a.id}>
                          {a.name}
                          <small>
                            {a.status} · {a.matches} matches
                          </small>
                        </span>
                      ))}
                    </div>
                    <p className="agent-summary">{data.summary}</p>
                  </div>
                )}
                <div className="result-list">
                  {data?.results.map((record) => (
                    <button
                      key={record.id}
                      className="workspace-result"
                      onClick={() => inspect(record)}
                    >
                      <div className="result-icon">
                        <SourceIcon source={record.source_id} size={27} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="result-kicker">
                          <span>
                            {record.kind} · {accessName(record.required_level)}
                          </span>
                          <span>{record.status}</span>
                        </div>
                        <h3>{record.title}</h3>
                        <p className="result-description">{record.detail}</p>
                        <div className="result-meta">
                          <SourceBadge
                            source={record.source_id}
                            mode={record.source_mode}
                          />
                          <span>
                            <MapPin size={12} />
                            {record.site}
                          </span>
                        </div>
                        {record.person?.floor && (
                          <p className="person-room-line">
                            {record.person.building} → Floor{" "}
                            {record.person.floor} → Room {record.person.room}
                          </p>
                        )}
                        {record.foundBy && (
                          <p className="text-xs text-blue-700 mt-2">
                            Found by {record.foundBy.join(", ")}
                          </p>
                        )}
                      </div>
                      <ArrowRight size={18} className="result-arrow" />
                    </button>
                  ))}
                </div>
                {data?.total === 0 && (
                  <GlassCard className="p-8 text-center text-slate-500">
                    No authorized matches. Try a name, device ID or fewer
                    keywords.
                  </GlassCard>
                )}
                <div className="results-pagination">
                  <span>
                    Page {data?.page || 1} of{" "}
                    {Math.max(
                      1,
                      Math.ceil((data?.total || 0) / (data?.pageSize || 20)),
                    )}
                  </span>
                  <div>
                    <button
                      className="small-button"
                      disabled={!data || data.page <= 1}
                      onClick={() => run(data.page - 1, applied)}
                    >
                      Previous
                    </button>
                    <button
                      className="small-button"
                      disabled={
                        !data || data.page * data.pageSize >= data.total
                      }
                      onClick={() => run(data.page + 1, applied)}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
        <aside className="workspace-sources">
          <div className="section-label">
            <h2>Your app ecosystem</h2>
          </div>
          <p>Browse demo resources by their illustrated source.</p>
          <div>
            {workspace.data?.sources.map((s) => (
              <button
                key={s.id}
                aria-pressed={params.source === s.id}
                onClick={() =>
                  run(1, {
                    source: s.id,
                    kind: "",
                    q: "",
                    mode: "direct",
                    agentId: "",
                  })
                }
              >
                <SourceIcon source={s.id} size={28} />
                <span>
                  <strong>{s.name}</strong>
                  <small>{s.description}</small>
                </span>
                <em>{s.mode}</em>
              </button>
            ))}
          </div>
          <div className="ecosystem-note">
            <Layers size={19} />
            <p>
              Microsoft logos illustrate the intended ecosystem. These sources
              are not connected to live Microsoft services.
            </p>
          </div>
          <div className="people-help">
            <MapPin size={22} />
            <h3>Looking for a colleague?</h3>
            <p>
              Search their name, discipline or room. Open a person to see their
              building and floor.
            </p>
            <button
              onClick={() =>
                run(1, {
                  kind: "Person",
                  q: "",
                  source: "",
                  mode: "direct",
                  agentId: "",
                })
              }
            >
              Find people <ArrowRight size={14} />
            </button>
          </div>
        </aside>
      </div>
      </div></div>}
      {(showUpload || uploadOpen) && (
        <FileUpload
          sites={sites.data?.sites || []}
          onClose={() => {setShowUpload(false);onUploadClose?.();}}
          onUploaded={(file) => {
            setShowUpload(false);
            onUploadClose?.();
            setNotice(
              `${file.filename} saved to IntelliPath. ${file.syncStatus}.`,
            );
            run(1, { ...INITIAL, q: file.id });
          }}
        />
      )}
      {selected && (
        <div
          className="workspace-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="record-title"
        >
          <div className="workspace-modal-panel max-w-3xl">
            <div className="flex justify-between items-start gap-4 mb-5">
              <div>
                <p className="eyebrow">
                  {selected.kind} · {accessName(selected.required_level)}
                </p>
                <h2
                  id="record-title"
                  className="text-xl font-semibold mt-2 break-words"
                >
                  {selected.title}
                </h2>
                <div className="mt-3">
                  <SourceBadge
                    source={selected.source_id}
                    mode={selected.source_mode}
                  />
                </div>
              </div>
              <button
                aria-label="Close record"
                onClick={() => setSelected(null)}
              >
                <X size={20} />
              </button>
            </div>
            {selected.person ? (
              <PersonLocation person={selected.person} />
            ) : (
              <>
                <div className="record-facts">
                  <span>
                    <strong>Location</strong>
                    {selected.site}
                  </span>
                  <span>
                    <strong>Status</strong>
                    {selected.status}
                  </span>
                  <span>
                    <strong>Record ID</strong>
                    {selected.id}
                  </span>
                  {selected.owner && (
                    <span>
                      <strong>Owner</strong>
                      {selected.owner}
                    </span>
                  )}
                </div>
                <p className="record-content">{selected.detail}</p>
              </>
            )}
            {selected.upload && (
              <div className="file-storage-note">
                <SourceIcon
                  source={
                    selected.upload.destination === "onedrive_demo"
                      ? "onedrive"
                      : "intellipath"
                  }
                />
                <p>
                  Stored in IntelliPath ·{" "}
                  {Math.ceil(selected.upload.size / 1024)} KB
                  {selected.upload.destination === "onedrive_demo"
                    ? " · OneDrive demo target; not synchronized"
                    : ""}
                </p>
              </div>
            )}
            {selected.kind === "Document" && (
              <button
                className="small-button mt-5"
                onClick={async () => {
                  try {
                    await download(
                      `/documents/${encodeURIComponent(selected.id)}/download`,
                      selected.upload?.filename || `${selected.id}.md`,
                    );
                  } catch (e) {
                    setDetailError(e.message);
                  }
                }}
              >
                <Download size={15} />
                {selected.upload
                  ? "Download original file"
                  : "Download demo document"}
              </button>
            )}
            {detailError && (
              <p role="alert" className="text-rose-700 mt-3">
                {detailError}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
