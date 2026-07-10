import { useMemo } from 'react'
import { JOURNEY_PACE } from '../data/romePacing.js'
import { buildMyTourActs, currentActForTour, primaryCtaLabel } from '../content/myTourPlan.js'
import { loadRomeManifest } from '../content/manifest.js'
import { photoForWaypoint } from '../redesign/lib/waypointPresentation.js'
import { T, F } from '../redesign/tokens.js'
import LandingColosseumThreshold from './LandingColosseumThreshold.jsx'
import LandingPhoneViewport from './LandingPhoneViewport.jsx'

const ACT_COLOR = {
  act1: T.actI,
  act2: T.actII,
  act3: T.actIII,
  act4: T.actIV,
  act5: T.actV,
  act6: T.actVI,
  encore: T.encore,
}

const PREVIEW_CONTEXT = {
  pace: JOURNEY_PACE.CLASSIC,
  path: 'a',
  currentSequenceIndex: 0,
  completedWaypointIds: [],
}

export function JourneyPickScreen() {
  const acts = useMemo(() => buildMyTourActs(loadRomeManifest(), PREVIEW_CONTEXT), [])
  const currentAct = useMemo(() => currentActForTour(acts), [acts])
  const ctaLabel = useMemo(() => primaryCtaLabel(acts, false), [acts])
  const visibleActs = acts.slice(0, 3)

  return (
    <LandingPhoneViewport label="ChronoWalk My Tour screen">
      <div className="cw-landing-screen cw-landing-screen--tour">
        <div className="cw-landing-screen__tour-header">
          <p className="cw-landing-screen__eyebrow">MY TOUR</p>
          <h3 className="cw-landing-screen__title">Rome on foot</h3>
          <p className="cw-landing-screen__sub">The Classic Split · 22 places</p>
        </div>

        <div className="cw-landing-screen__tour-list">
          {visibleActs.map((act) => {
            const color = ACT_COLOR[act.colorKey] ?? T.actI
            const isCurrent = act.id === currentAct?.id
            const photo = photoForWaypoint(act.photoStop)
            const actLabel = act.numeral === 'Encore' ? 'ENCORE' : `ACT ${act.numeral}`

            return (
              <div
                key={act.id}
                className={`cw-landing-screen__tour-act${isCurrent ? ' cw-landing-screen__tour-act--current' : ''}`}
              >
                <span
                  className="cw-landing-screen__tour-node"
                  style={{
                    background: isCurrent ? color : T.bone,
                    borderColor: isCurrent ? color : T.ink800,
                    boxShadow: isCurrent ? `0 0 0 4px ${color}28` : 'none',
                  }}
                  aria-hidden
                />
                {photo ? <img src={photo} alt="" className="cw-landing-screen__tour-photo" /> : null}
                <div className="cw-landing-screen__tour-copy">
                  <span className="cw-landing-screen__tour-act-label" style={{ color }}>
                    {actLabel}
                  </span>
                  <strong>{act.title}</strong>
                  <p>{act.promise}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="cw-landing-screen__tour-cta" style={{ background: ACT_COLOR[currentAct?.colorKey] ?? T.actI }}>
          {ctaLabel}
        </div>
      </div>
    </LandingPhoneViewport>
  )
}

function MapPreviewArt() {
  return (
    <svg className="cw-landing-screen__map-svg" viewBox="0 0 390 844" aria-hidden>
      <rect width="390" height="844" fill="#EFE7D2" />
      <path
        d="M 42 0 C 40 80 46 160 50 240 C 54 310 60 370 57 450 C 53 530 58 610 62 690 C 65 750 67 800 65 844
           L 88 844 C 86 800 84 750 81 690 C 77 610 82 530 78 450 C 75 370 80 310 84 240 C 88 160 90 80 88 0 Z"
        fill="#B4CAD8"
      />
      <path
        d="M 308 655 Q 272 616 262 604 Q 250 592 238 580 Q 228 570 218 560 Q 206 550 195 540 Q 182 524 172 512"
        fill="none"
        stroke={T.actI}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M 262 604 Q 250 592 238 580 Q 228 570 218 560"
        fill="none"
        stroke={T.actII}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="308" cy="655" r="7" fill={T.actI} stroke="#F5EFE3" strokeWidth="2" />
      <circle cx="285" cy="630" r="6" fill={T.actI} stroke="#F5EFE3" strokeWidth="2" />
      <circle cx="255" cy="596" r="9" fill={T.ember} stroke="#F5EFE3" strokeWidth="2" />
      <circle cx="218" cy="558" r="6" fill={T.ink800} stroke="#F5EFE3" strokeWidth="2" />
      <text x="255" y="580" textAnchor="middle" fill={T.ink} fontSize="11" fontFamily={F.body}>
        You are here
      </text>
    </svg>
  )
}

export function MapRouteScreen() {
  return (
    <LandingPhoneViewport label="ChronoWalk map screen">
      <div className="cw-landing-screen cw-landing-screen--map">
        <MapPreviewArt />
        <div className="cw-landing-screen__map-card">
          <p className="cw-landing-screen__map-eyebrow">Walking · Act II</p>
          <strong>The Palatine Hill</strong>
          <p>0.9 km · ~11 min</p>
        </div>
      </div>
    </LandingPhoneViewport>
  )
}

export function AudioPlayerScreen() {
  const manifest = useMemo(() => loadRomeManifest(), [])
  const waypoint = manifest.waypointsById.w17

  return (
    <LandingPhoneViewport label="ChronoWalk Pantheon audio player">
      <div
        className="cw-landing-screen cw-landing-screen--player"
        style={{ backgroundImage: `url(${photoForWaypoint(waypoint)})` }}
      >
        <div className="cw-landing-screen__player-scrim" />
        <p className="cw-landing-screen__eyebrow">FREE PREVIEW · PANTHEON</p>
        <h3 className="cw-landing-screen__player-title">{waypoint.title}</h3>
        <p className="cw-landing-screen__player-sub">{waypoint.arrivalLine}</p>
        <div className="cw-landing-screen__player-wave" aria-hidden>
          {Array.from({ length: 28 }, (_, i) => (
            <span key={i} style={{ height: `${24 + ((i * 11) % 52)}%` }} />
          ))}
        </div>
        <div className="cw-landing-screen__player-transport" aria-hidden>
          <span />
          <span className="cw-landing-screen__player-play" />
          <span />
        </div>
        <div className="cw-landing-screen__player-tabs">
          <span className="cw-landing-screen__player-tab cw-landing-screen__player-tab--active">audio</span>
          <span className="cw-landing-screen__player-tab">Read instead</span>
        </div>
        <p className="cw-landing-screen__player-meta">Chapter 1 of 4 · The Pantheon — EXTERIOR</p>
      </div>
    </LandingPhoneViewport>
  )
}

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
