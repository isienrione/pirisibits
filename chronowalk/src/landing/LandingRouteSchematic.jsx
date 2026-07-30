const ROUTE_POINTS = [
  { label: 'Colosseum', x: 14, y: 74, day: 1 },
  { label: 'Roman Forum', x: 32, y: 58, day: 1 },
  { label: 'Pantheon', x: 50, y: 44, day: 1 },
  { label: 'Trevi', x: 68, y: 54, day: 2 },
  { label: 'Spanish Steps', x: 86, y: 28, day: 2 },
]

const PATH_D =
  'M 14 74 C 22 68, 26 62, 32 58 S 42 50, 50 44 S 60 48, 68 54 S 78 42, 86 28'

/**
 * Static SVG route schematic · landing only, no map tiles.
 */
export default function LandingRouteSchematic({
  stops = ROUTE_POINTS.map((p) => p.label),
  variant = 'artifact',
}) {
  const points = ROUTE_POINTS.filter((p) => stops.includes(p.label))
  const className = [
    'cw-landing-route-schematic',
    variant === 'bone' ? 'cw-landing-route-schematic--bone' : '',
    variant === 'artifact' ? 'cw-landing-route-schematic--artifact' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={className} aria-hidden>
      <div className="cw-landing-route-schematic__days">
        <span>Day one</span>
        <span>Day two</span>
      </div>
      <svg viewBox="0 0 100 82" className="cw-landing-route-schematic__svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="cw-route-grad" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--act-arena, #e4552e)" stopOpacity="0.85" />
            <stop offset="55%" stopColor="var(--ember, #e8a13c)" stopOpacity="0.95" />
            <stop offset="100%" stopColor="var(--act-teal, #4e9b8f)" stopOpacity="0.8" />
          </linearGradient>
          <filter id="cw-route-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path d={PATH_D} className="cw-landing-route-schematic__path" fill="none" />
        {points.map((point) => (
          <g key={point.label} filter="url(#cw-route-glow)">
            <circle cx={point.x} cy={point.y} r="2.8" className="cw-landing-route-schematic__dot" />
            <circle cx={point.x} cy={point.y} r="5.5" className="cw-landing-route-schematic__halo" />
          </g>
        ))}
      </svg>
      <p className="cw-landing-route-schematic__trail">
        {points.map((point, index) => (
          <span key={point.label}>
            {index > 0 ? <span className="cw-landing-route-schematic__arrow"> → </span> : null}
            {point.label}
          </span>
        ))}
      </p>
    </div>
  )
}
