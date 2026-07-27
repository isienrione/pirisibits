import WalkingMapChrome from '../../redesign/ui/WalkingMapChrome.jsx'

/**
 * Live map slot for the sticky-phone walking demo.
 * Uses real WalkingMapChrome; map surface is a lightweight vector stand-in
 * so the landing never depends on Mapbox tiles or screenshots.
 */
export default function LandingDemoWalkMap({
  bearing = 28,
  directionsGeometry: _directionsGeometry,
  directionsModeActive: _directionsModeActive,
}) {
  return (
    <div className="cw-v4-demo-walk-map" data-testid="landing-demo-walk-map">
      <svg className="cw-v4-demo-walk-map__canvas" viewBox="0 0 390 420" aria-hidden>
        <defs>
          <linearGradient id="cw-v4-walk-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a2230" />
            <stop offset="100%" stopColor="#0b0b0d" />
          </linearGradient>
        </defs>
        <rect width="390" height="420" fill="url(#cw-v4-walk-sky)" />
        <path
          d="M40 80 H350 M40 140 H350 M40 200 H350 M40 260 H350 M40 320 H350 M40 380 H350"
          stroke="rgba(196,165,116,0.08)"
          strokeWidth="1"
        />
        <path
          d="M70 40 V390 M140 40 V390 M210 40 V390 M280 40 V390 M340 40 V390"
          stroke="rgba(196,165,116,0.06)"
          strokeWidth="1"
        />
        <path
          d="M48 360 C 110 300, 150 250, 190 210 S 280 120, 330 70"
          fill="none"
          stroke="rgba(224,122,95,0.85)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx="190" cy="210" r="7" fill="#f3eee6" stroke="#e07a5f" strokeWidth="3" />
        <circle cx="330" cy="70" r="9" fill="#e07a5f" />
        <circle cx="330" cy="70" r="16" fill="none" stroke="rgba(224,122,95,0.35)" strokeWidth="2" />
      </svg>
      <WalkingMapChrome bearing={bearing} onRecenter={() => {}} />
    </div>
  )
}
