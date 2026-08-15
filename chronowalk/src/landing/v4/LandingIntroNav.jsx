import { useEffect, useId, useRef, useState } from 'react'
import ChronoWalkLogo from '../../components/ui/ChronoWalkLogo.jsx'
import { LANDING_CONTENT, LANDING_CTA } from '../landingData.js'
import { useI18n } from '../../i18n/I18nProvider.jsx'
import {
  LandingLanguageControl,
} from '../LandingLanguageSwitcher.jsx'
import LandingExploreSidebar from './LandingExploreSidebar.jsx'

/**
 * Cinematic logo open assets remain in the repo:
 *   /landing/intro-open.mp4
 *   /landing/intro-open-poster.jpg
 * Kept off every surface until we have a better moment to show them.
 * Flip to `true` to restore the previous first-visit intro.
 */
export const LANDING_INTRO_VIDEO_ENABLED = false

/** Soft dissolve starts before the last frame so the cut into the hero isn’t abrupt. */
const EXIT_LEAD_MS = 320
const COMPRESS_MS = 450
const FALLBACK_MAX_MS = 7000
const NAV_OFFSET_PX = 100
const INTRO_PLAYS_KEY = 'cw_landing_intro_plays_v1'
/** Once per browser profile — back/home must not replay the open. */
const INTRO_PLAY_CAP = 1

/**
 * Landing header. When LANDING_INTRO_VIDEO_ENABLED, plays a one-shot muted
 * cinematic then dissolves into the fixed nav. Currently disabled site-wide.
 * After scrolling past the product hero: Get Tour CTA + obsidian nav chrome.
 */
function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)
  )
}

function readIntroPlays() {
  if (typeof window === 'undefined') return INTRO_PLAY_CAP
  try {
    return Math.max(0, Number(window.localStorage.getItem(INTRO_PLAYS_KEY) || 0) || 0)
  } catch {
    return INTRO_PLAY_CAP
  }
}

function bumpIntroPlays() {
  if (typeof window === 'undefined') return
  try {
    // Dedupe within a single page lifetime so Strict Mode remounts don’t double-count.
    if (window.sessionStorage?.getItem(`${INTRO_PLAYS_KEY}:session`) === '1') return
    window.sessionStorage?.setItem(`${INTRO_PLAYS_KEY}:session`, '1')
    const next = Math.min(INTRO_PLAY_CAP, readIntroPlays() + 1)
    window.localStorage.setItem(INTRO_PLAYS_KEY, String(next))
  } catch {
    /* ignore */
  }
}

function shouldPlayIntro() {
  if (!LANDING_INTRO_VIDEO_ENABLED) return false
  if (prefersReducedMotion()) return false
  return readIntroPlays() < INTRO_PLAY_CAP
}

export default function LandingIntroNav({
  onComplete,
  onGetApp,
  header = LANDING_CONTENT.header,
  ctaCopy = LANDING_CTA,
}) {
  const { t } = useI18n()
  const { nav, cta, ctaHref, ctaShort, exploreNav = [] } = header
  const [phase, setPhase] = useState(() => (shouldPlayIntro() ? 'intro' : 'nav'))
  const [pastHero, setPastHero] = useState(false)
  const [videoReady, setVideoReady] = useState(false)
  const [exploreOpen, setExploreOpen] = useState(false)
  const videoRef = useRef(null)
  const exitStarted = useRef(false)
  const bodyOverflowRef = useRef('')
  const completedRef = useRef(false)
  const playIntroOnMount = useRef(phase === 'intro')
  const menuButtonRef = useRef(null)
  const explorePanelId = useId()

  // Nav handoff - keep separate so intro→compress does not tear down timers.
  useEffect(() => {
    if (phase !== 'nav') return undefined
    if (!completedRef.current) {
      completedRef.current = true
      onComplete?.()
    }
    return undefined
  }, [onComplete, phase])

  // One-shot cinematic (dormant while LANDING_INTRO_VIDEO_ENABLED is false).
  useEffect(() => {
    if (!LANDING_INTRO_VIDEO_ENABLED) return undefined
    if (!playIntroOnMount.current) return undefined

    bumpIntroPlays()

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
      if (video) video.playbackRate = 1.35
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
  }, [])

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
  const showIntroOverlay = LANDING_INTRO_VIDEO_ENABLED && (!isNav || isCompress)
  const showGetApp = Boolean(cta) && pastHero
  const ctaLabel = cta || ctaCopy.getApp
  const ctaTarget = ctaHref || '#get-app'
  const logoVariant = pastHero ? 'dark' : 'light'

  const handleCtaClick = (event) => {
    if (!onGetApp) return
    event.preventDefault()
    onGetApp()
  }

  const openExplore = () => setExploreOpen(true)
  const closeExplore = () => setExploreOpen(false)

  return (
    <>
      {showIntroOverlay ? (
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
      ) : null}

      <header
        className={`cw-v4-nav${isNav || isCompress ? ' cw-v4-nav--visible' : ''}${pastHero ? ' cw-v4-nav--scrolled' : ''}${showGetApp ? ' cw-v4-nav--cta' : ''}${exploreOpen ? ' cw-v4-nav--explore-open' : ''}`}
        data-phase={phase}
      >
        <div className="cw-v4-nav__inner">
          {exploreNav.length ? (
            <button
              ref={menuButtonRef}
              type="button"
              className="cw-v4-nav__menu"
              aria-expanded={exploreOpen}
              aria-controls={explorePanelId}
              aria-label={
                exploreOpen ? t('landing.nav.menuCloseAria') : t('landing.nav.menuOpenAria')
              }
              data-testid="landing-explore-toggle"
              onClick={() => (exploreOpen ? closeExplore() : openExplore())}
            >
              <span className="cw-v4-nav__menu-icon" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              <span className="cw-v4-nav__menu-label">{t('landing.nav.menu')}</span>
            </button>
          ) : null}

          <a href="#top" className="cw-v4-nav__brand" aria-label={t('landing.nav.homeAria')}>
            <ChronoWalkLogo size={32} variant={logoVariant} className="cw-v4-nav__emblem" />
            <span className="cw-v4-nav__name">ChronoWalk</span>
          </a>

          <nav className="cw-v4-nav__links" aria-label={t('landing.nav.aria')}>
            {nav.map((item) => (
              <a key={item.href} href={item.href} className="cw-v4-nav__link">
                {item.label}
              </a>
            ))}
          </nav>

          <LandingLanguageControl className="cw-v4-nav__language" />

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

      {exploreNav.length ? (
        <LandingExploreSidebar
          open={exploreOpen}
          onClose={closeExplore}
          items={exploreNav}
          panelId={explorePanelId}
          title={t('landing.nav.exploreTitle')}
          lead={t('landing.nav.exploreLead')}
          closeLabel={t('landing.nav.menuCloseAria')}
          navLabel={t('landing.nav.exploreAria')}
        />
      ) : null}
    </>
  )
}
