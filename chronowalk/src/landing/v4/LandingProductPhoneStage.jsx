import { memo, useEffect, useRef } from 'react'
import { JOURNEY_PACE, PACE_OPTIONS } from '../../data/romePacing.js'
import { RedesignNavCtx } from '../../redesign/nav.js'
import { ThresholdChromeProvider } from '../../context/ThresholdChromeContext.jsx'
import B4PaceSelector from '../../redesign/screens/B4PaceSelector.jsx'
import LandingProductPhoneFrame from './LandingProductPhoneFrame.jsx'
import LandingDemoBeginTourScreen from './LandingDemoBeginTourScreen.jsx'
import { useI18n } from '../../i18n/I18nProvider.jsx'

/** Landing demo only: purchasable Rome walks (omit begin-flow custom itinerary). */
const LANDING_PACE_OPTIONS = PACE_OPTIONS.filter((option) => option.id !== JOURNEY_PACE.OWN)
const NOOP_NAV = { navigate: () => {}, navigateToRoute: () => {} }
const noop = () => {}

const ARRIVE_CAMPO_VIDEO = '/landing/phone-mockups/arrive-campo-fiori.mp4'
const ARRIVE_CAMPO_POSTER = '/landing/phone-mockups/arrive-campo-fiori-poster.jpg'
const WALK_STEPS_REAL = '/landing/phone-screens/walk-spanish-steps-real.jpeg'
const LISTEN_AUDIO_LOCKUP = '/landing/phone-mockups/screen-01.png'

/** Stable begin-route screen for acquisition sequential demos. */
const BeginTourScreen = memo(function BeginTourScreen() {
  return <LandingDemoBeginTourScreen />
})

/** Stable choose screen - never remounts a different root. */
const ChooseScreen = memo(function ChooseScreen({ beat = 0 }) {
  const { t } = useI18n()
  return (
    <B4PaceSelector
      options={LANDING_PACE_OPTIONS}
      selectedPace={beat >= 1 ? JOURNEY_PACE.CENTRAL : JOURNEY_PACE.HEROIC}
      onSelectPace={noop}
      onContinue={noop}
      showPrices
      subtitle={beat >= 1 ? t('landing.demo.pace.short') : t('landing.demo.pace.eterna')}
    />
  )
})

/**
 * Arrive - Campo de' Fiori Then/Now screen recording (replaces Pantheon live player).
 * Plays while this chapter is the active scene.
 */
const ArriveScreen = memo(function ArriveScreen({ active = false }) {
  const { t } = useI18n()
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
    <div className="cw-v4-arrive-static" data-testid="landing-demo-arrive-campo">
      <video
        ref={videoRef}
        className="cw-v4-arrive-static__media"
        src={ARRIVE_CAMPO_VIDEO}
        poster={ARRIVE_CAMPO_POSTER}
        muted
        playsInline
        loop
        preload="metadata"
        aria-label={t('landing.demo.arriveAlt')}
      />
    </div>
  )
})

/** Listen - audio-player lockup (distinct from arrive's Threshold story). */
const ListenScreen = memo(function ListenScreen() {
  const { t } = useI18n()
  return (
    <div className="cw-v4-listen-static" data-testid="landing-demo-listen-static">
      <img
        src={LISTEN_AUDIO_LOCKUP}
        alt={t('landing.demo.listenAlt')}
        decoding="async"
        draggable={false}
      />
    </div>
  )
})

/**
 * Walk - real Spanish Steps map lockup (IMG_1218), not the simplified basemap demo.
 */
const WalkScreen = memo(function WalkScreen() {
  const { t } = useI18n()
  return (
    <div className="cw-v4-walk-static" data-testid="landing-demo-walk-static">
      <img
        className="cw-v4-walk-static__shot"
        src={WALK_STEPS_REAL}
        alt={t('landing.demo.walkAlt')}
        decoding="async"
        draggable={false}
      />
    </div>
  )
})

const ChapterScreen = memo(function ChapterScreen({ chapterId, beat, active }) {
  if (chapterId === 'begin') return <BeginTourScreen />
  if (chapterId === 'choose') return <ChooseScreen beat={beat} />
  if (chapterId === 'arrive') return <ArriveScreen active={active} />
  if (chapterId === 'listen') return <ListenScreen />
  if (chapterId === 'walk') return <WalkScreen />
  return <ChooseScreen beat={0} />
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
  return (
    <LandingProductPhoneFrame label={label}>
      <RedesignNavCtx.Provider value={NOOP_NAV}>
        <ThresholdChromeProvider>
          <div className="cw-v4-phone-app">
            <ChapterScreen chapterId={chapterId} beat={beat} active={active} />
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
                  beat={beats[index] ?? 0}
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
