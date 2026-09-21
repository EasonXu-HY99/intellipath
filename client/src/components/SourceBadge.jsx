import { Layers } from "lucide-react";
export const SOURCE_NAMES = {
  intellipath: "IntelliPath",
  onedrive: "OneDrive",
  teams: "Teams",
  sharepoint: "SharePoint",
  exchange: "Exchange",
  defender: "Defender for Cloud",
  sentinel: "Sentinel",
};
export function SourceIcon({ source, size = 24 }) {
  return source === "intellipath" || !SOURCE_NAMES[source] ? (
    <Layers size={size} className="text-blue-700" />
  ) : (
    <img
      src={`/brands/${source}.svg`}
      alt=""
      width={size}
      height={size}
      className="source-icon"
    />
  );
}
export default function SourceBadge({
  source = "intellipath",
  mode = "Demo source",
}) {
  return (
    <span className="source-badge">
      <SourceIcon source={source} size={16} />
      <span>{SOURCE_NAMES[source] || source}</span>
      <small>{mode}</small>
    </span>
  );
}
