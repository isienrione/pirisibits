import { memo, useEffect, useRef } from 'react'
import LandingProductPhoneFrame from './LandingProductPhoneFrame.jsx'
import { RedesignNavCtx } from '../../redesign/nav.js'
import { ThresholdChromeProvider } from '../../context/ThresholdChromeContext.jsx'
import { useI18n } from '../../i18n/I18nProvider.jsx'

const NOOP_NAV = { navigate: () => {}, navigateToRoute: () => {} }

const BEGIN_LOCKUP = '/landing/phone-screens/begin-tour-lockup.jpeg'
const ARRIVE_LOCKUP = '/landing/phone-screens/arrive-lockup.jpeg'
const LISTEN_VIDEO = '/landing/phone-mockups/listen-campo-fiori.mp4'
const LISTEN_POSTER = '/landing/phone-mockups/listen-campo-fiori-poster.jpg'
const WALK_LOCKUP = '/landing/phone-screens/walk-lockup.jpeg'

/** Full-bleed photo lockup sized to the phone artboard. */
const LockupImage = memo(function LockupImage({ src, alt, testId, className = '' }) {
  return (
    <div className={`cw-v4-lockup${className ? ` ${className}` : ''}`} data-testid={testId}>
      <img className="cw-v4-lockup__media" src={src} alt={alt} decoding="async" draggable={false} />
    </div>
  )
})

/** Looping muted screen recording sized to the phone artboard. */
const LockupVideo = memo(function LockupVideo({
  src,
  poster,
  alt,
  testId,
  active = false,
  className = '',
}) {
  const videoRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return undefined
    if (active) {
      const play = video.play()
      if (play && typeof play.catch === 'function') play.catch(() => {})
    } else {
      video.pause()
    }
    return undefined
  }, [active])

  return (
    <div className={`cw-v4-lockup${className ? ` ${className}` : ''}`} data-testid={testId}>
      <video
        ref={videoRef}
        className="cw-v4-lockup__media"
        src={src}
        poster={poster}
        muted
        playsInline
        loop
        preload="metadata"
        aria-label={alt}
      />
    </div>
  )
})

const BeginScreen = memo(function BeginScreen() {
  const { t } = useI18n()
  return (
    <LockupImage
      src={BEGIN_LOCKUP}
      alt={t('landing.demo.beginAlt')}
      testId="landing-demo-begin-lockup"
    />
  )
})

const ArriveScreen = memo(function ArriveScreen() {
  const { t } = useI18n()
  return (
    <LockupImage
      src={ARRIVE_LOCKUP}
      alt={t('landing.demo.arriveAlt')}
      testId="landing-demo-arrive-lockup"
    />
  )
})

const ListenScreen = memo(function ListenScreen({ active = false }) {
  const { t } = useI18n()
  return (
    <LockupVideo
      src={LISTEN_VIDEO}
      poster={LISTEN_POSTER}
      alt={t('landing.demo.listenAlt')}
      testId="landing-demo-listen-campo"
      active={active}
    />
  )
})

const WalkScreen = memo(function WalkScreen() {
  const { t } = useI18n()
  return (
    <LockupImage
      src={WALK_LOCKUP}
      alt={t('landing.demo.walkAlt')}
      testId="landing-demo-walk-lockup"
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
