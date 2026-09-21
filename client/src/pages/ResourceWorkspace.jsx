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
export default function ResourceWorkspace() {
  const { user, hasPermission } = useAuth(),
    workspace = useApi(api.workspace),
    sites = useApi(api.getSites);
  const [params, setParams] = useState(INITIAL),
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
    run();
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
    <div className="resource-workspace">
      <div className="workspace-heading">
        <div>
          <p className="eyebrow">YOUR CONNECTED RESOURCE WORKSPACE</p>
          <h1>Find what moves your work forward.</h1>
          <p>People, files, devices and specialist agents — in one place.</p>
        </div>
        <img
          src="/brands/seatrium.svg"
          alt="Seatrium"
          className="workspace-brand"
        />
      </div>
      <section
        className="workspace-search"
        aria-label="Unified resource search"
      >
        <div className="search-mode">
          <button
            aria-pressed={params.mode === "direct"}
            onClick={() =>
              setParams((p) => ({ ...p, mode: "direct", agentId: "" }))
            }
          >
            <Search size={16} /> Search resources
          </button>
          <button
            aria-pressed={params.mode === "agent"}
            onClick={() =>
              setParams((p) => ({
                ...p,
                mode: "agent",
                kind: p.kind === "Agent" ? "" : p.kind,
              }))
            }
          >
            <Bot size={17} /> Let agents help
          </button>
          <span>Clearance L1–L{user.cyber_level}</span>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run();
          }}
        >
          <div className="workspace-search-input">
            <Search size={24} />
            <input
              ref={searchInput}
              aria-label="Search the workspace"
              maxLength={4000}
              value={params.q}
              onChange={(e) => setParams((p) => ({ ...p, q: e.target.value }))}
              placeholder={
                params.mode === "agent"
                  ? "Describe what you need — we’ll find the right specialist…"
                  : "Find a file, colleague, device, room or agent…"
              }
            />
            <button type="submit" disabled={busy}>
              {busy
                ? "Searching…"
                : params.mode === "agent"
                  ? "Ask agents"
                  : "Search"}
              <ArrowRight size={17} />
            </button>
          </div>
        </form>
        <div className="search-suggestions">
          <span>TRY</span>
          {["pump inspection", "Engineering Block A", "vessel handover"].map(
            (q) => (
              <button
                key={q}
                onClick={() => run(1, { q, kind: "", source: "", agentId: "" })}
              >
                {q}
                <ArrowRight size={12} />
              </button>
            ),
          )}
        </div>
        {params.mode === "agent" && (
          <p className="agent-mode-note">
            <Bot size={16} />
            {currentAgent
              ? `${currentAgent.name} selected.`
              : "The coordinator discovers specialists, delegates your search and combines their results."}{" "}
            Local agents search this workspace; Microsoft connectors are
            demonstrations.
          </p>
        )}
      </section>
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
          <section className="specialist-section">
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
          </section>
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
                            {record.kind} · L{record.required_level}
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
      {showUpload && (
        <FileUpload
          sites={sites.data?.sites || []}
          onClose={() => setShowUpload(false)}
          onUploaded={(file) => {
            setShowUpload(false);
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
                  {selected.kind} · L{selected.required_level}
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
