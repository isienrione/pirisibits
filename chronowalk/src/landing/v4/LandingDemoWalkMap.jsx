import WalkingMapChrome from '../../redesign/ui/WalkingMapChrome.jsx'

/**
 * Walking map for the sticky-phone demo.
 * Uses a committed dark-streets basemap of the Pantheon approach (no Mapbox
 * token required at runtime) plus glowing route / you-are-here chrome.
 */
export default function LandingDemoWalkMap({ bearing = 28 }) {
  return (
    <div className="cw-v4-demo-walk-map" data-testid="landing-demo-walk-map">
      <img
        className="cw-v4-demo-walk-map__basemap"
        src="/landing/phone-screens/walk-map-pantheon-dark.jpg"
        alt=""
        decoding="async"
        draggable={false}
      />
      <div className="cw-v4-demo-walk-map__veil" aria-hidden />
      <svg className="cw-v4-demo-walk-map__route" viewBox="0 0 390 420" aria-hidden>
        <defs>
          <filter id="cw-v4-route-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d="M62 360 C 120 300, 165 250, 205 200 S 285 110, 318 78"
          fill="none"
          stroke="rgba(224,122,95,0.95)"
          strokeWidth="5"
          strokeLinecap="round"
          filter="url(#cw-v4-route-glow)"
        />
        <circle className="cw-v4-demo-walk-map__you-ring" cx="205" cy="200" r="18" />
        <circle className="cw-v4-demo-walk-map__you" cx="205" cy="200" r="7" />
        <circle cx="318" cy="78" r="8" fill="#e07a5f" stroke="#f3eee6" strokeWidth="2.5" />
        <circle cx="318" cy="78" r="16" fill="none" stroke="rgba(224,122,95,0.4)" strokeWidth="2" />
        <text
          x="318"
          y="58"
          textAnchor="middle"
          fill="rgba(243,238,230,0.9)"
          fontSize="11"
          fontFamily="DM Sans, system-ui, sans-serif"
        >
          Pantheon
        </text>
      </svg>
      <WalkingMapChrome bearing={bearing} onRecenter={() => {}} />
    </div>
  )
}
