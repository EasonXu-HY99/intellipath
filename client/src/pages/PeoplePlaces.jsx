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
  const [floor, setFloor] = useState(person.floor);
  useEffect(() => setFloor(person.floor), [person.id, person.floor]);
  return (
    <div className="person-location">
      <div className="flex items-start gap-3">
        <div className="person-avatar">{person.name.slice(0, 1)}</div>
        <div>
          <h3 className="font-semibold">{person.name}</h3>
          <p className="text-sm text-slate-500">{person.department}</p>
          <SourceBadge source="teams" mode="Demo directory" />
        </div>
      </div>
      <div className="location-address">
        <MapPin size={18} />
        <div>
          <strong>{person.site}</strong>
          <p>
            {person.building || "Building not provided"}
            {person.floor ? ` · Floor ${person.floor}` : ""}
            {person.room ? ` · Room ${person.room}` : ""}
          </p>
        </div>
      </div>
      {person.floor ? (
        <>
          <div className="floor-heading">
            <span>
              <Building2 size={16} /> Building directory
            </span>
            <small>Illustrative layout</small>
          </div>
          <div className="floor-view">
            <div className="floor-tabs" aria-label="Floor selection">
              {[3, 2, 1].map((f) => (
                <button
                  aria-pressed={floor === f}
                  key={f}
                  onClick={() => setFloor(f)}
                >
                  Floor {f}
                </button>
              ))}
            </div>
            <div className="floor-plan">
              <div className="floor-corridor">SHARED CORRIDOR · DEMO</div>
              <div className="room-grid">
                <div className="plan-room">Meeting area</div>
                <div
                  className={`plan-room ${floor === person.floor ? "occupied" : ""}`}
                >
                  {floor === person.floor ? (
                    <>
                      <MapPin size={18} />
                      <strong>Room {person.room}</strong>
                      <span>{person.name}</span>
                    </>
                  ) : (
                    <>
                      <Building2 size={18} />
                      <span>No location for this person on this floor</span>
                    </>
                  )}
                </div>
                <div className="plan-room">Collaboration area</div>
                <div className="plan-room">Engineering workspace</div>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            {person.location_note} Room positions are schematic; this is an
            assigned workplace, not current presence or navigation guidance.
          </p>
        </>
      ) : (
        <p className="text-sm text-slate-500 mt-3">
          This record has no building or floor assignment. A precise location
          cannot be inferred.
        </p>
      )}
    </div>
  );
}
export default function PeoplePlaces() {
  const people = useApi(api.getPeople),
    sites = useApi(api.getSites);
  const [q, setQ] = useState(""),
    [site, setSite] = useState(""),
    [building, setBuilding] = useState(""),
    [floor, setFloor] = useState(""),
    [selected, setSelected] = useState(null);
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
      (!building || p.building === building) &&
      (!floor || String(p.floor) === floor) &&
      `${p.name} ${p.department} ${p.assignment} ${p.building} ${p.room}`
        .toLowerCase()
        .includes(q.toLowerCase()),
  );
  const person = matches.find((p) => p.id === selected) || matches[0];
  const yard = sites.data?.sites.find((s) => s.name === person?.site);
  return (
    <div>
      <SectionTitle
        title="People & Places"
        subtitle="Find the right colleague, then locate their assigned site, building and floor."
        icon={Users}
      />
      <div className="people-filters">
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
                      {p.building || "Building not provided"}
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
                {yard && (
                  <div className="mt-5 pt-4 border-t border-slate-200 text-sm">
                    <p className="text-slate-500">
                      Published yard address: {yard.address}
                    </p>
                    <a
                      className="small-button mt-3"
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(yard.address)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink size={14} /> Open yard in Google Maps
                    </a>
                    <p className="text-xs text-slate-500 mt-2">
                      Google Maps locates the yard; the building directory above
                      is a separate demo.
                    </p>
                  </div>
                )}
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
