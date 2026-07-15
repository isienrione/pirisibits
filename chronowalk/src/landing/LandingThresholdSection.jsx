import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion.js'
import { track, TRACK_EVENTS } from '../lib/track.js'
import LandingColosseumThreshold from './LandingColosseumThreshold.jsx'
import { LANDING_CONTENT } from './landingData.js'

const REVEAL_MS = 900

function haptic(pattern) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern)
    }
  } catch {
    /* unsupported / blocked */
  }
}

/**
 * Act I signature Threshold — press-and-hold reveals evidence-based reconstruction.
 */
export default function LandingThresholdSection() {
  const section = LANDING_CONTENT.threshold
  const reducedMotion = useReducedMotion()
  const reactId = useId()
  const statusId = `${reactId}-status`
  const [reveal, setReveal] = useState(0)
  const [fallbackLatched, setFallbackLatched] = useState(false)
  const holdingRef = useRef(false)
  const rafRef = useRef(0)
  const holdStartRef = useRef(null)
  const completedRef = useRef(false)
  const startedRef = useRef(false)
  const revealRef = useRef(0)

  const setRevealBoth = useCallback((value) => {
    revealRef.current = value
    setReveal(value)
  }, [])

  const cancelRevealAnimation = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }
  }, [])

  const trackStart = useCallback(() => {
    if (startedRef.current) return
    startedRef.current = true
    track(TRACK_EVENTS.THRESHOLD_DEMO, {
      source: 'landing',
      action: 'start',
      waypoint_id: 'landing-colosseum',
    })
  }, [])

  const trackComplete = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    haptic(12)
    track(TRACK_EVENTS.THRESHOLD_DEMO, {
      source: 'landing',
      action: 'complete',
      waypoint_id: 'landing-colosseum',
    })
    track(TRACK_EVENTS.THRESHOLD_HOLD, {
      source: 'landing',
      action: 'complete',
      waypoint_id: 'landing-colosseum',
      duration_ms: holdStartRef.current
        ? Math.round(performance.now() - holdStartRef.current)
        : REVEAL_MS,
    })
  }, [])

  const trackCancel = useCallback((heldMs) => {
    track(TRACK_EVENTS.THRESHOLD_HOLD, {
      source: 'landing',
      action: 'cancelled',
      waypoint_id: 'landing-colosseum',
      duration_ms: Math.round(heldMs),
    })
  }, [])

  const runRevealAnimation = useCallback(
    ({ latch = false } = {}) => {
      cancelRevealAnimation()
      const start = performance.now()
      const from = revealRef.current

      const tick = (now) => {
        if (!holdingRef.current && !latch) return
        const t = Math.min(1, from + (now - start) / REVEAL_MS)
        setRevealBoth(t)
        if (t < 1) {
          rafRef.current = requestAnimationFrame(tick)
        } else {
          holdingRef.current = false
          trackComplete()
        }
      }

      rafRef.current = requestAnimationFrame(tick)
    },
    [cancelRevealAnimation, setRevealBoth, trackComplete],
  )

  const beginHold = useCallback(
    (event) => {
      if (fallbackLatched && revealRef.current >= 0.98) return
      if (event?.pointerType === 'mouse' && event.button != null && event.button !== 0) return

      event?.currentTarget?.setPointerCapture?.(event.pointerId)
      holdingRef.current = true
      holdStartRef.current = performance.now()
      completedRef.current = false
      trackStart()
      haptic(8)

      if (reducedMotion) {
        setRevealBoth(1)
        trackComplete()
        holdingRef.current = false
        return
      }

      runRevealAnimation()
    },
    [fallbackLatched, reducedMotion, runRevealAnimation, setRevealBoth, trackComplete, trackStart],
  )

  const endHold = useCallback(() => {
    if (!holdingRef.current) return

    const heldMs = holdStartRef.current ? performance.now() - holdStartRef.current : 0
    holdingRef.current = false
    holdStartRef.current = null
    cancelRevealAnimation()

    if (completedRef.current || revealRef.current >= 0.98) {
      setRevealBoth(1)
      return
    }

    trackCancel(heldMs)
    setRevealBoth(0)
    startedRef.current = false
  }, [cancelRevealAnimation, setRevealBoth, trackCancel])

  const toggleFallback = useCallback(() => {
    trackStart()

    if (fallbackLatched || revealRef.current >= 0.98) {
      setFallbackLatched(false)
      holdingRef.current = false
      cancelRevealAnimation()
      setRevealBoth(0)
      completedRef.current = false
      startedRef.current = false
      return
    }

    setFallbackLatched(true)
    holdingRef.current = true
    holdStartRef.current = performance.now()
    completedRef.current = false
    haptic(8)

    if (reducedMotion) {
      setRevealBoth(1)
      trackComplete()
      holdingRef.current = false
      return
    }

    runRevealAnimation({ latch: true })
  }, [
    cancelRevealAnimation,
    fallbackLatched,
    reducedMotion,
    runRevealAnimation,
    setRevealBoth,
    trackComplete,
    trackStart,
  ])

  const onKeyDown = useCallback(
    (event) => {
      if (event.key !== ' ' && event.key !== 'Enter') return
      event.preventDefault()
      if (event.repeat) return
      beginHold()
    },
    [beginHold],
  )

  const onKeyUp = useCallback(
    (event) => {
      if (event.key !== ' ' && event.key !== 'Enter') return
      event.preventDefault()
      endHold()
    },
    [endHold],
  )

  useEffect(() => () => cancelRevealAnimation(), [cancelRevealAnimation])

  const headlineLines = section.headlineLines ?? [section.headline]
  const revealed = reveal >= 0.98
  const statusText = revealed
    ? 'Past view revealed'
    : reveal > 0.02
      ? `Revealing the past — ${Math.round(reveal * 100)}%`
      : 'Present view — press and hold to reveal the past'

  return (
    <section
      id={section.id}
      className="cw-v2-section cw-sig-threshold"
      aria-labelledby={`${section.id}-heading`}
    >
      <div className="cw-v2-wrap cw-sig-threshold__layout">
        <header className="cw-sig-threshold__intro">
          <p className="cw-v2-eyebrow">{section.eyebrow}</p>
          <h2 id={`${section.id}-heading`} className="cw-sig-threshold__headline">
            {headlineLines.map((line) => (
              <span key={line} className="cw-sig-threshold__headline-line">
                {line}
              </span>
            ))}
          </h2>
          <p className="cw-sig-threshold__body">{section.body}</p>
          <p className="cw-sig-threshold__support">{section.support}</p>
        </header>

        <div className="cw-sig-threshold__stage-wrap">
          <div
            className="cw-sig-threshold__stage-frame"
            tabIndex={0}
            role="application"
            aria-label={`${section.holdHint}. ${section.revealLabel} is also available as a button.`}
            onKeyDown={onKeyDown}
            onKeyUp={onKeyUp}
            onBlur={endHold}
            aria-describedby={statusId}
          >
            <LandingColosseumThreshold
              reveal={reveal}
              interactive
              showProgress
              hint={section.holdHint}
              onPointerDown={beginHold}
              onPointerUp={endHold}
              onPointerCancel={endHold}
              onPointerLeave={() => {
                if (holdingRef.current) endHold()
              }}
            />
          </div>

          <p id={statusId} className="cw-sig-threshold__status" aria-live="polite">
            {statusText}
          </p>

          <div className="cw-sig-threshold__controls">
            <button
              type="button"
              className="cw-v2-btn cw-v2-btn--outline cw-sig-threshold__fallback"
              onClick={toggleFallback}
              aria-pressed={revealed || fallbackLatched}
            >
              {revealed || fallbackLatched ? section.hideLabel : section.revealLabel}
            </button>
          </div>
        </div>

        <p className="cw-sig-threshold__disclaimer">{section.disclaimer}</p>
      </div>
    </section>
  )
}
