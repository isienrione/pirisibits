import { lazy, Suspense, useCallback, useRef, useState } from 'react'
import { track, TRACK_EVENTS } from '../lib/track.js'
import { colosseumNow, THEN_colosseum } from '../redesign/images.js'
import { revealToClipRight, revealToSeamPercent } from '../utils/thresholdReveal.js'
import LandingSection from './LandingSection.jsx'
import { LANDING_CONTENT } from './landingData.js'

const LazyThresholdEmbed = lazy(() => import('./LandingThresholdEmbed.jsx'))

function LandingThresholdFallback() {
  const [holding, setHolding] = useState(false)
  const holdStartRef = useRef(null)

  const reveal = holding ? 1 : 0
  const clip = revealToClipRight(reveal)
  const seamLeft = `${revealToSeamPercent(reveal)}%`

  const handlePointerDown = () => {
    holdStartRef.current = performance.now()
    setHolding(true)
  }

  const handlePointerUp = () => {
    const heldMs = holdStartRef.current ? performance.now() - holdStartRef.current : 0
    holdStartRef.current = null
    setHolding(false)

    if (heldMs > 0) {
      track(TRACK_EVENTS.THRESHOLD_HOLD, {
        duration_ms: Math.round(heldMs),
        waypoint_id: 'landing-fallback',
        source: 'landing',
      })
      if (heldMs > 400) {
        track(TRACK_EVENTS.THRESHOLD_DEMO, { source: 'landing-fallback' })
      }
    }
  }

  return (
    <div
      className="cw-landing-threshold-fallback"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => holding && handlePointerUp()}
      role="img"
      aria-label="Press and hold to compare present-day Rome with a reconstruction"
    >
      <div className="cw-landing-threshold-fallback__then">
        <img src={THEN_colosseum} alt="" onError={(e) => { e.currentTarget.style.display = 'none' }} />
      </div>
      <div className="cw-landing-threshold-fallback__now" style={{ clipPath: clip, WebkitClipPath: clip }}>
        <img src={colosseumNow} alt="" onError={(e) => { e.currentTarget.style.display = 'none' }} />
      </div>
      <div className="cw-landing-threshold-fallback__seam" style={{ left: seamLeft }} />
      <p className="cw-landing-threshold-fallback__hint">Press and hold to cross</p>
    </div>
  )
}

export default function LandingThresholdDemo() {
  const { id, headline, subheadline, caption } = LANDING_CONTENT['threshold-demo']
  const demoTrackedRef = useRef(false)

  const handleFullyRevealed = useCallback(() => {
    if (demoTrackedRef.current) return
    demoTrackedRef.current = true
    track(TRACK_EVENTS.THRESHOLD_DEMO, { source: 'landing' })
  }, [])

  return (
    <LandingSection id={id} title={headline} variant="dark" className="cw-landing-threshold-section">
      <p className="cw-landing-lead">{subheadline}</p>
      <div className="cw-landing-threshold-frame">
        <Suspense fallback={<LandingThresholdFallback />}>
          <LazyThresholdEmbed onFullyRevealed={handleFullyRevealed} />
        </Suspense>
      </div>
      <p className="cw-landing-caption">{caption}</p>
    </LandingSection>
  )
}
