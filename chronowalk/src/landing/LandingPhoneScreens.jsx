import { archTitusNow, basilicaNow, colosseumNow, templeVestaNow } from '../redesign/images.js'
import { T } from '../redesign/tokens.js'
import LandingColosseumThreshold from './LandingColosseumThreshold.jsx'
import LandingPhoneViewport from './LandingPhoneViewport.jsx'

/** Step 1 — route overview with act beats (matches live “Your route” screen). */
export function JourneyPickScreen() {
  const stops = [
    { n: 1, title: 'The Colosseum', photo: colosseumNow, color: T.actI, act: 'ACT I' },
    { n: 3, title: 'Arch of Titus', photo: archTitusNow, color: T.actII, act: 'ACT II' },
    { n: 4, title: 'Basilica of Maxentius', photo: basilicaNow, color: T.actIII, act: 'ACT III' },
    { n: 6, title: 'Temple of Vesta', photo: templeVestaNow, color: T.actIII, act: null },
  ]

  return (
    <LandingPhoneViewport label="ChronoWalk route overview">
      <div className="cw-landing-screen cw-landing-screen--route">
        <header className="cw-landing-screen__route-header">
          <p className="cw-landing-screen__route-city">Rome, Italy</p>
          <h3 className="cw-landing-screen__route-title">18 stops · your route</h3>
        </header>

        <div className="cw-landing-screen__route-map" aria-hidden>
          <span className="cw-landing-screen__route-path" />
          {stops.map((stop, i) => (
            <div
              key={stop.n}
              className="cw-landing-screen__route-node"
              style={{
                top: `${8 + i * 20}%`,
                left: i % 2 === 0 ? '18%' : '58%',
              }}
            >
              {stop.act ? (
                <span className="cw-landing-screen__route-act" style={{ color: stop.color }}>
                  {stop.act}
                </span>
              ) : null}
              <span
                className="cw-landing-screen__route-dot"
                style={{ background: stop.color, borderColor: stop.color }}
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
export function MapRouteScreen() {
  const steps = [
    { n: 1, text: 'Start walking toward Arch of Titus', dist: '92 m' },
    { n: 2, text: 'Turn right onto Colosseo.', dist: '9 m' },
    { n: 3, text: 'Turn left onto Piazza del Colosseo.', dist: '44 m' },
  ]

  return (
    <LandingPhoneViewport label="ChronoWalk walking steps">
      <div className="cw-landing-screen cw-landing-screen--walk">
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
      </div>
    </LandingPhoneViewport>
  )
}

/** Step 3 — arrive + press-and-hold reveal (Arch of Titus chapter). */
export function AudioPlayerScreen() {
  return (
    <LandingPhoneViewport label="ChronoWalk arrival and reveal">
      <div
        className="cw-landing-screen cw-landing-screen--arrive"
        style={{ backgroundImage: `url(${archTitusNow})` }}
      >
        <div className="cw-landing-screen__arrive-scrim" aria-hidden />

        <header className="cw-landing-screen__arrive-top">
          <span>Back</span>
          <span className="cw-landing-screen__arrive-act">Act II — The Gate &amp; the Hill</span>
          <span aria-hidden>?</span>
        </header>

        <div className="cw-landing-screen__arrive-copy">
          <h3>Arch of Titus</h3>
          <p>Stand where triumph entered the city.</p>
          <span className="cw-landing-screen__arrive-hold">Press &amp; hold to reveal</span>
        </div>

        <div className="cw-landing-screen__arrive-tabs" aria-hidden>
          <span className="cw-landing-screen__arrive-tab--on">Audio</span>
          <span>Read instead</span>
        </div>

        <p className="cw-landing-screen__arrive-chapter">
          Chapter 1 of 3 · Arch of Titus I — The Long Way Around
        </p>

        <div className="cw-landing-screen__arrive-wave" aria-hidden>
          {Array.from({ length: 32 }, (_, i) => (
            <span key={i} style={{ height: `${22 + ((i * 13) % 58)}%` }} />
          ))}
        </div>

        <div className="cw-landing-screen__arrive-transport" aria-hidden>
          <span />
          <span className="cw-landing-screen__arrive-play" />
          <span />
        </div>

        <div className="cw-landing-screen__arrive-cta">Skip ahead →</div>
      </div>
    </LandingPhoneViewport>
  )
}

/** Kept for hero / try-free when they still request threshold. */
export function ThresholdRevealScreen() {
  return (
    <LandingPhoneViewport label="ChronoWalk Colosseum threshold reveal">
      <div className="cw-landing-screen cw-landing-screen--threshold">
        <LandingColosseumThreshold
          reveal={0.36}
          className="cw-landing-screen__threshold"
          hint="Press & hold"
        />
        <div className="cw-landing-screen__threshold-caption">
          <span>Today</span>
          <span>Ancient Rome</span>
        </div>
      </div>
    </LandingPhoneViewport>
  )
}

const SCREEN_BY_KEY = {
  journey: JourneyPickScreen,
  map: MapRouteScreen,
  audio: AudioPlayerScreen,
  threshold: ThresholdRevealScreen,
}

export function LandingStepMockup({ variant = 'journey' }) {
  const Screen = SCREEN_BY_KEY[variant] ?? JourneyPickScreen
  return <Screen />
}
