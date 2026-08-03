import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'
import LandingColosseumThreshold from '../LandingColosseumThreshold.jsx'
import { LANDING_CONTENT } from '../landingData.js'
import {
  LANDING_COLOSSEUM_INTERIOR_NOW,
  LANDING_COLOSSEUM_INTERIOR_THEN,
} from '../landingVisualAssets.js'
import {
  trackThenNowDemoCompleted,
  trackThenNowDemoStarted,
  trackThenNowDemoViewed,
} from '../landingAnalytics.js'

const REVEAL_MS = 900
const COMPLETE_THRESHOLD = 0.98
/** Delay before a touch/pointer is treated as a deliberate hold (lets vertical scroll win). */
const HOLD_ARM_MS = 140
/** Pointer travel that cancels a pending hold (user is scrolling). */
const MOVE_CANCEL_PX = 12
/** One-time silent peek: partial reveal + return, ~7s total. */
const PEEK_PEAK = 0.62
const PEEK_OUT_MS = 3200
const PEEK_HOLD_MS = 700
const PEEK_IN_MS = 2800

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
 * Top-of-page Then/Now proof — Colosseum interior pair via LandingColosseumThreshold.
 * Silent, user-driven hold (optional one-time peek). Full product demo remains below.
 */
export default function LandingThenNowProof() {
  const section = LANDING_CONTENT.thenNowProof
  const reducedMotion = useReducedMotion()
  const reactId = useId()
  const statusId = `${reactId}-status`
  const headingId = `${section.id}-heading`

  const rootRef = useRef(null)
  const [reveal, setReveal] = useState(0)
  const [fallbackLatched, setFallbackLatched] = useState(false)
  const [inView, setInView] = useState(false)
  const [peeking, setPeeking] = useState(false)

  const holdingRef = useRef(false)
  const peekingRef = useRef(false)
  const peekDoneRef = useRef(false)
  const userTouchedRef = useRef(false)
  const rafRef = useRef(0)
  const peekTimersRef = useRef([])
  const holdArmTimerRef = useRef(0)
  const holdStartRef = useRef(null)
  const completedRef = useRef(false)
  const startedRef = useRef(false)
  const viaRef = useRef('hold')
  const revealRef = useRef(0)
  const pendingPointerRef = useRef(null)

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

  const clearPeekTimers = useCallback(() => {
    for (const id of peekTimersRef.current) window.clearTimeout(id)
    peekTimersRef.current = []
  }, [])

  const stopPeek = useCallback(() => {
    if (!peekingRef.current) return
    peekingRef.current = false
    setPeeking(false)
    clearPeekTimers()
    cancelRevealAnimation()
    if (!holdingRef.current && !fallbackLatched && revealRef.current < COMPLETE_THRESHOLD) {
      setRevealBoth(0)
    }
  }, [cancelRevealAnimation, clearPeekTimers, fallbackLatched, setRevealBoth])

  const markUserInteraction = useCallback(() => {
    userTouchedRef.current = true
    stopPeek()
  }, [stopPeek])

  const trackStart = useCallback((via = 'hold') => {
    if (startedRef.current) return
    startedRef.current = true
    viaRef.current = via
    trackThenNowDemoStarted({ via })
  }, [])

  const trackComplete = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    haptic(12)
    trackThenNowDemoCompleted({
      via: viaRef.current,
      duration_ms: holdStartRef.current
        ? Math.round(performance.now() - holdStartRef.current)
        : REVEAL_MS,
    })
  }, [])

  const animateRevealTo = useCallback(
    ({ to, durationMs, onDone }) => {
      cancelRevealAnimation()
      const start = performance.now()
      const from = revealRef.current
      const delta = to - from

      const tick = (now) => {
        const t = Math.min(1, (now - start) / durationMs)
        setRevealBoth(from + delta * t)
        if (t < 1) {
          rafRef.current = requestAnimationFrame(tick)
        } else {
          rafRef.current = 0
          onDone?.()
        }
      }

      rafRef.current = requestAnimationFrame(tick)
    },
    [cancelRevealAnimation, setRevealBoth],
  )

  const runHoldReveal = useCallback(
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
    (via = 'hold') => {
      if (revealRef.current >= COMPLETE_THRESHOLD && !fallbackLatched) return

      markUserInteraction()
      holdingRef.current = true
      holdStartRef.current = performance.now()
      completedRef.current = false
      trackStart(via)
      haptic(8)

      if (reducedMotion) {
        setRevealBoth(1)
        trackComplete()
        holdingRef.current = false
        return
      }

      runHoldReveal()
    },
    [
      fallbackLatched,
      markUserInteraction,
      reducedMotion,
      runHoldReveal,
      setRevealBoth,
      trackComplete,
      trackStart,
    ],
  )

  const endHold = useCallback(() => {
    pendingPointerRef.current = null
    if (holdArmTimerRef.current) {
      window.clearTimeout(holdArmTimerRef.current)
      holdArmTimerRef.current = 0
    }

    if (!holdingRef.current) return

    const heldMs = holdStartRef.current ? performance.now() - holdStartRef.current : 0
    holdingRef.current = false
    holdStartRef.current = null
    cancelRevealAnimation()

    if (completedRef.current || revealRef.current >= COMPLETE_THRESHOLD) {
      setRevealBoth(1)
      return
    }

    void heldMs
    setRevealBoth(0)
    startedRef.current = false
  }, [cancelRevealAnimation, setRevealBoth])

  const clearPendingHold = useCallback(() => {
    pendingPointerRef.current = null
    if (holdArmTimerRef.current) {
      window.clearTimeout(holdArmTimerRef.current)
      holdArmTimerRef.current = 0
    }
  }, [])

  const onPointerDown = useCallback(
    (event) => {
      if (revealRef.current >= COMPLETE_THRESHOLD) return
      if (event?.pointerType === 'mouse' && event.button != null && event.button !== 0) return

      markUserInteraction()
      clearPendingHold()

      const target = event.currentTarget
      pendingPointerRef.current = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        target,
      }

      // Mouse / pen: arm quickly. Touch: wait so vertical scroll can win.
      const armDelay = event.pointerType === 'touch' ? HOLD_ARM_MS : 0
      holdArmTimerRef.current = window.setTimeout(() => {
        holdArmTimerRef.current = 0
        const pending = pendingPointerRef.current
        if (!pending) return
        try {
          pending.target?.setPointerCapture?.(pending.id)
        } catch {
          /* ignore */
        }
        beginHold('hold')
      }, armDelay)
    },
    [beginHold, clearPendingHold, markUserInteraction],
  )

  const onPointerMove = useCallback(
    (event) => {
      const pending = pendingPointerRef.current
      if (!pending || pending.id !== event.pointerId || holdingRef.current) return

      const dx = Math.abs(event.clientX - pending.x)
      const dy = Math.abs(event.clientY - pending.y)
      if (dx > MOVE_CANCEL_PX || dy > MOVE_CANCEL_PX) {
        clearPendingHold()
      }
    },
    [clearPendingHold],
  )

  const onPointerEnd = useCallback(() => {
    clearPendingHold()
    endHold()
  }, [clearPendingHold, endHold])

  const toggleFallback = useCallback(() => {
    markUserInteraction()
    trackStart('button')

    if (fallbackLatched || revealRef.current >= COMPLETE_THRESHOLD) {
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

    runHoldReveal({ latch: true })
  }, [
    cancelRevealAnimation,
    fallbackLatched,
    markUserInteraction,
    reducedMotion,
    runHoldReveal,
    setRevealBoth,
    trackComplete,
    trackStart,
  ])

  const onKeyDown = useCallback(
    (event) => {
      if (event.key !== ' ' && event.key !== 'Enter') return
      event.preventDefault()
      if (event.repeat) return
      markUserInteraction()
      beginHold('keyboard')
    },
    [beginHold, markUserInteraction],
  )

  const onKeyUp = useCallback(
    (event) => {
      if (event.key !== ' ' && event.key !== 'Enter') return
      event.preventDefault()
      endHold()
    },
    [endHold],
  )

  // Viewport: analytics + optional silent peek
  useEffect(() => {
    const node = rootRef.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      setInView(true)
      trackThenNowDemoViewed()
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        setInView(true)
        trackThenNowDemoViewed()
        observer.disconnect()
      },
      { threshold: 0.35 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!inView || reducedMotion || peekDoneRef.current || userTouchedRef.current) return undefined

    peekDoneRef.current = true
    peekingRef.current = true
    setPeeking(true)

    const startPeek = window.setTimeout(() => {
      if (userTouchedRef.current || !peekingRef.current) return
      animateRevealTo({
        to: PEEK_PEAK,
        durationMs: PEEK_OUT_MS,
        onDone: () => {
          if (!peekingRef.current || userTouchedRef.current) return
          const holdId = window.setTimeout(() => {
            if (!peekingRef.current || userTouchedRef.current) return
            animateRevealTo({
              to: 0,
              durationMs: PEEK_IN_MS,
              onDone: () => {
                peekingRef.current = false
                setPeeking(false)
              },
            })
          }, PEEK_HOLD_MS)
          peekTimersRef.current.push(holdId)
        },
      })
    }, 450)
    peekTimersRef.current.push(startPeek)

    return () => {
      clearPeekTimers()
      cancelRevealAnimation()
      peekingRef.current = false
      setPeeking(false)
    }
  }, [animateRevealTo, cancelRevealAnimation, clearPeekTimers, inView, reducedMotion])

  useEffect(
    () => () => {
      clearPendingHold()
      clearPeekTimers()
      cancelRevealAnimation()
    },
    [cancelRevealAnimation, clearPendingHold, clearPeekTimers],
  )

  const revealed = reveal >= COMPLETE_THRESHOLD
  const statusText = peeking
    ? `${section.holdHint}. ${section.revealLabel} is also available as a button.`
    : revealed
      ? 'Ancient Rome revealed'
      : reveal > 0.02
        ? `Revealing Ancient Rome · ${Math.round(reveal * 100)}%`
        : `${section.holdHint}. ${section.revealLabel} is also available as a button.`

  const showHoldHint = reveal < 0.12 && !peeking

  return (
    <section
      ref={rootRef}
      id={section.id}
      className="cw-v4-then-now"
      aria-labelledby={headingId}
    >
      <div className="cw-v4-wrap cw-v4-then-now__layout">
        <header className="cw-v4-then-now__intro">
          <p className="cw-v4-eyebrow">{section.eyebrow}</p>
          <h2 id={headingId} className="cw-v4-then-now__headline">
            {section.headline}
          </h2>
          <p className="cw-v4-then-now__support">{section.support}</p>
        </header>

        <div className="cw-v4-then-now__stage-wrap">
          <div
            className="cw-v4-then-now__stage-frame"
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
              showProgress={false}
              loading="eager"
              fetchPriority="low"
              hint=""
              labelledBy={headingId}
              nowSrc={LANDING_COLOSSEUM_INTERIOR_NOW}
              thenSrc={LANDING_COLOSSEUM_INTERIOR_THEN}
              width={720}
              height={1280}
              ariaLabel="Colosseum interior today compared with an evidence-based ancient reconstruction"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerEnd}
              onPointerCancel={onPointerEnd}
              onPointerLeave={() => {
                if (holdingRef.current || pendingPointerRef.current) onPointerEnd()
              }}
            />
            {showHoldHint ? (
              <p className="cw-v4-then-now__hold-hint" aria-hidden="true">
                <span className="cw-v4-then-now__hold-hint--pointer">{section.holdHint}</span>
                <span className="cw-v4-then-now__hold-hint--touch">{section.holdHintTouch}</span>
              </p>
            ) : null}
          </div>

          <p id={statusId} className="cw-v4-then-now__status" aria-live="polite">
            {statusText}
          </p>

          <div className="cw-v4-then-now__controls">
            <button
              type="button"
              className="cw-v4-then-now__fallback"
              onClick={toggleFallback}
              aria-pressed={revealed || fallbackLatched}
            >
              {revealed || fallbackLatched ? section.hideLabel : section.revealLabel}
            </button>
          </div>

          <p className="cw-v4-then-now__note">{section.exampleNote}</p>
        </div>
      </div>
    </section>
  )
}
