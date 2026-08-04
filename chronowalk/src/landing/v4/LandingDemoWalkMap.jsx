import WalkingMapChrome from '../../redesign/ui/WalkingMapChrome.jsx'

/**
 * Walking map for landing phone demos.
 * Satellite basemap of the Spanish Steps approach (no Mapbox token at runtime)
 * plus glowing route / you-are-here chrome matching the product walking map.
 */
export default function LandingDemoWalkMap({ bearing = 18 }) {
  return (
    <div className="cw-v4-demo-walk-map" data-testid="landing-demo-walk-map">
      <img
        className="cw-v4-demo-walk-map__basemap"
        src="/landing/phone-screens/walk-map-spanish-steps.jpg"
        alt=""
        decoding="async"
        draggable={false}
      />
      <div className="cw-v4-demo-walk-map__veil" aria-hidden />
      <svg className="cw-v4-demo-walk-map__route" viewBox="0 0 390 420" aria-hidden>
        <defs>
          <filter id="cw-v4-route-glow-ss" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d="M72 365 C 110 320, 145 285, 175 250 S 245 175, 278 132 S 320 88, 338 62"
          fill="none"
          stroke="rgba(232,120,48,0.95)"
          strokeWidth="5"
          strokeLinecap="round"
          filter="url(#cw-v4-route-glow-ss)"
        />
        <circle className="cw-v4-demo-walk-map__you-ring" cx="72" cy="365" r="18" />
        <circle className="cw-v4-demo-walk-map__you" cx="72" cy="365" r="7" />
        <circle cx="338" cy="62" r="8" fill="#e88130" stroke="#f3eee6" strokeWidth="2.5" />
        <circle cx="338" cy="62" r="16" fill="none" stroke="rgba(232,129,48,0.4)" strokeWidth="2" />
        <rect
          x="248"
          y="28"
          width="118"
          height="26"
          rx="13"
          fill="rgba(12,12,14,0.88)"
        />
        <circle cx="264" cy="41" r="5" fill="#e8a13c" />
        <text
          x="276"
          y="45"
          fill="rgba(243,238,230,0.95)"
          fontSize="11"
          fontFamily="DM Sans, system-ui, sans-serif"
          fontWeight="600"
        >
          Spanish Steps
        </text>
      </svg>
      <WalkingMapChrome bearing={bearing} onRecenter={() => {}} />
    </div>
  )
}
