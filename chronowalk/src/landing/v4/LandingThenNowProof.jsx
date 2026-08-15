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
import { useT } from '../../i18n/I18nProvider.jsx'

/**
 * Then/Now proof — product Threshold inside the landing phone frame.
 * Silent, user-driven hold (optional one-time peek via Threshold autoPeek).
 *
 * `variant="hero-slide"` embeds a compact layout inside the hero gallery.
 * `active` gates peek/media when used as a hero slide layer.
 */
export default function LandingThenNowProof({
  section = LANDING_CONTENT.thenNowProof,
  variant = 'section',
  active = true,
}) {
  const t = useT()
  const reducedMotion = useReducedMotion()
  const reactId = useId()
  const statusId = `${reactId}-status`
  const headingId = `${section.id}-heading`
  const isHero = variant === 'hero-slide'

  const rootRef = useRef(null)
  const phoneRef = useRef(null)
  const startedRef = useRef(false)
  const completedRef = useRef(false)
  const viaRef = useRef('hold')
  const viewedRef = useRef(false)

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
    if (isHero) {
      if (!active) {
        setInView(false)
        setAutoPeek(false)
        return undefined
      }
      setInView(true)
      if (!viewedRef.current) {
        viewedRef.current = true
        trackThenNowDemoViewed()
      }
      return undefined
    }

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
  }, [active, isHero])

  useEffect(() => {
    if (!inView || !active || reducedMotion || autoPeek) return undefined
    const id = window.setTimeout(() => setAutoPeek(true), 500)
    return () => window.clearTimeout(id)
  }, [active, autoPeek, inView, reducedMotion])

  const statusText = revealed
    ? t('landing.thenNow.revealedStatus')
    : holding
      ? t('landing.thenNow.revealingStatus')
      : t('landing.thenNow.availableStatus', {
          hint: section.holdHint,
          action: section.revealLabel,
        })

  const rootClass = `cw-v4-then-now${isHero ? ' cw-v4-then-now--hero' : ''}`
  const Root = isHero ? 'div' : 'section'

  return (
    <Root
      ref={rootRef}
      id={isHero ? undefined : section.id}
      className={rootClass}
      aria-labelledby={headingId}
      data-testid={isHero ? 'hero-then-now-slide' : 'then-now-proof'}
    >
      <div className="cw-v4-wrap cw-v4-then-now__layout">
        <header className="cw-v4-then-now__intro">
          <p className="cw-v4-eyebrow">{section.eyebrow}</p>
          <h2 id={headingId} className="cw-v4-then-now__headline">
            {section.headline}
          </h2>
          <p className="cw-v4-then-now__support">{section.support}</p>
        </header>

        <div
          className="cw-v4-then-now__stage-wrap"
          /* Keep hero swipe from stealing press-and-hold on the phone. */
          onTouchStart={(event) => event.stopPropagation()}
          onTouchEnd={(event) => event.stopPropagation()}
          onTouchMove={(event) => event.stopPropagation()}
        >
          <div ref={phoneRef} className="cw-v4-then-now__phone">
            <LandingProductPhoneFrame label={t('landing.thenNow.phoneLabel')}>
              <LandingThenNowAppScreen
                active={Boolean(active && inView)}
                autoPeek={autoPeek && !reducedMotion && active}
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
              tabIndex={active ? 0 : -1}
            >
              {revealed ? section.hideLabel : section.revealLabel}
            </button>
          </div>

          {!isHero ? <p className="cw-v4-then-now__note">{section.exampleNote}</p> : null}
        </div>
      </div>
    </Root>
  )
}
