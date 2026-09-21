import { useEffect, useState } from "react";
import { MapPin, Building2, Users, ExternalLink } from "lucide-react";
import { api } from "../api.js";
import { useApi } from "../hooks.js";
import {
  GlassCard,
  SectionTitle,
  Spinner,
  ErrorBox,
  fieldCls,
} from "../components/ui.jsx";
import SourceBadge from "../components/SourceBadge.jsx";

export function PersonLocation({ person }) {
  const sites = useApi(api.getSites);
  const [floor, setFloor] = useState(person.floor);
  const [view, setView] = useState(person.location_mode === "outdoor" ? "outdoor" : "indoor");
  useEffect(() => {setFloor(person.floor);setView(person.location_mode === "outdoor" ? "outdoor" : "indoor");}, [person.id, person.floor, person.location_mode]);
  const yard = sites.data?.sites.find(s=>s.name === person.site);
  const hasPin = person.location_mode === "outdoor" && Number.isFinite(person.latitude) && Number.isFinite(person.longitude);
  const query = hasPin ? `${person.latitude},${person.longitude}` : yard?.address;
  return <div className="person-location">
    <div className="flex items-start gap-3"><div className="person-avatar">{person.name.slice(0,1)}</div><div><h3 className="font-semibold">{person.name}</h3><p className="text-sm text-slate-500">{person.department}</p><SourceBadge source="teams" mode="Demo directory"/></div></div>
    <div className="location-address"><MapPin size={18}/><div><strong>{person.site}</strong><p>{person.location_mode === "outdoor" ? person.outdoor_zone : person.building || "Workplace not provided"}{person.floor ? ` · Floor ${person.floor} · Room ${person.room}` : ""}</p></div></div>
    <div className="location-mode-tabs" aria-label="Location view">
      <button aria-pressed={view === "indoor"} onClick={()=>setView("indoor")}><Building2 size={15}/>Indoor workplace</button>
      <button aria-pressed={view === "outdoor"} onClick={()=>setView("outdoor")}><MapPin size={15}/>Outdoor / yard map</button>
    </div>
    {view === "indoor" ? person.floor ? <>
      <div className="floor-heading"><span><Building2 size={16}/>Building directory</span><small>Illustrative layout</small></div>
      <div className="floor-view"><div className="floor-tabs" aria-label="Floor selection">{[3,2,1].map(f=><button aria-pressed={floor===f} key={f} onClick={()=>setFloor(f)}>Floor {f}</button>)}</div>
        <div className="floor-plan"><div className="floor-corridor">Shared corridor · demo</div><div className="room-grid"><div className="plan-room">Meeting area</div><div className={`plan-room ${floor===person.floor ? "occupied" : ""}`}>{floor===person.floor ? <><MapPin size={18}/><strong>Room {person.room}</strong><span>{person.name}</span></> : <span>No assignment on this floor</span>}</div><div className="plan-room">Collaboration area</div><div className="plan-room">Engineering workspace</div></div></div>
      </div><p className="text-xs text-slate-500 mt-3">Illustrative assigned workplace, not current presence or an actual Seatrium floor plan.</p>
    </> : <div className="location-empty"><Building2 size={22}/><p>{person.location_mode === "outdoor" ? "This colleague has an outdoor assignment. Open the yard map for the recorded demo position." : "No indoor assignment has been provided for this colleague."}</p></div> : <>
      {query ? <iframe key={query} title={`Google Maps — ${hasPin ? "demo outdoor position" : person.site}`} src={`https://www.google.com/maps?q=${encodeURIComponent(query)}&z=${hasPin ? 17 : 16}&output=embed`} className="person-yard-map" loading="lazy" referrerPolicy="no-referrer" allowFullScreen/> : <p className="text-sm text-slate-500 mt-4">No verified yard address or outdoor position is available.</p>}
      <div className="location-record"><strong>{hasPin ? "Simulated outdoor position" : "Published yard address"}</strong><p>{hasPin ? person.outdoor_zone : yard?.address || person.site}</p>{hasPin && <p>Last recorded: {new Date(person.location_updated_at).toLocaleString("en-SG",{timeZone:"Asia/Singapore"})} (Singapore)</p>}<p>{hasPin ? "Illustrative pin only. Not a verified facility location or live tracking. A worker may have moved since this demo observation." : "This map locates the yard, not the person or an indoor room."}</p>{query && <a className="small-button mt-3" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`} target="_blank" rel="noreferrer"><ExternalLink size={14}/>Open Google Maps</a>}</div>
    </>}
  </div>;
}
export default function PeoplePlaces() {
  const people = useApi(api.getPeople);
  const [q, setQ] = useState(""),
    [site, setSite] = useState(""),
    [building, setBuilding] = useState(""),
    [floor, setFloor] = useState(""),
    [selected, setSelected] = useState(null),
    [locationMode, setLocationMode] = useState("");
  const rows = people.data?.people || [];
  const buildings = [
    ...new Set(
      rows
        .filter((p) => !site || p.site === site)
        .map((p) => p.building)
        .filter(Boolean),
    ),
  ];
  const matches = rows.filter(
    (p) =>
      (!site || p.site === site) &&
      (!locationMode || p.location_mode === locationMode) &&
      (!building || p.building === building) &&
      (!floor || String(p.floor) === floor) &&
      `${p.name} ${p.department} ${p.assignment} ${p.building} ${p.room} ${p.outdoor_zone || ""}`
        .toLowerCase()
        .includes(q.toLowerCase()),
  );
  const person = matches.find((p) => p.id === selected) || matches[0];
  return (
    <div>
      <SectionTitle
        title="Human Resources"
        subtitle="Find colleagues and distinguish indoor workspaces from recorded outdoor positions."
        icon={Users}
      />
      <div className="people-filters">
        <select aria-label="Workplace type" className={fieldCls} value={locationMode} onChange={e=>{setLocationMode(e.target.value);setBuilding("");setFloor("");}}><option value="">All workplaces</option><option value="indoor">Indoor</option><option value="outdoor">Outdoor</option><option value="unknown">Not assigned</option></select>
        <input
          aria-label="Find a colleague"
          className={fieldCls}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Name, discipline, building or room…"
        />
        <select
          aria-label="People site"
          className={fieldCls}
          value={site}
          onChange={(e) => {
            setSite(e.target.value);
            setBuilding("");
          }}
        >
          <option value="">All sites</option>
          {[...new Set(rows.map((p) => p.site))].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          aria-label="Building"
          disabled={locationMode === "outdoor" || locationMode === "unknown"}
          className={fieldCls}
          value={building}
          onChange={(e) => setBuilding(e.target.value)}
        >
          <option value="">All buildings</option>
          {buildings.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
        <select
          aria-label="Floor"
          disabled={locationMode === "outdoor" || locationMode === "unknown"}
          className={fieldCls}
          value={floor}
          onChange={(e) => setFloor(e.target.value)}
        >
          <option value="">All floors</option>
          {[1, 2, 3].map((f) => (
            <option key={f} value={f}>
              Floor {f}
            </option>
          ))}
        </select>
      </div>
      {people.loading ? (
        <Spinner />
      ) : people.error ? (
        <ErrorBox error={people.error} />
      ) : (
        <div className="people-layout">
          <GlassCard className="p-4">
            <p className="eyebrow mb-4">{matches.length} VISIBLE COLLEAGUES</p>
            <div className="people-list">
              {matches.map((p) => (
                <button
                  key={p.id}
                  className={`colleague-row ${person?.id === p.id ? "selected" : ""}`}
                  onClick={() => setSelected(p.id)}
                >
                  <span className="person-avatar small">
                    {p.name.slice(0, 1)}
                  </span>
                  <span>
                    <strong>{p.name}</strong>
                    <small>
                      {p.department} · {p.site}
                    </small>
                    <small>
                      {p.location_mode === "outdoor" ? `Outdoor · ${p.outdoor_zone}` : p.building || "Workplace not provided"}
                      {p.floor ? ` / Floor ${p.floor} / ${p.room}` : ""}
                    </small>
                  </span>
                </button>
              ))}
              {!matches.length && (
                <p className="text-sm text-slate-500">
                  No colleagues match these filters within your clearance.
                </p>
              )}
            </div>
          </GlassCard>
          <GlassCard className="p-6 self-start">
            {person ? (
              <>
                <PersonLocation person={person} />

              </>
            ) : (
              <p className="text-slate-500">
                Select a colleague to view their location.
              </p>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
}
