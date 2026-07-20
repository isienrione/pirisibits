import { useCallback, useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion.js'
import { track, TRACK_EVENTS } from '../lib/track.js'
import { colosseumNow, THEN_colosseum } from '../redesign/images.js'
import { LANDING_CONTENT } from './landingData.js'

const REVEAL_MS = 780

/** Landing-only center-slice clip — NOW band shrinks toward the middle. */
function revealToCenterClip(reveal) {
  const inset = Math.min(1, Math.max(0, reveal)) * 50
  return `inset(0 ${inset}% 0 ${inset}%)`
}

/**
 * Self-contained landing threshold — colosseum NOW/THEN assets only.
 * No mapbox, audio, or journey manifest.
 */
function LandingThresholdInteractive() {
  const reducedMotion = useReducedMotion()
  const [reveal, setReveal] = useState(0)
  const holdingRef = useRef(false)
  const rafRef = useRef(0)
  const holdStartRef = useRef(null)
  const demoTrackedRef = useRef(false)

  const cancelRevealAnimation = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }
  }, [])

  const animateReveal = useCallback(() => {
    cancelRevealAnimation()
    const start = performance.now()

    const tick = (now) => {
      const t = Math.min(1, (now - start) / REVEAL_MS)
      setReveal(t)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else if (!demoTrackedRef.current) {
        demoTrackedRef.current = true
        track(TRACK_EVENTS.THRESHOLD_DEMO, { source: 'landing' })
      }
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [cancelRevealAnimation])

  const handlePointerDown = (event) => {
    event.currentTarget.setPointerCapture?.(event.pointerId)
    holdingRef.current = true
    holdStartRef.current = performance.now()

    if (reducedMotion) {
      setReveal(1)
      if (!demoTrackedRef.current) {
        demoTrackedRef.current = true
        track(TRACK_EVENTS.THRESHOLD_DEMO, { source: 'landing-reduced-motion' })
      }
      return
    }

    animateReveal()
  }

  const handlePointerUp = () => {
    if (!holdingRef.current) return

    const heldMs = holdStartRef.current ? performance.now() - holdStartRef.current : 0
    holdingRef.current = false
    holdStartRef.current = null
    cancelRevealAnimation()
    setReveal(0)

    if (heldMs > 0) {
      track(TRACK_EVENTS.THRESHOLD_HOLD, {
        duration_ms: Math.round(heldMs),
        waypoint_id: 'landing-colosseum',
        source: 'landing',
      })
    }
  }

  useEffect(() => () => cancelRevealAnimation(), [cancelRevealAnimation])

  const clip = revealToCenterClip(reveal)
  const nowOpacity = reducedMotion ? 1 - reveal : 1
  const seamVisible = reveal > 0

  return (
    <div
      className={`cw-doc-threshold-demo${reducedMotion ? ' cw-doc-threshold-demo--reduced' : ''}`}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={() => {
        if (holdingRef.current) handlePointerUp()
      }}
      role="img"
      aria-label="Press and hold to compare present-day Rome with an evidence-based reconstruction"
    >
      <div className="cw-doc-threshold-demo__then">
        <img src={THEN_colosseum} alt="" onError={(e) => { e.currentTarget.style.display = 'none' }} />
      </div>

      <div
        className="cw-doc-threshold-demo__now"
        style={
          reducedMotion
            ? { opacity: nowOpacity }
            : { clipPath: clip, WebkitClipPath: clip }
        }
      >
        <img src={colosseumNow} alt="" onError={(e) => { e.currentTarget.style.display = 'none' }} />
      </div>

      {!reducedMotion ? (
        <div
          className={`cw-doc-threshold-demo__seam${seamVisible ? ' cw-doc-threshold-demo__seam--active' : ''}`}
          aria-hidden
        />
      ) : null}

      <p className="cw-doc-threshold-demo__hint">Press and hold to cross</p>
    </div>
  )
}

export default function LandingThresholdDemo() {
  const { id, headline, subheadline, caption } = LANDING_CONTENT.threshold

  return (
    <section id={id} className="cw-doc-section cw-doc-section--obsidian cw-doc-threshold" aria-labelledby={`${id}-heading`}>
      <div className="cw-landing-wrap cw-doc-section__inner cw-doc-section__inner--theater">
        <div className="cw-doc-threshold__intro">
          <h2 id={`${id}-heading`} className="cw-doc-threshold__headline">
            {headline}
          </h2>
          <p className="cw-doc-threshold__sub">{subheadline}</p>
        </div>

        <div className="cw-doc-threshold-showcase">
          <div className="cw-doc-threshold-box">
            <LandingThresholdInteractive />
          </div>
        </div>

        <p className="cw-doc-caption">{caption}</p>
      </div>
    </section>
  )
}
