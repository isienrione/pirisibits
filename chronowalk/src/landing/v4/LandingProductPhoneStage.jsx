import { memo, useMemo } from 'react'
import { loadRomeManifest, getWaypoint } from '../../content/manifest.js'
import { JOURNEY_PACE, PACE_OPTIONS } from '../../data/romePacing.js'
import { LOCATION_STATUS } from '../../hooks/useGeoLocation.js'
import { RedesignNavCtx } from '../../redesign/nav.js'
import { ThresholdChromeProvider } from '../../context/ThresholdChromeContext.jsx'
import B4PaceSelector from '../../redesign/screens/B4PaceSelector.jsx'
import A2FreePreviewStory from '../../redesign/screens/A2FreePreviewStory.jsx'
import WalkingCompanionScreen from '../../redesign/screens/WalkingCompanionScreen.jsx'
import { spanishSteps } from '../../redesign/images.js'
import { T } from '../../redesign/tokens.js'
import LandingProductPhoneFrame from './LandingProductPhoneFrame.jsx'
import LandingDemoBeginTourScreen from './LandingDemoBeginTourScreen.jsx'
import LandingDemoWalkMap from './LandingDemoWalkMap.jsx'
import { useI18n } from '../../i18n/I18nProvider.jsx'

/** Landing demo only: purchasable Rome walks (omit begin-flow custom itinerary). */
const LANDING_PACE_OPTIONS = PACE_OPTIONS.filter((option) => option.id !== JOURNEY_PACE.OWN)
const NOOP_NAV = { navigate: () => {}, navigateToRoute: () => {} }
const noop = () => {}

/** Spanish Steps approach used by the product walk companion demo. */
const STEPS_DEMO = Object.freeze({
  userPosition: { lat: 41.9049, lng: 12.4818 },
  destination: { lat: 41.90597, lng: 12.48259 },
  distanceM: 180,
  directionsOverride: {
    distanceM: 180,
    durationSec: 120,
    steps: [],
    geometry: {
      type: 'LineString',
      coordinates: [
        [12.4818, 41.9049],
        [12.48259, 41.90597],
      ],
    },
  },
})

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

/** Listen - audio-player lockup (distinct from arrive's Threshold story). */
const ListenScreen = memo(function ListenScreen() {
  const { t } = useI18n()
  return (
    <div className="cw-v4-listen-static" data-testid="landing-demo-listen-static">
      <img
        src="/landing/phone-mockups/screen-01.png"
        alt={t('landing.demo.listenAlt')}
        decoding="async"
        draggable={false}
      />
    </div>
  )
})

/**
 * Walk - real WalkingCompanionScreen (same product UI as the live app),
 * with the Spanish Steps basemap used for landing demos.
 */
const WalkScreen = memo(function WalkScreen() {
  const { t } = useI18n()
  return (
    <div className="cw-v4-walk-static" data-testid="landing-demo-walk-static">
      <WalkingCompanionScreen
        accent={T.actV}
        title={t('mapDemo.stop.steps')}
        photo={spanishSteps}
        stopKey="landing-demo-spanish-steps"
        map={<LandingDemoWalkMap />}
        forcedRouteView="map"
        userPosition={STEPS_DEMO.userPosition}
        destination={STEPS_DEMO.destination}
        distanceM={STEPS_DEMO.distanceM}
        estimatedDistanceM={STEPS_DEMO.distanceM}
        directionsOverride={STEPS_DEMO.directionsOverride}
        locationStatus={LOCATION_STATUS.GRANTED}
        onContinue={noop}
        onOpenSettings={noop}
        testId="landing-demo-walk-companion"
      />
    </div>
  )
})

const ChapterScreen = memo(function ChapterScreen({ chapterId, beat, active }) {
  if (chapterId === 'begin') return <BeginTourScreen />
  if (chapterId === 'choose') return <ChooseScreen beat={beat} />
  if (chapterId === 'arrive') return <ArriveScreen beat={beat} active={active} />
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
