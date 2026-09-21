import { accessName } from "../../../shared/access.js";

export default function OceanFleet({ level = 1 }) {
  const rank = Math.min(5, Math.max(1, Math.trunc(Number(level)) || 1));
  return <>
    <div className="ocean-fleet sunrise-fleet" data-vessel-count={rank} aria-hidden="true" style={{"--fleet-image":`url('/images/fleet-${rank}.png')`}}>
      <div className="fleet-backdrop"/>
      <img className="fleet-photo" src={`/images/fleet-${rank}.png`} alt="" fetchPriority="high"/>
      <div className="ocean-vignette"/>
    </div>
    <div className="ocean-caption"><span>{accessName(rank)} workspace</span></div>
    <span className="fleet-concept-note">Maritime concept imagery</span>
  </>;
}
