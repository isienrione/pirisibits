import { Footprints } from 'lucide-react'
import { T } from '../../redesign/tokens.js'
import NextTurnsCard from '../../redesign/ui/NextTurnsCard.jsx'
import WalkingMapChrome from '../../redesign/ui/WalkingMapChrome.jsx'
import { getShellTabs } from '../../shell/config.js'
import LandingPhoneViewport from '../LandingPhoneViewport.jsx'

const TITUS_PHOTO = '/waypoints/forum-cluster/forum-arch-titus/modern-exterior.jpg'
const SATELLITE_SRC = '/landing/rome-pricing-basemap-ancient.jpg'

const DEMO_STEPS = [
  { instruction: 'Exit the Colosseum toward Via Sacra', distanceM: 90, streetName: 'Via Sacra' },
  { instruction: 'Continue along Via Sacra', distanceM: 140, streetName: 'Via Sacra' },
  { instruction: 'Arch of Titus is ahead on your right', distanceM: 55, streetName: 'Via Sacra' },
]

/**
 * Static satellite hero that matches WalkingCompanion map slot.
 * Real Mapbox needs a token; this preserves the production chrome + route language.
 */
function LandingSatelliteWalkMap() {
  return (
    <div className="cw-rb-walk-map" data-testid="landing-walk-satellite-map">
      <img
        className="cw-rb-walk-map__basemap"
        src={SATELLITE_SRC}
        alt=""
        decoding="async"
        draggable={false}
      />
      <svg className="cw-rb-walk-map__route" viewBox="0 0 320 240" aria-hidden="true">
        <defs>
          <filter id="cw-rb-walk-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d="M48 188 C 78 168, 96 150, 118 132 S 168 96, 198 84 S 248 72, 272 58"
          fill="none"
          stroke="#e8a13c"
          strokeWidth="10"
          strokeLinecap="round"
          opacity="0.28"
        />
        <path
          d="M48 188 C 78 168, 96 150, 118 132 S 168 96, 198 84 S 248 72, 272 58"
          fill="none"
          stroke="#e8a13c"
          strokeWidth="4.2"
          strokeLinecap="round"
          filter="url(#cw-rb-walk-glow)"
        />
        <circle cx="48" cy="188" r="7" fill="#f5efe3" stroke="#e8a13c" strokeWidth="2.5" className="cw-rb-walk-map__gps" />
        <circle cx="272" cy="58" r="8" fill="#211c15" stroke="#f5efe3" strokeWidth="2.2" />
        <text x="272" y="62" textAnchor="middle" fill="#f5efe3" fontSize="9" fontWeight="700" fontFamily="DM Sans, sans-serif">
          2
        </text>
      </svg>
      <WalkingMapChrome bearing={12} visible />
    </div>
  )
}

/**
 * Production walking-companion UI in the landing phone frame.
 * Uses the same chrome, next-turns card, and shell tabs as the live app.
 */
export default function RomeDayWalkPhone({ size = 'lg', className = '' }) {
  const tabs = getShellTabs()

  return (
    <LandingPhoneViewport
      label="ChronoWalk navigation — walking to Arch of Titus"
      size={size}
      className={className}
    >
      <div
        className="cw-walking-companion cw-walking-companion--walking cw-rb-rome-day__companion"
        data-testid="rome-day-walk-phone"
        style={{
          '--wc-accent': T.actI,
          '--wc-success': T.actII,
          '--wc-footer-extra': '0px',
        }}
      >
        <header className="cw-walking-companion__header">
          <p className="cw-walking-companion__eyebrow">Walking to</p>
          <div className="cw-walking-companion__title-row">
            <h3 className="cw-walking-companion__title">Arch of Titus</h3>
            <img className="cw-walking-companion__thumb" src={TITUS_PHOTO} alt="" />
          </div>
          <div className="cw-walking-companion__subtitle">
            <p className="cw-walking-companion__distance" data-testid="walking-distance-meta">
              <Footprints className="cw-walking-companion__distance-icon" size={15} strokeWidth={2} aria-hidden />
              <span>285 m · 4 min</span>
            </p>
          </div>
        </header>

        <div className="cw-walking-companion__body">
          <div className="cw-walking-companion__view-toggle" aria-hidden="true">
            <span className="cw-walking-companion__view-btn cw-walking-companion__view-btn--active">
              Map
            </span>
            <span className="cw-walking-companion__view-btn">Steps</span>
          </div>

          <div className="cw-walking-companion__map-wrap">
            <div className="cw-walking-companion__hero-stack">
              <div className="cw-walking-companion__hero-layer cw-walking-companion__hero-layer--visible">
                <LandingSatelliteWalkMap />
              </div>
            </div>
          </div>

          <div className="cw-walking-companion__next-turns">
            <NextTurnsCard
              steps={DEMO_STEPS}
              currentStepIndex={0}
              destinationTitle="Arch of Titus"
              destinationPhoto={TITUS_PHOTO}
              maxVisible={3}
            />
          </div>
        </div>

        <footer className="cw-walking-companion__footer">
          <div className="cw-walking-companion__dock">
            <button type="button" className="cw-walking-companion__dock-btn cw-wc-pressable" tabIndex={-1}>
              Pause walk
            </button>
            <button
              type="button"
              className="cw-walking-companion__dock-btn cw-walking-companion__dock-btn--here cw-wc-pressable cw-rb-rome-day__cta-glow"
              tabIndex={-1}
            >
              I&apos;m here
            </button>
          </div>
        </footer>

        <nav className="cw-rb-rome-day__shell-tabs" aria-hidden="true">
          {tabs.map((tab, i) => {
            const Icon = tab.Icon
            return (
              <span
                key={tab.id}
                className={`cw-rb-rome-day__shell-tab${i === 0 ? ' is-active' : ''}`}
              >
                {Icon ? <Icon size={16} strokeWidth={2} aria-hidden /> : null}
                <span>{tab.label}</span>
              </span>
            )
          })}
        </nav>
      </div>
    </LandingPhoneViewport>
  )
}
