import { useCallback, useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'
import {
  trackLandingThresholdCancelled,
  trackLandingThresholdComplete,
  trackLandingThresholdStart,
} from '../landingAnalytics.js'

const REVEAL_MS = 900

function haptic(pattern) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern)
    }
  } catch {
    /* unsupported */
  }
}

/**
 * Shared Threshold hold/tap reveal state for hero + product-proof.
 * @param {{ track?: boolean }} [options]
 */
export function useThresholdReveal({ track = true } = {}) {
  const reducedMotion = useReducedMotion()
  const [reveal, setReveal] = useState(0)
  const [fallbackLatched, setFallbackLatched] = useState(false)
  const holdingRef = useRef(false)
  const rafRef = useRef(0)
  const holdStartRef = useRef(null)
  const completedRef = useRef(false)
  const startedRef = useRef(false)
  const viaRef = useRef('hold')
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

  const trackStart = useCallback(
    (via = 'hold') => {
      if (!track || startedRef.current) return
      startedRef.current = true
      viaRef.current = via
      trackLandingThresholdStart({ via })
    },
    [track],
  )

  const trackComplete = useCallback(() => {
    if (!track || completedRef.current) return
    completedRef.current = true
    haptic(12)
    trackLandingThresholdComplete({
      via: viaRef.current,
      duration_ms: holdStartRef.current
        ? Math.round(performance.now() - holdStartRef.current)
        : REVEAL_MS,
    })
  }, [track])

  const trackCancel = useCallback(
    (heldMs) => {
      if (!track) return
      trackLandingThresholdCancelled({ duration_ms: heldMs, via: viaRef.current })
    },
    [track],
  )

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
      if (revealRef.current >= 0.98) return
      if (event?.pointerType === 'mouse' && event.button != null && event.button !== 0) return

      event?.currentTarget?.setPointerCapture?.(event.pointerId)
      holdingRef.current = true
      holdStartRef.current = performance.now()
      completedRef.current = false
      trackStart('hold')
      haptic(8)

      if (reducedMotion) {
        setRevealBoth(1)
        trackComplete()
        holdingRef.current = false
        return
      }

      runRevealAnimation()
    },
    [reducedMotion, runRevealAnimation, setRevealBoth, trackComplete, trackStart],
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
    trackStart('button')

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

  const revealed = reveal >= 0.98
  const statusText = revealed
    ? 'Past view revealed'
    : reveal > 0.02
      ? `Revealing the past — ${Math.round(reveal * 100)}%`
      : 'Present view — press and hold to reveal the past'

  return {
    reveal,
    revealed,
    fallbackLatched,
    statusText,
    beginHold,
    endHold,
    toggleFallback,
    onKeyDown,
    onKeyUp,
  }
}
