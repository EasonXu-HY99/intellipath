import { accessName } from "../../../shared/access.js";

export default function OceanFleet({ level = 1 }) {
  const rank = Math.min(5, Math.max(1, Math.trunc(Number(level)) || 1));
  const image = `/images/fleet-${rank}${rank === 2 || rank === 4 ? "-symmetric" : ""}.png`;
  return <>
    <div className="ocean-fleet sunrise-fleet" data-vessel-count={rank} aria-hidden="true" style={{"--fleet-image":`url('${image}')`}}>
      <div className="fleet-backdrop"/>
      <img className="fleet-photo" src={image} alt="" fetchPriority="high"/>
      <div className="ocean-vignette"/>
    </div>
    <div className="ocean-caption"><span>{accessName(rank)} workspace</span></div>
    <span className="fleet-concept-note">Maritime concept imagery</span>
  </>;
}
