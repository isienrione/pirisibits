import { useCallback, useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion.js'
import { track, TRACK_EVENTS } from '../lib/track.js'
import LandingColosseumThreshold from './LandingColosseumThreshold.jsx'
import { LANDING_CONTENT } from './landingData.js'

const REVEAL_MS = 780

export default function LandingThresholdDemo() {
  const { id, headline, subheadline, caption } = LANDING_CONTENT.threshold
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
            <LandingColosseumThreshold
              reveal={reveal}
              interactive
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onPointerLeave={() => {
                if (holdingRef.current) handlePointerUp()
              }}
            />
          </div>
        </div>

        <p className="cw-doc-caption">{caption}</p>
      </div>
    </section>
  )
}
