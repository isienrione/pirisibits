import LandingPhoneFrame from './LandingPhoneFrame.jsx'
import { pantheonNow } from '../redesign/images.js'
import { T } from '../redesign/tokens.js'
import {
  LANDING_COLOSSEUM_NOW,
  LANDING_COLOSSEUM_THEN,
  LANDING_PANTHEON_NOW,
} from './landingVisualAssets.js'
import LandingPhoneViewport from './LandingPhoneViewport.jsx'

const ACT = {
  I: T.actI ?? '#c45a3a',
  II: T.actII ?? '#6f8054',
  III: T.actIII ?? '#d4af37',
}

/**
 * Lemon / marketing–grade 390×844 app shots for the How-it-works phones.
 * Full-bleed into the iPhone frame (no CSS artboard scale).
 * Hero / walk / listen stills feature the Pantheon free-preview stop.
 */
export const HOW_IT_WORKS_SHOTS = {
  journey: {
    src: '/landing/phone-screens/journey.jpg',
    label: 'ChronoWalk route overview',
  },
  map: {
    /** Filename includes landmark so SW CacheFirst cannot serve a prior Titus still. */
    src: '/landing/phone-screens/walk-pantheon.jpg',
    label: 'ChronoWalk walking steps — Pantheon',
  },
  listening: {
    src: '/landing/phone-screens/listen-pantheon.jpg',
    label: 'ChronoWalk Pantheon chapter',
  },
  arrive: {
    src: '/landing/phone-screens/listen-pantheon.jpg',
    label: 'ChronoWalk Pantheon chapter',
  },
  audio: {
    src: '/landing/phone-screens/listen-pantheon.jpg',
    label: 'ChronoWalk Pantheon chapter',
  },
}

/** Full-bleed product screenshot inside the realistic iPhone frame. */
export function ProductShotScreen({ src, label, size = 'lg' }) {
  return (
    <LandingPhoneFrame label={label} size={size}>
      <img className="cw-landing-phone__shot" src={src} alt="" decoding="async" />
    </LandingPhoneFrame>
  )
}

/** Step 1 — route overview (cream “your route” screen). */
export function JourneyPickScreen({ size = 'md' }) {
  const stops = [
    { n: 1, title: 'The Colosseum', color: ACT.I, act: 'ACT I', filled: true },
    { n: 2, title: 'Colosseum interior', color: ACT.I, act: null, filled: false },
    { n: 3, title: 'Arch of Titus', color: ACT.II, act: 'ACT II', filled: false },
    { n: 4, title: 'Basilica of Maxentius', color: ACT.III, act: 'ACT III', filled: false },
    { n: 5, title: 'Via Sacra', color: ACT.III, act: null, filled: false },
    { n: 6, title: 'Temple of Vesta', color: ACT.III, act: null, filled: false },
    { n: 7, title: 'Forum rest', color: ACT.III, act: null, filled: false },
    { n: 8, title: 'The Rostra', color: ACT.III, act: null, filled: false },
  ]

  return (
    <LandingPhoneViewport label="ChronoWalk route overview" size={size}>
      <div className="cw-landing-screen cw-landing-screen--route">
        <header className="cw-landing-screen__route-header">
          <p className="cw-landing-screen__route-city">Rome, Italy</p>
          <h3 className="cw-landing-screen__route-title">18 stops · your route</h3>
        </header>

        <div className="cw-landing-screen__route-map" aria-hidden>
          <span className="cw-landing-screen__route-compass">N</span>
          <span className="cw-landing-screen__route-path" />
          {stops.map((stop, i) => (
            <div
              key={stop.n}
              className="cw-landing-screen__route-node"
              style={{
                top: `${6 + i * 10.5}%`,
                left: i % 2 === 0 ? '14%' : '52%',
              }}
            >
              {stop.act ? (
                <span className="cw-landing-screen__route-act" style={{ color: stop.color }}>
                  {stop.act}
                </span>
              ) : null}
              <span
                className={`cw-landing-screen__route-dot${stop.filled ? ' cw-landing-screen__route-dot--filled' : ''}`}
                style={{
                  background: stop.filled ? stop.color : '#faf6ef',
                  borderColor: stop.color,
                  color: stop.filled ? '#faf6ef' : stop.color,
                }}
              >
                {stop.n}
              </span>
              <span className="cw-landing-screen__route-label">{stop.title}</span>
            </div>
          ))}
        </div>

        <p className="cw-landing-screen__route-note">
          Next you&apos;ll enable location — then the guided tutorial begins at your first stop.
        </p>
        <div className="cw-landing-screen__route-cta">Enable location &amp; begin</div>
      </div>
    </LandingPhoneViewport>
  )
}

/** Step 2 — walking companion steps view. */
export function MapRouteScreen({ size = 'md' }) {
  const steps = [
    { n: 1, text: 'Continue along Via del Seminario', dist: '120 m' },
    { n: 2, text: 'Cross Piazza della Rotonda', dist: '90 m' },
    { n: 3, text: 'The Pantheon portico is ahead', dist: '70 m' },
  ]

  return (
    <LandingPhoneViewport label="ChronoWalk walking steps — Pantheon" size={size}>
      <div className="cw-landing-screen cw-landing-screen--walk">
        <header className="cw-landing-screen__walk-header">
          <div className="cw-landing-screen__walk-copy">
            <p className="cw-landing-screen__walk-eyebrow">Walking to</p>
            <h3 className="cw-landing-screen__walk-title">The Pantheon</h3>
            <p className="cw-landing-screen__walk-meta">280 m · 4 min</p>
          </div>
          <img className="cw-landing-screen__walk-thumb" src={LANDING_PANTHEON_NOW || pantheonNow} alt="" />
        </header>

        <div className="cw-landing-screen__walk-tabs" aria-hidden>
          <span>Map</span>
          <span className="cw-landing-screen__walk-tab--on">Steps</span>
        </div>

        <p className="cw-landing-screen__walk-then">
          <span>Then</span> Arrive at Piazza della Rotonda
        </p>

        <div className="cw-landing-screen__walk-list">
          {steps.map((step) => (
            <div key={step.n} className="cw-landing-screen__walk-step">
              <span className="cw-landing-screen__walk-num">{step.n}</span>
              <div>
                <strong>{step.text}</strong>
                <p>{step.dist}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="cw-landing-screen__walk-actions">
          <span>Pause walk</span>
          <span className="cw-landing-screen__walk-here">I&apos;m here</span>
        </div>

        <nav className="cw-landing-screen__tabbar" aria-hidden>
          <span className="cw-landing-screen__tabbar-item cw-landing-screen__tabbar-item--on" />
          <span className="cw-landing-screen__tabbar-item" />
          <span className="cw-landing-screen__tabbar-item" />
          <span className="cw-landing-screen__tabbar-item" />
        </nav>
      </div>
    </LandingPhoneViewport>
  )
}

/** Arrival UI — “You have arrived” + Begin Chapter (real product). */
export function ArriveScreen({ size = 'md' }) {
  return (
    <LandingPhoneViewport label="ChronoWalk arrival — The Pantheon" size={size}>
      <div className="cw-landing-screen cw-landing-screen--arrived">
        <header className="cw-landing-screen__arrived-top">
          <span className="cw-landing-screen__chip" aria-hidden>
            ←
          </span>
        </header>

        <p className="cw-landing-screen__arrived-label">You have arrived</p>
        <h3 className="cw-landing-screen__arrived-title">The Pantheon</h3>

        <div className="cw-landing-screen__arrived-photo-wrap">
          <img
            className="cw-landing-screen__arrived-photo"
            src={LANDING_PANTHEON_NOW || pantheonNow}
            alt=""
          />
        </div>

        <button type="button" className="cw-landing-screen__arrived-cta" tabIndex={-1}>
          Begin Chapter
        </button>

        <nav className="cw-landing-screen__tabbar" aria-hidden>
          <span className="cw-landing-screen__tabbar-item cw-landing-screen__tabbar-item--on" />
          <span className="cw-landing-screen__tabbar-item" />
          <span className="cw-landing-screen__tabbar-item" />
          <span className="cw-landing-screen__tabbar-item" />
        </nav>
      </div>
    </LandingPhoneViewport>
  )
}

/** Immersive listening — Pantheon free-preview chapter (hero + how-it-works). */
export function ListeningScreen({ size = 'md' }) {
  return (
    <LandingPhoneViewport label="ChronoWalk Pantheon chapter" size={size}>
      <div
        className="cw-landing-screen cw-landing-screen--listen"
        style={{ backgroundImage: `url(${LANDING_PANTHEON_NOW || pantheonNow})` }}
      >
        <div className="cw-landing-screen__listen-scrim" aria-hidden />

        <header className="cw-landing-screen__listen-top">
          <span className="cw-landing-screen__chip">←</span>
          <span className="cw-landing-screen__listen-act">Free preview · Pantheon</span>
          <span className="cw-landing-screen__chip">?</span>
        </header>

        <div className="cw-landing-screen__listen-hero">
          <h3>The Pantheon</h3>
          <p>Two thousand years of sky through one opening.</p>
          <span className="cw-landing-screen__hold-pill">Press &amp; hold to reveal</span>
        </div>

        <div className="cw-landing-screen__listen-panel">
          <div className="cw-landing-screen__listen-tabs" aria-hidden>
            <span className="cw-landing-screen__listen-tab--on">Audio</span>
            <span>Read instead</span>
          </div>

          <p className="cw-landing-screen__listen-chapter">
            Chapter 1 of 1 · The Pantheon — Exterior (~4:00)
          </p>
          <p className="cw-landing-screen__listen-note">
            Evidence-based reconstruction · portico bronze finish is informed conjecture
          </p>

          <div className="cw-landing-screen__listen-wave" aria-hidden>
            {Array.from({ length: 36 }, (_, i) => (
              <span
                key={i}
                className={i < 8 ? 'is-played' : undefined}
                style={{ height: `${22 + ((i * 17) % 62)}%` }}
              />
            ))}
          </div>

          <div className="cw-landing-screen__listen-times" aria-hidden>
            <span>0:03</span>
            <span>3:57</span>
          </div>

          <div className="cw-landing-screen__listen-transport" aria-hidden>
            <span className="cw-landing-screen__listen-skip" />
            <span className="cw-landing-screen__listen-play" />
            <span className="cw-landing-screen__listen-skip" />
          </div>

          <div className="cw-landing-screen__listen-cta">See the full tour →</div>
        </div>
      </div>
    </LandingPhoneViewport>
  )
}

/** Pantheon free-preview player — Try free section. */
export function PreviewScreen({ size = 'md' }) {
  return (
    <LandingPhoneViewport label="ChronoWalk Pantheon free preview" size={size}>
      <div
        className="cw-landing-screen cw-landing-screen--preview"
        style={{ backgroundImage: `url(${LANDING_PANTHEON_NOW || pantheonNow})` }}
      >
        <div className="cw-landing-screen__listen-scrim" aria-hidden />

        <header className="cw-landing-screen__listen-top">
          <span className="cw-landing-screen__chip">←</span>
          <span className="cw-landing-screen__preview-badge">Free preview · Pantheon</span>
          <span className="cw-landing-screen__chip">?</span>
        </header>

        <div className="cw-landing-screen__listen-hero">
          <h3>The Pantheon</h3>
          <p>Two thousand years of sky through one opening.</p>
          <span className="cw-landing-screen__hold-pill">Press &amp; hold to reveal</span>
        </div>

        <div className="cw-landing-screen__listen-panel">
          <div className="cw-landing-screen__listen-tabs" aria-hidden>
            <span className="cw-landing-screen__listen-tab--on cw-landing-screen__listen-tab--ember">
              Audio
            </span>
            <span>Read instead</span>
          </div>

          <p className="cw-landing-screen__listen-chapter">
            Chapter 1 of 1 · The Pantheon — Exterior (~4:00)
          </p>

          <div className="cw-landing-screen__listen-wave cw-landing-screen__listen-wave--ember" aria-hidden>
            {Array.from({ length: 36 }, (_, i) => (
              <span
                key={i}
                className={i < 6 ? 'is-played' : undefined}
                style={{ height: `${20 + ((i * 19) % 64)}%` }}
              />
            ))}
          </div>

          <div className="cw-landing-screen__listen-times" aria-hidden>
            <span>0:03</span>
            <span>3:57</span>
          </div>

          <div className="cw-landing-screen__listen-transport" aria-hidden>
            <span className="cw-landing-screen__listen-skip" />
            <span className="cw-landing-screen__listen-play" />
            <span className="cw-landing-screen__listen-skip" />
          </div>

          <div className="cw-landing-screen__listen-cta">See the full tour →</div>
        </div>
      </div>
    </LandingPhoneViewport>
  )
}

/** Threshold then/now reveal with real Colosseum pair. */
export function ThresholdRevealScreen({ size = 'md' }) {
  return (
    <LandingPhoneViewport label="ChronoWalk Colosseum threshold reveal" size={size}>
      <div className="cw-landing-screen cw-landing-screen--threshold">
        <div className="cw-landing-screen__threshold-pair" aria-hidden>
          <img src={LANDING_COLOSSEUM_NOW} alt="" className="cw-landing-screen__threshold-now" />
          <img src={LANDING_COLOSSEUM_THEN} alt="" className="cw-landing-screen__threshold-then" />
          <span className="cw-landing-screen__threshold-seam" />
        </div>
        <div className="cw-landing-screen__threshold-caption">
          <span>Today</span>
          <span>Ancient Rome</span>
        </div>
      </div>
    </LandingPhoneViewport>
  )
}

/** @deprecated Prefer ListeningScreen — alias for older “audio” call sites. */
export function AudioPlayerScreen(props) {
  return <ListeningScreen {...props} />
}

const LIVE_SCREEN_BY_KEY = {
  journey: JourneyPickScreen,
  map: MapRouteScreen,
  arrive: ArriveScreen,
  audio: ListeningScreen,
  listening: ListeningScreen,
  preview: PreviewScreen,
  threshold: ThresholdRevealScreen,
}

/**
 * How-it-works phones use fixed 390×844 product shots (representative marketing
 * size). Other call sites can request live HTML screens with `mode="live"`.
 */
export function LandingStepMockup({ variant = 'journey', size = 'lg', mode = 'shot' }) {
  const shot = HOW_IT_WORKS_SHOTS[variant]
  if (mode === 'shot' && shot) {
    return <ProductShotScreen src={shot.src} label={shot.label} size={size} />
  }
  const Screen = LIVE_SCREEN_BY_KEY[variant] ?? JourneyPickScreen
  return <Screen size={size} />
}
