import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'
import { LANDING_CONTENT } from '../landingData.js'
import {
  trackThenNowDemoCompleted,
  trackThenNowDemoStarted,
  trackThenNowDemoViewed,
} from '../landingAnalytics.js'
import LandingProductPhoneFrame from './LandingProductPhoneFrame.jsx'
import LandingThenNowAppScreen from './LandingThenNowAppScreen.jsx'

/**
 * Top-of-page Then/Now proof — product Threshold inside the landing phone frame.
 * Silent, user-driven hold (optional one-time peek via Threshold autoPeek).
 * Full scrollable product demo remains below.
 */
export default function LandingThenNowProof() {
  const section = LANDING_CONTENT.thenNowProof
  const reducedMotion = useReducedMotion()
  const reactId = useId()
  const statusId = `${reactId}-status`
  const headingId = `${section.id}-heading`

  const rootRef = useRef(null)
  const phoneRef = useRef(null)
  const startedRef = useRef(false)
  const completedRef = useRef(false)
  const viaRef = useRef('hold')

  const [inView, setInView] = useState(false)
  const [autoPeek, setAutoPeek] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [holding, setHolding] = useState(false)

  const trackStart = useCallback((via = 'hold') => {
    if (startedRef.current) return
    startedRef.current = true
    viaRef.current = via
    trackThenNowDemoStarted({ via })
  }, [])

  const trackComplete = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    trackThenNowDemoCompleted({ via: viaRef.current })
  }, [])

  const handleHoldStart = useCallback(() => {
    setHolding(true)
    trackStart('hold')
  }, [trackStart])

  const handleHoldEnd = useCallback((detail) => {
    setHolding(false)
    setRevealed(Boolean(detail?.latched))
    if (!detail?.latched) {
      startedRef.current = false
      completedRef.current = false
    }
  }, [])

  const handleFullyRevealed = useCallback(() => {
    setRevealed(true)
    trackComplete()
  }, [trackComplete])

  const clickEraPill = useCallback((which) => {
    const root = phoneRef.current
    if (!root) return false
    const testId = which === 'then' ? 'threshold-era-then' : 'threshold-era-today'
    const pill = root.querySelector(`[data-testid="${testId}"]`)
    if (!pill) return false
    pill.click()
    return true
  }, [])

  const toggleFallback = useCallback(() => {
    if (revealed) {
      if (clickEraPill('today')) {
        setRevealed(false)
        startedRef.current = false
        completedRef.current = false
      }
      return
    }

    trackStart('button')
    viaRef.current = 'button'
    if (clickEraPill('then')) {
      setRevealed(true)
      trackComplete()
    }
  }, [clickEraPill, revealed, trackComplete, trackStart])

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
    if (!inView || reducedMotion || autoPeek) return undefined
    const id = window.setTimeout(() => setAutoPeek(true), 500)
    return () => window.clearTimeout(id)
  }, [autoPeek, inView, reducedMotion])

  const statusText = revealed
    ? 'Ancient Rome revealed inside ChronoWalk'
    : holding
      ? 'Revealing Ancient Rome'
      : `${section.holdHint}. ${section.revealLabel} is also available as a button.`

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
          <div ref={phoneRef} className="cw-v4-then-now__phone">
            <LandingProductPhoneFrame label="ChronoWalk Then/Now inside the app">
              <LandingThenNowAppScreen
                active={inView}
                autoPeek={autoPeek && !reducedMotion}
                onHoldStart={handleHoldStart}
                onHoldEnd={handleHoldEnd}
                onFullyRevealed={handleFullyRevealed}
              />
            </LandingProductPhoneFrame>
          </div>

          <p id={statusId} className="cw-v4-then-now__status" aria-live="polite">
            {statusText}
          </p>

          <div className="cw-v4-then-now__controls">
            <button
              type="button"
              className="cw-v4-then-now__fallback"
              onClick={toggleFallback}
              aria-pressed={revealed}
            >
              {revealed ? section.hideLabel : section.revealLabel}
            </button>
          </div>

          <p className="cw-v4-then-now__note">{section.exampleNote}</p>
        </div>
      </div>
    </section>
  )
}
