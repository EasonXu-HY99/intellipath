// Original vector artwork: no external assets, image APIs or runtime requests.
export default function MaritimeScene({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 720 340"
      role="img"
      aria-label="Engineers reviewing a vessel plan beside a ship and shipyard cranes"
    >
      <defs>
        <linearGradient id="sea" x2="0" y2="1">
          <stop stopColor="#167ccc" />
          <stop offset="1" stopColor="#06386b" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="#b6d9ef" strokeWidth="1" opacity=".45">
        {[40, 80, 120, 160, 200, 240, 280, 320].map((y) => (
          <path key={y} d={`M0 ${y}H720`} />
        ))}
        {[40, 100, 160, 220, 280, 340, 400, 460, 520, 580, 640, 700].map(
          (x) => (
            <path key={x} d={`M${x} 0V340`} />
          ),
        )}
      </g>
      <circle cx="573" cy="86" r="52" fill="#d7ecf9" />
      <g stroke="#619bc2" strokeWidth="6" fill="none" strokeLinejoin="round">
        <path d="M102 244V54h169L129 88H42l60-34m0 0 39 190M223 54v93m-9 0h18v20h-18z" />
        <path d="M476 228V40h152L501 75h-80l55-35m0 0 35 188M604 40v93m-8 0h16v17h-16z" />
      </g>
      <path
        d="M0 256Q110 247 217 258T435 254T720 258V340H0Z"
        fill="url(#sea)"
      />
      <path d="M191 204H592l-40 52H244Z" fill="#084a86" />
      <path d="M198 204h394l-13 18H216Z" fill="#fff" />
      <path d="M287 159h199v45H267v-24h20Z" fill="#f9fcff" />
      <path d="M348 121h82v38h-99v-15h17Z" fill="#fff" />
      <path d="M371 100h31v21h-31Z" fill="#1963a0" />
      <path
        d="M383 99V74m-12 10h24"
        fill="none"
        stroke="#084a86"
        strokeWidth="3"
      />
      <g fill="#2787c3">
        {[345, 368, 391, 414].map((x) => (
          <rect key={x} x={x} y="134" width="15" height="10" rx="2" />
        ))}
        {[300, 334, 368, 402, 436].map((x) => (
          <rect key={x} x={x} y="176" width="20" height="10" rx="2" />
        ))}
      </g>
      <path d="M498 168h23v36h-23m33-51h22v51h-22" fill="#7bb5d9" />
      <path
        d="M242 268q120 18 281-1M362 291h170m-340-7h68m328 9h82"
        stroke="#83c5ea"
        fill="none"
        strokeWidth="2"
        opacity=".7"
      />
      <path d="M0 292h239l34 48H0Z" fill="#e7eef5" />
      <g strokeLinecap="round" strokeLinejoin="round">
        <path d="M75 272l-8 55m31-55 9 55" stroke="#123b60" strokeWidth="16" />
        <path d="M67 223q19-12 38 0l10 56H59Z" fill="#1169ac" />
        <path
          d="M76 222v49m21-49v49m-36-10h50"
          stroke="#c3eaf9"
          strokeWidth="5"
        />
        <ellipse cx="87" cy="204" rx="15" ry="18" fill="#c98f65" />
        <path d="M70 200q0-26 18-26t18 26Z" fill="#fff" />
        <path d="M66 200h43m-21-24v17" stroke="#b3cfdf" strokeWidth="4" />
        <path d="M106 231l20 18 34-9" stroke="#1169ac" strokeWidth="14" />
        <path
          d="M162 274l-8 53m29-53 11 53"
          stroke="#123b60"
          strokeWidth="15"
        />
        <path d="M150 225q20-13 37 0l11 54h-56Z" fill="#f7fbff" />
        <path
          d="M157 224v46m23-46v46m-35-9h49"
          stroke="#72b7dc"
          strokeWidth="5"
        />
        <ellipse cx="170" cy="205" rx="14" ry="18" fill="#e3b293" />
        <path d="M153 200q0-25 17-25t18 25Z" fill="#0876bd" />
        <path d="M150 200h39m-19-22v16" stroke="#06578c" strokeWidth="4" />
        <path d="M151 233l-19 24" stroke="#f7fbff" strokeWidth="14" />
        <path
          d="M112 242l39-5 17 20-39 6Z"
          fill="#badff1"
          stroke="#286492"
          strokeWidth="2"
        />
        <path d="M125 247l16-2 11 8-18 2Z" fill="none" stroke="#286492" />
      </g>
      <g fill="#fff" opacity=".8">
        <circle cx="555" cy="238" r="3" />
        <circle cx="540" cy="238" r="3" />
      </g>
    </svg>
  );
}
