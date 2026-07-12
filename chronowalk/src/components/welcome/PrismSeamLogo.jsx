export function PrismSeamLogo({ size = 84, className = '' }) {
  const radius = size / 2

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="prism-gradient" x1="100%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E4552E" />
          <stop offset="35%" stopColor="#E8A13C" />
          <stop offset="65%" stopColor="#B77A2A" />
          <stop offset="85%" stopColor="#6E8B3D" />
          <stop offset="100%" stopColor="#3F6E86" />
        </linearGradient>
        <clipPath id="prism-right-half">
          <rect x={radius} y="0" width={radius} height={size} />
        </clipPath>
        <clipPath id="prism-left-half">
          <rect x="0" y="0" width={radius} height={size} />
        </clipPath>
      </defs>
      <circle cx={radius} cy={radius} r={radius - 1} fill="var(--obsidian)" />
      <circle
        cx={radius}
        cy={radius}
        r={radius - 1}
        fill="url(#prism-gradient)"
        clipPath="url(#prism-right-half)"
      />
      <line
        x1={radius}
        y1={4}
        x2={radius}
        y2={size - 4}
        stroke="var(--ember)"
        strokeWidth="3"
        style={{ filter: 'drop-shadow(0 0 8px var(--ember-glow))' }}
      />
    </svg>
  )
}
