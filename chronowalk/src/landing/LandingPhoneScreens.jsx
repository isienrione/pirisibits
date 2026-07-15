import { archTitusNow, pantheonNow, colosseumNow, treviNow, castelNow } from '../redesign/images.js'
import {
  LANDING_COLOSSEUM_NOW,
  LANDING_COLOSSEUM_THEN,
  LANDING_PANTHEON_NOW,
} from './landingVisualAssets.js'
import LandingPhoneViewport from './LandingPhoneViewport.jsx'

/** Native-looking status strip — installed PWA, never Safari URL chrome. */
function NativeStatusBar({ light = false }) {
  return (
    <div
      className={`cw-landing-screen__status${light ? ' cw-landing-screen__status--light' : ''}`}
      aria-hidden
    >
      <span>9:41</span>
      <span className="cw-landing-screen__status-icons">
        <span className="cw-landing-screen__status-signal" />
        <span className="cw-landing-screen__status-wifi" />
        <span className="cw-landing-screen__status-battery" />
      </span>
    </div>
  )
}

/** Product shell tab bar — mirrors ShellTabBar, dark-on-bone. */
function NativeTabBar({ active = 'tour' }) {
  const tabs = [
    { id: 'tour', label: 'My Tour' },
    { id: 'stops', label: 'Stops' },
    { id: 'map', label: 'Map' },
    { id: 'journal', label: 'Journal' },
  ]
  return (
    <nav className="cw-landing-screen__tabbar" aria-hidden>
      {tabs.map((tab) => (
        <span
          key={tab.id}
          className={`cw-landing-screen__tabbar-item${
            tab.id === active ? ' cw-landing-screen__tabbar-item--on' : ''
          }`}
        >
          <span className="cw-landing-screen__tabbar-icon" />
          <span className="cw-landing-screen__tabbar-label">{tab.label}</span>
        </span>
      ))}
    </nav>
  )
}

/**
 * Step 1 — Choose your Rome: landmark timeline (native home-screen PWA look).
 * Matches the route story, without Safari chrome or landing “Try free” chrome.
 */
export function JourneyPickScreen({ size = 'md' }) {
  const stops = [
    { n: 1, title: 'Colosseum', photo: colosseumNow || LANDING_COLOSSEUM_NOW, gapAfter: 1 },
    { n: 3, title: 'Arch of Titus', photo: archTitusNow, gapAfter: 2 },
    { n: 14, title: 'Fontana di Trevi', photo: treviNow, gapAfter: 0 },
    { n: 15, title: 'The Pantheon', photo: pantheonNow || LANDING_PANTHEON_NOW, gapAfter: 3 },
    { n: 19, title: 'Castel Sant’Angelo', photo: castelNow, gapAfter: 0 },
  ]

  return (
    <LandingPhoneViewport label="ChronoWalk Rome route timeline" size={size}>
      <div className="cw-landing-screen cw-landing-screen--timeline">
        <NativeStatusBar />

        <header className="cw-landing-screen__timeline-header">
          <span className="cw-landing-screen__chip" aria-hidden>
            ←
          </span>
          <p className="cw-landing-screen__timeline-brand">ChronoWalk</p>
          <span className="cw-landing-screen__chip cw-landing-screen__chip--quiet" aria-hidden>
            ···
          </span>
        </header>

        <div className="cw-landing-screen__timeline-list">
          <span className="cw-landing-screen__timeline-seam" aria-hidden />
          {stops.map((stop) => (
            <div key={stop.n} className="cw-landing-screen__timeline-block">
              <div className="cw-landing-screen__timeline-row">
                <span className="cw-landing-screen__timeline-node">{stop.n}</span>
                {stop.photo ? (
                  <img className="cw-landing-screen__timeline-photo" src={stop.photo} alt="" />
                ) : (
                  <span className="cw-landing-screen__timeline-photo cw-landing-screen__timeline-photo--empty" />
                )}
                <p className="cw-landing-screen__timeline-title">{stop.title}</p>
              </div>
              {stop.gapAfter > 0 ? (
                <div className="cw-landing-screen__timeline-gap" aria-hidden>
                  {Array.from({ length: Math.min(stop.gapAfter, 4) }, (_, i) => (
                    <span key={i} className="cw-landing-screen__timeline-dot" />
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <NativeTabBar active="stops" />
      </div>
    </LandingPhoneViewport>
  )
}

/** Step 2 — walking companion steps view. */
export function MapRouteScreen({ size = 'md' }) {
  const steps = [
    { n: 1, text: 'Start walking toward Arch of Titus', dist: '92 m' },
    { n: 2, text: 'Turn right onto Colosseo.', dist: '9 m' },
    { n: 3, text: 'Turn left onto Piazza del Colosseo.', dist: '44 m' },
  ]

  return (
    <LandingPhoneViewport label="ChronoWalk walking steps" size={size}>
      <div className="cw-landing-screen cw-landing-screen--walk">
        <NativeStatusBar />

        <header className="cw-landing-screen__walk-header">
          <div className="cw-landing-screen__walk-copy">
            <p className="cw-landing-screen__walk-eyebrow">Walking to</p>
            <h3 className="cw-landing-screen__walk-title">Arch of Titus</h3>
            <p className="cw-landing-screen__walk-meta">335 m · 4 min</p>
          </div>
          <img className="cw-landing-screen__walk-thumb" src={archTitusNow} alt="" />
        </header>

        <div className="cw-landing-screen__walk-tabs" aria-hidden>
          <span>Map</span>
          <span className="cw-landing-screen__walk-tab--on">Steps</span>
        </div>

        <p className="cw-landing-screen__walk-then">
          <span>Then</span> Arrive at Clivus Palatino
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

        <NativeTabBar active="map" />
      </div>
    </LandingPhoneViewport>
  )
}

/** Arrival UI — “You have arrived” + Begin Chapter (real product). */
export function ArriveScreen({ size = 'md' }) {
  return (
    <LandingPhoneViewport label="ChronoWalk arrival — Arch of Titus" size={size}>
      <div className="cw-landing-screen cw-landing-screen--arrived">
        <NativeStatusBar />

        <header className="cw-landing-screen__arrived-top">
          <span className="cw-landing-screen__chip" aria-hidden>
            ←
          </span>
        </header>

        <p className="cw-landing-screen__arrived-label">You have arrived</p>
        <h3 className="cw-landing-screen__arrived-title">Arch of Titus</h3>

        <div className="cw-landing-screen__arrived-photo-wrap">
          <img className="cw-landing-screen__arrived-photo" src={archTitusNow} alt="" />
        </div>

        <button type="button" className="cw-landing-screen__arrived-cta" tabIndex={-1}>
          Begin Chapter
        </button>

        <NativeTabBar active="map" />
      </div>
    </LandingPhoneViewport>
  )
}

/** Immersive listening — Arch of Titus chapter. */
export function ListeningScreen({ size = 'md' }) {
  return (
    <LandingPhoneViewport label="ChronoWalk Arch of Titus chapter" size={size}>
      <div
        className="cw-landing-screen cw-landing-screen--listen"
        style={{ backgroundImage: `url(${archTitusNow})` }}
      >
        <div className="cw-landing-screen__listen-scrim" aria-hidden />
        <NativeStatusBar />

        <header className="cw-landing-screen__listen-top">
          <span className="cw-landing-screen__chip">←</span>
          <span className="cw-landing-screen__listen-act">Act II — The Gate &amp; the Hill</span>
          <span className="cw-landing-screen__chip">?</span>
        </header>

        <div className="cw-landing-screen__listen-hero">
          <h3>Arch of Titus</h3>
          <p>Stand where triumph entered the city.</p>
          <span className="cw-landing-screen__hold-pill">Press &amp; hold to reveal</span>
        </div>

        <div className="cw-landing-screen__listen-panel">
          <div className="cw-landing-screen__listen-tabs" aria-hidden>
            <span className="cw-landing-screen__listen-tab--on">Audio</span>
            <span>Read instead</span>
          </div>

          <p className="cw-landing-screen__listen-chapter">
            Chapter 1 of 3 · Arch of Titus I — The Long Way Around
          </p>
          <p className="cw-landing-screen__listen-note">
            Evidence-based reconstruction · relief details simplified for clarity
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
            <span>0:01</span>
            <span>2:51</span>
          </div>

          <div className="cw-landing-screen__listen-transport" aria-hidden>
            <span className="cw-landing-screen__listen-skip" />
            <span className="cw-landing-screen__listen-play" />
            <span className="cw-landing-screen__listen-skip" />
          </div>

          <div className="cw-landing-screen__listen-cta">Skip ahead →</div>
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
        <NativeStatusBar />

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
            Chapter 1 of 4 · The Pantheon — Exterior (~4:00)
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
        <NativeStatusBar />
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

const SCREEN_BY_KEY = {
  journey: JourneyPickScreen,
  map: MapRouteScreen,
  arrive: ArriveScreen,
  audio: ListeningScreen,
  listening: ListeningScreen,
  preview: PreviewScreen,
  threshold: ThresholdRevealScreen,
}

export function LandingStepMockup({ variant = 'journey', size = 'md' }) {
  const Screen = SCREEN_BY_KEY[variant] ?? JourneyPickScreen
  return <Screen size={size} />
}
