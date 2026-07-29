import { useEffect, useRef, useState } from 'react'
import ChronoWalkLogo from '../../components/ui/ChronoWalkLogo.jsx'
import { LANDING_CONTENT, LANDING_CTA } from '../landingData.js'

/** Soft dissolve starts before the last frame so the cut into the hero isn’t abrupt. */
const EXIT_LEAD_MS = 680
const COMPRESS_MS = 900
const FALLBACK_MAX_MS = 12000
const NAV_OFFSET_PX = 68

/**
 * Keynote-style open: muted cinematic plays once on a full-bleed black stage,
 * then dissolves into the fixed nav (same handoff as the old mark intro).
 * After scrolling past the product hero: Get App CTA + obsidian nav chrome.
 */
function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)
  )
}

export default function LandingIntroNav({ onComplete, onGetApp }) {
  const { nav, cta, ctaHref, ctaShort } = LANDING_CONTENT.header
  const reduceMotion = prefersReducedMotion()
  const [phase, setPhase] = useState(() => (prefersReducedMotion() ? 'nav' : 'intro'))
  const [pastHero, setPastHero] = useState(false)
  const [videoReady, setVideoReady] = useState(false)
  const videoRef = useRef(null)
  const exitStarted = useRef(false)
  const bodyOverflowRef = useRef('')
  const completedRef = useRef(false)

  useEffect(() => {
    if (reduceMotion) {
      if (!completedRef.current) {
        completedRef.current = true
        onComplete?.()
      }
      return undefined
    }

    bodyOverflowRef.current = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const video = videoRef.current
    let exitTimer = 0
    let navTimer = 0
    let fallbackTimer = 0
    let leadArmed = false

    const finishToNav = () => {
      setPhase('nav')
      document.body.style.overflow = bodyOverflowRef.current
      if (!completedRef.current) {
        completedRef.current = true
        onComplete?.()
      }
    }

    const beginCompress = () => {
      if (exitStarted.current) return
      exitStarted.current = true
      setPhase('compress')
      window.clearTimeout(exitTimer)
      navTimer = window.setTimeout(finishToNav, COMPRESS_MS)
    }

    const armExitLead = () => {
      if (leadArmed || !video || !Number.isFinite(video.duration) || video.duration <= 0) return
      leadArmed = true
      const remainingMs = Math.max(
        0,
        (video.duration - video.currentTime) * 1000 - EXIT_LEAD_MS,
      )
      exitTimer = window.setTimeout(beginCompress, remainingMs)
    }

    const onLoadedMeta = () => armExitLead()
    const onCanPlay = () => {
      setVideoReady(true)
      const play = video?.play()
      if (play && typeof play.catch === 'function') {
        play.catch(() => beginCompress())
      }
    }
    const onEnded = () => beginCompress()
    const onError = () => beginCompress()

    if (video) {
      video.addEventListener('loadedmetadata', onLoadedMeta)
      video.addEventListener('canplay', onCanPlay)
      video.addEventListener('ended', onEnded)
      video.addEventListener('error', onError)
      if (video.readyState >= 1) onLoadedMeta()
      if (video.readyState >= 3) onCanPlay()
      else video.load()
    } else {
      beginCompress()
    }

    fallbackTimer = window.setTimeout(beginCompress, FALLBACK_MAX_MS)

    return () => {
      window.clearTimeout(exitTimer)
      window.clearTimeout(navTimer)
      window.clearTimeout(fallbackTimer)
      if (video) {
        video.removeEventListener('loadedmetadata', onLoadedMeta)
        video.removeEventListener('canplay', onCanPlay)
        video.removeEventListener('ended', onEnded)
        video.removeEventListener('error', onError)
      }
      document.body.style.overflow = bodyOverflowRef.current
    }
  }, [onComplete, reduceMotion])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const hero = document.getElementById('top')
    if (!hero) return undefined

    const updatePastHero = () => {
      const rect = hero.getBoundingClientRect()
      setPastHero(rect.bottom <= NAV_OFFSET_PX)
    }

    if (typeof IntersectionObserver === 'undefined') {
      updatePastHero()
      window.addEventListener('scroll', updatePastHero, { passive: true })
      window.addEventListener('resize', updatePastHero)
      return () => {
        window.removeEventListener('scroll', updatePastHero)
        window.removeEventListener('resize', updatePastHero)
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const heroVisible = entry.isIntersecting && entry.intersectionRatio >= 0.12
        setPastHero(!heroVisible)
      },
      {
        root: null,
        rootMargin: `-${NAV_OFFSET_PX}px 0px 0px 0px`,
        threshold: [0, 0.12, 0.25, 0.5, 1],
      },
    )
    observer.observe(hero)
    updatePastHero()
    return () => observer.disconnect()
  }, [])

  const isNav = phase === 'nav'
  const isCompress = phase === 'compress'
  const showGetApp = Boolean(cta) && pastHero
  const ctaLabel = cta || LANDING_CTA.getApp
  const ctaTarget = ctaHref || '#get-app'
  const logoVariant = pastHero ? 'dark' : 'light'

  const handleCtaClick = (event) => {
    if (!onGetApp) return
    event.preventDefault()
    onGetApp()
  }

  return (
    <>
      <div
        className={[
          'cw-v4-intro',
          videoReady ? 'cw-v4-intro--ready' : '',
          isCompress ? 'cw-v4-intro--compress' : '',
          isNav ? 'cw-v4-intro--done' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-hidden={isNav}
      >
        <div className="cw-v4-intro__stage">
          <video
            ref={videoRef}
            className="cw-v4-intro__video"
            src="/landing/intro-open.mp4"
            poster="/landing/intro-open-poster.jpg"
            muted
            playsInline
            preload="auto"
            autoPlay
            tabIndex={-1}
            aria-hidden="true"
          />
        </div>
      </div>

      <header
        className={`cw-v4-nav${isNav || isCompress ? ' cw-v4-nav--visible' : ''}${pastHero ? ' cw-v4-nav--scrolled' : ''}${showGetApp ? ' cw-v4-nav--cta' : ''}`}
        data-phase={phase}
      >
        <div className="cw-v4-nav__inner">
          <a href="#top" className="cw-v4-nav__brand" aria-label="ChronoWalk home">
            <ChronoWalkLogo size={32} variant={logoVariant} className="cw-v4-nav__emblem" />
            <span className="cw-v4-nav__name">ChronoWalk</span>
          </a>

          <nav className="cw-v4-nav__links" aria-label="Primary">
            {nav.map((item) => (
              <a key={item.href} href={item.href} className="cw-v4-nav__link">
                {item.label}
              </a>
            ))}
          </nav>

          {cta ? (
            <a
              href={ctaTarget}
              className="cw-v4-nav__cta"
              aria-hidden={!showGetApp}
              tabIndex={showGetApp ? 0 : -1}
              onClick={handleCtaClick}
            >
              <span className="cw-v4-nav__cta-long">{ctaLabel}</span>
              <span className="cw-v4-nav__cta-short">{ctaShort || ctaLabel}</span>
            </a>
          ) : null}
        </div>
      </header>
    </>
  )
}
