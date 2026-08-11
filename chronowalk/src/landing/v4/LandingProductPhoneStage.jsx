import { memo, useMemo } from 'react'
import { Settings } from 'lucide-react'
import { loadRomeManifest, getWaypoint } from '../../content/manifest.js'
import { JOURNEY_PACE, PACE_OPTIONS } from '../../data/romePacing.js'
import { RedesignNavCtx } from '../../redesign/nav.js'
import { ThresholdChromeProvider } from '../../context/ThresholdChromeContext.jsx'
import B4PaceSelector from '../../redesign/screens/B4PaceSelector.jsx'
import A2FreePreviewStory from '../../redesign/screens/A2FreePreviewStory.jsx'
import LandingProductPhoneFrame from './LandingProductPhoneFrame.jsx'
import LandingDemoBeginTourScreen from './LandingDemoBeginTourScreen.jsx'
import LandingDemoWalkMap from './LandingDemoWalkMap.jsx'
import { T, F } from '../../redesign/tokens.js'
import { useI18n } from '../../i18n/I18nProvider.jsx'

/** Landing demo only: purchasable Rome walks (omit begin-flow custom itinerary). */
const LANDING_PACE_OPTIONS = PACE_OPTIONS.filter((option) => option.id !== JOURNEY_PACE.OWN)
const NOOP_NAV = { navigate: () => {}, navigateToRoute: () => {} }
const noop = () => {}

function useLandingDemoManifest() {
  const { locale } = useI18n()
  return useMemo(() => {
    try {
      return loadRomeManifest()
    } catch (error) {
      console.error('LandingProductPhoneStage: failed to load Rome manifest', error)
      return null
    }
  }, [locale])
}

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

/** Arrive - Threshold auto-reveal only while this chapter is the active scene. */
const ArriveScreen = memo(function ArriveScreen({ beat = 0, active = false }) {
  const { t } = useI18n()
  const manifest = useLandingDemoManifest()
  const pantheon = manifest ? getWaypoint(manifest, 'w17') : null
  if (!manifest || !pantheon) {
    return <ChooseScreen beat={0} />
  }
  return (
    <A2FreePreviewStory
      manifest={manifest}
      waypoint={pantheon}
      waypointId="w17"
      eyebrowLabel={t('pantheon.preview.freeComplete')}
      narrationPlaying={false}
      audioAvailable
      currentTime={beat >= 2 ? 42 : 14}
      duration={240}
      storyEnded={false}
      initialTab="audio"
      continueLabel={t('pantheon.preview.continueAll')}
      demoAutoReveal={active}
      suppressAutoRevealInvite={!active}
      onTogglePlay={noop}
      onSkipBack={noop}
      onSkipForward={noop}
      onSeek={noop}
      onThresholdCross={noop}
      onStoryComplete={noop}
      onBack={noop}
    />
  )
})

/** Listen - narration / transcript. Stable tree (no tab remount thrash). */
const ListenScreen = memo(function ListenScreen({ beat = 0 }) {
  const { t } = useI18n()
  const manifest = useLandingDemoManifest()
  const pantheon = manifest ? getWaypoint(manifest, 'w17') : null
  if (!manifest || !pantheon) {
    return <ChooseScreen beat={0} />
  }
  return (
    <A2FreePreviewStory
      manifest={manifest}
      waypoint={pantheon}
      waypointId="w17"
      eyebrowLabel={t('pantheon.preview.freeComplete')}
      narrationPlaying={false}
      audioAvailable
      currentTime={beat === 0 ? 48 : beat === 1 ? 96 : 150}
      duration={240}
      storyEnded={beat >= 2}
      initialTab={beat >= 1 ? 'transcript' : 'audio'}
      continueLabel={t('pantheon.preview.continueAll')}
      suppressAutoRevealInvite
      onTogglePlay={noop}
      onSkipBack={noop}
      onSkipForward={noop}
      onSeek={noop}
      onThresholdCross={noop}
      onStoryComplete={noop}
      onBack={noop}
    />
  )
})

/**
 * Walk - locale-aware companion chrome over the Spanish Steps basemap.
 */
const WalkScreen = memo(function WalkScreen() {
  const { t } = useI18n()
  const tabs = [
    t('shell.tab.walk').toUpperCase(),
    t('shell.tab.tour').toUpperCase(),
    t('shell.tab.map').toUpperCase(),
    t('shell.tab.journal').toUpperCase(),
  ]
  const walkTab = t('shell.tab.walk').toUpperCase()

  return (
    <div
      className="cw-v4-walk-static"
      data-testid="landing-demo-walk-static"
      style={{
        height: '100%',
        background: T.bone,
        fontFamily: F.body,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div style={{ flexShrink: 0, padding: '44px 16px 10px', background: T.bone }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: T.muted }}>{`< ${t('player.back')}`}</span>
          <span style={{ color: T.muted, lineHeight: 0 }} aria-hidden>
            <Settings size={16} />
          </span>
        </div>
        <p
          style={{
            margin: '10px 0 2px',
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: T.ember,
          }}
        >
          {t('walk.walkingTo')}
        </p>
        <h2
          style={{
            margin: 0,
            fontFamily: F.display,
            fontWeight: 300,
            fontSize: 26,
            color: T.ink,
            lineHeight: 1.1,
          }}
        >
          {t('mapDemo.stop.steps')}
        </h2>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <span
            style={{
              padding: '6px 12px',
              borderRadius: 999,
              background: T.ink,
              color: T.warmWhite,
              fontSize: 12,
            }}
          >
            {t('walk.map')}
          </span>
          <span
            style={{
              padding: '6px 12px',
              borderRadius: 999,
              background: `${T.ink800}18`,
              color: T.muted,
              fontSize: 12,
            }}
          >
            {t('walk.steps')}
          </span>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <LandingDemoWalkMap />
      </div>

      <div style={{ flexShrink: 0, padding: '12px 16px 8px', background: T.bone }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <div
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: 12,
              background: T.terracotta,
              color: T.obsidian,
              fontWeight: 600,
              fontSize: 13,
              textAlign: 'center',
            }}
          >
            {t('walk.continue')}
          </div>
          <div
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: 12,
              border: `1px solid ${T.ink800}33`,
              color: T.ink,
              fontWeight: 600,
              fontSize: 13,
              textAlign: 'center',
            }}
          >
            {t('walk.here')}
          </div>
        </div>
      </div>

      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          borderTop: `1px solid ${T.ink800}22`,
          background: T.bone,
          paddingBottom: 24,
          paddingTop: 4,
        }}
      >
        {tabs.map((tab) => (
          <div
            key={tab}
            style={{
              flex: 1,
              textAlign: 'center',
              paddingTop: 8,
              fontSize: 9,
              letterSpacing: '0.12em',
              color: tab === walkTab ? T.actI : T.muted,
            }}
          >
            {tab}
          </div>
        ))}
      </div>
    </div>
  )
})

const ChapterScreen = memo(function ChapterScreen({ chapterId, beat, active }) {
  if (chapterId === 'begin') return <BeginTourScreen />
  if (chapterId === 'choose') return <ChooseScreen beat={beat} />
  if (chapterId === 'arrive') return <ArriveScreen beat={beat} active={active} />
  if (chapterId === 'listen') return <ListenScreen beat={beat} />
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
