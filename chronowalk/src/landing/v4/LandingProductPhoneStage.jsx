import { memo, useCallback, useEffect, useRef, useState } from 'react'
import LandingProductPhoneFrame from './LandingProductPhoneFrame.jsx'
import { RedesignNavCtx } from '../../redesign/nav.js'
import { ThresholdChromeProvider } from '../../context/ThresholdChromeContext.jsx'
import { useI18n } from '../../i18n/I18nProvider.jsx'
import { LOCALES, normalizeLocale } from '../../i18n/locales.js'

const NOOP_NAV = { navigate: () => {}, navigateToRoute: () => {} }

/* v7: cream/dark island inset (matches screen) — never a fake black status bar. */
const BEGIN_LOCKUP = '/landing/phone-screens/begin-tour-v7.jpeg'
const ARRIVE_LOCKUP = '/landing/phone-screens/arrive-lockup.jpeg'
const LISTEN_VIDEO = '/landing/phone-mockups/listen-campo-fiori.mp4'
const LISTEN_POSTER = '/landing/phone-mockups/listen-campo-fiori-poster.jpg'
const LISTEN_VIDEO_ES = '/landing/phone-mockups/listen-campo-fiori-es.mp4'
const LISTEN_POSTER_ES = '/landing/phone-mockups/listen-campo-fiori-es-poster.jpg'
const WALK_LOCKUP = '/landing/phone-screens/walk-v7.jpeg'

/** Spanish stills under phone-screens/es/; listen uses Spanish_mock3 processed clip. */
const LOCKUP_ES_BY_PATH = Object.freeze({
  [BEGIN_LOCKUP]: '/landing/phone-screens/es/begin-tour-v7.jpeg',
  [ARRIVE_LOCKUP]: '/landing/phone-screens/es/arrive-v7.jpeg',
  [WALK_LOCKUP]: '/landing/phone-screens/es/walk-v7.jpeg',
  [LISTEN_VIDEO]: LISTEN_VIDEO_ES,
  [LISTEN_POSTER]: LISTEN_POSTER_ES,
})

function resolveLockupSrc(enSrc, locale) {
  if (normalizeLocale(locale) !== LOCALES.ES) return enSrc
  return LOCKUP_ES_BY_PATH[enSrc] ?? enSrc
}

/** Full-bleed photo lockup sized to the phone artboard. */
const LockupImage = memo(function LockupImage({ src, alt, testId, className = '' }) {
  return (
    <div className={`cw-v4-lockup${className ? ` ${className}` : ''}`} data-testid={testId}>
      <img className="cw-v4-lockup__media" src={src} alt={alt} decoding="async" draggable={false} />
    </div>
  )
})

/**
 * Screen recording with audio. Plays only when scrolled into view (and the
 * chapter is active) or when the visitor clicks — never muted autoplay.
 */
const LockupVideo = memo(function LockupVideo({
  src,
  poster,
  alt,
  testId,
  active = true,
  className = '',
}) {
  const { t } = useI18n()
  const rootRef = useRef(null)
  const videoRef = useRef(null)
  const [inView, setInView] = useState(false)
  const [playing, setPlaying] = useState(false)
  const userPausedRef = useRef(false)

  const tryPlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = false
    const result = video.play()
    if (result && typeof result.then === 'function') {
      result
        .then(() => {
          setPlaying(true)
        })
        .catch(() => {
          setPlaying(false)
        })
    } else {
      setPlaying(!video.paused)
    }
  }, [])

  const pausePlayback = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.pause()
    setPlaying(false)
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root || typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return undefined
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(Boolean(entry?.isIntersecting && entry.intersectionRatio >= 0.4))
      },
      { threshold: [0, 0.4, 0.75, 1] },
    )
    observer.observe(root)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return undefined

    userPausedRef.current = false
    setPlaying(false)
    video.load()
  }, [src])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return undefined

    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)

    const allowAuto = active && inView && !userPausedRef.current
    if (allowAuto) {
      tryPlay()
    } else if (!active || !inView) {
      pausePlayback()
    }

    return () => {
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
    }
  }, [active, inView, pausePlayback, src, tryPlay])

  const onToggle = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (!video.paused) {
      userPausedRef.current = true
      pausePlayback()
      return
    }
    userPausedRef.current = false
    tryPlay()
  }, [pausePlayback, tryPlay])

  const playingClass = playing ? ' is-playing' : ''
  const rootClass = `cw-v4-lockup cw-v4-lockup--video${playingClass}${className ? ` ${className}` : ''}`

  return (
    <div ref={rootRef} className={rootClass} data-testid={testId}>
      <video
        ref={videoRef}
        className="cw-v4-lockup__media"
        src={src}
        poster={poster}
        playsInline
        loop
        preload="metadata"
        aria-label={alt}
      />
      <button
        type="button"
        className="cw-v4-lockup__play"
        data-testid={`${testId}-toggle`}
        aria-label={playing ? t('landing.demo.videoPause') : t('landing.demo.videoPlay')}
        onClick={onToggle}
      >
        <span className="cw-v4-lockup__play-stack">
          <span className="cw-v4-lockup__play-icon" aria-hidden="true">
            {playing ? (
              <span className="cw-v4-lockup__play-glyph cw-v4-lockup__play-glyph--pause" />
            ) : (
              <span className="cw-v4-lockup__play-glyph cw-v4-lockup__play-glyph--play" />
            )}
          </span>
          {!playing ? (
            <span className="cw-v4-lockup__play-hint">{t('landing.demo.videoTap')}</span>
          ) : null}
        </span>
      </button>
    </div>
  )
})

const BeginScreen = memo(function BeginScreen() {
  const { t, locale } = useI18n()
  return (
    <LockupImage
      src={resolveLockupSrc(BEGIN_LOCKUP, locale)}
      alt={t('landing.demo.beginAlt')}
      testId="landing-demo-begin-lockup"
    />
  )
})

const ArriveScreen = memo(function ArriveScreen() {
  const { t, locale } = useI18n()
  const src = resolveLockupSrc(ARRIVE_LOCKUP, locale)
  const dark = src === ARRIVE_LOCKUP
  return (
    <LockupImage
      src={src}
      alt={t('landing.demo.arriveAlt')}
      testId="landing-demo-arrive-lockup"
      className={dark ? 'cw-v4-lockup--dark' : ''}
    />
  )
})

const ListenScreen = memo(function ListenScreen({ active = false }) {
  const { t, locale } = useI18n()
  return (
    <LockupVideo
      src={resolveLockupSrc(LISTEN_VIDEO, locale)}
      poster={resolveLockupSrc(LISTEN_POSTER, locale)}
      alt={t('landing.demo.listenAlt')}
      testId="landing-demo-listen-campo"
      active={active}
    />
  )
})

const WalkScreen = memo(function WalkScreen() {
  const { t, locale } = useI18n()
  return (
    <LockupImage
      src={resolveLockupSrc(WALK_LOCKUP, locale)}
      alt={t('landing.demo.walkAlt')}
      testId="landing-demo-walk-lockup"
      className="cw-v4-lockup--dark"
    />
  )
})

const ChapterScreen = memo(function ChapterScreen({ chapterId, active }) {
  if (chapterId === 'begin' || chapterId === 'choose') return <BeginScreen />
  if (chapterId === 'arrive') return <ArriveScreen />
  if (chapterId === 'listen') return <ListenScreen active={active} />
  if (chapterId === 'walk') return <WalkScreen />
  return <BeginScreen />
})

/**
 * Single phone frame for one product-demo chapter (non-scrub / sequential layouts).
 */
export function LandingDemoChapterPhone({
  chapterId,
  beat = 0,
  active = true,
  label = 'ChronoWalk product demo',
}) {
  void beat
  return (
    <LandingProductPhoneFrame label={label}>
      <RedesignNavCtx.Provider value={NOOP_NAV}>
        <ThresholdChromeProvider>
          <div className="cw-v4-phone-app">
            <ChapterScreen chapterId={chapterId} active={active} />
          </div>
        </ThresholdChromeProvider>
      </RedesignNavCtx.Provider>
    </LandingProductPhoneFrame>
  )
}

/**
 * Phone mounts once. Chapter screens stay layered; parent scrubs opacity via refs.
 * Hardware frame never animates - only screen layers.
 */
export default function LandingProductPhoneStage({
  chapters = [],
  layerRefs,
  beats = [],
  activeIndex = 0,
}) {
  void beats
  return (
    <LandingProductPhoneFrame>
      <RedesignNavCtx.Provider value={NOOP_NAV}>
        <ThresholdChromeProvider>
          <div className="cw-v4-phone-app cw-v4-phone-layers">
            {chapters.map((chapter, index) => (
              <div
                key={chapter.id}
                ref={(el) => {
                  if (layerRefs?.current) layerRefs.current[index] = el
                }}
                className="cw-v4-phone-layer"
                data-chapter={chapter.id}
                style={{ opacity: index === 0 ? 1 : 0 }}
              >
                <ChapterScreen
                  chapterId={chapter.id}
                  active={index === activeIndex}
                />
              </div>
            ))}
          </div>
        </ThresholdChromeProvider>
      </RedesignNavCtx.Provider>
    </LandingProductPhoneFrame>
  )
}
