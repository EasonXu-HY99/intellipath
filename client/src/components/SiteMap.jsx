import { useState } from "react";
import { MapPin, ExternalLink } from "lucide-react";
import { api } from "../api.js";
import { useApi } from "../hooks.js";
import { GlassCard, Spinner, ErrorBox } from "./ui.jsx";

export default function SiteMap() {
  const { data, loading, error } = useApi(api.getSites);
  const [selected, setSelected] = useState(null);
  if (loading) return <Spinner />;
  if (error) return <ErrorBox error={error} />;
  const sites = data.sites,
    site = sites.find((x) => x.id === selected);
  const query = site
    ? `${site.name.split(" / ")[0]} ${site.address}`
    : "Seatrium yards Singapore";
  return (
    <GlassCard className="p-5 mt-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="font-display text-lg font-semibold">
            Site Location View
          </h2>
          <p className="text-sm text-slate-600">
            Singapore directory · {sites.length} published locations ·
            headquarters co-located at Tuas Boulevard
          </p>
        </div>
        <MapPin className="text-cyan-700 shrink-0" />
      </div>
      <div className="grid lg:grid-cols-[300px_minmax(0,1fr)] gap-4">
        <div className="space-y-2">
          <button
            className={`site-button ${!site ? "selected" : ""}`}
            onClick={() => setSelected(null)}
          >
            Singapore overview
          </button>
          {sites.map((s) => (
            <button
              className={`site-button ${selected === s.id ? "selected" : ""}`}
              onClick={() => setSelected(s.id)}
              key={s.id}
            >
              <strong>{s.name}</strong>
              <span>{s.address}</span>
              <span>{s.category}</span>
            </button>
          ))}
        </div>
        <div className="min-w-0">
          <iframe
            key={query}
            title={
              site
                ? `Google Maps - ${site.name}`
                : "Google Maps - Seatrium Singapore overview"
            }
            src={`https://www.google.com/maps?q=${encodeURIComponent(query)}&z=${site ? 16 : 11}&output=embed`}
            className="w-full h-[420px] rounded-xl border border-slate-200"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
          <div className="flex flex-wrap justify-between gap-2 mt-3 text-xs text-slate-600">
            <span>
              {site
                ? `${site.phone} · Public address; site admission is separately controlled.`
                : "Select a directory entry to open its exact address. Google controls overview search markers."}
            </span>
            <a
              className="text-cyan-700 inline-flex items-center gap-1"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`}
              target="_blank"
              rel="noreferrer"
            >
              Open Google Maps <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
      <p className="text-xs text-slate-600 mt-4">
        Addresses verified 20 Sep 2026 from{" "}
        <a
          href="https://www.seatrium.com/contact.php"
          target="_blank"
          rel="noreferrer"
          className="text-cyan-700 underline"
        >
          Seatrium’s public contact directory
        </a>
        . Includes its Singapore hub, supporting yards and corporate
        headquarters; not an inventory of private internal offices.
      </p>
    </GlassCard>
  );
}
