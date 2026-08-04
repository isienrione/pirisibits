import { memo } from 'react'
import { loadRomeManifest, getWaypoint } from '../../content/manifest.js'
import { JOURNEY_PACE, PACE_OPTIONS } from '../../data/romePacing.js'

/** Landing demo only: purchasable Rome walks (omit begin-flow custom itinerary). */
const LANDING_PACE_OPTIONS = PACE_OPTIONS.filter((option) => option.id !== JOURNEY_PACE.OWN)
import { LOCATION_STATUS } from '../../hooks/useGeoLocation.js'
import { RedesignNavCtx } from '../../redesign/nav.js'
import { ThresholdChromeProvider } from '../../context/ThresholdChromeContext.jsx'
import { spanishSteps } from '../../redesign/images.js'
import { T } from '../../redesign/tokens.js'
import B4PaceSelector from '../../redesign/screens/B4PaceSelector.jsx'
import A2FreePreviewStory from '../../redesign/screens/A2FreePreviewStory.jsx'
import C2Walking from '../../redesign/screens/C2Walking.jsx'
import LandingProductPhoneFrame from './LandingProductPhoneFrame.jsx'
import LandingDemoWalkMap from './LandingDemoWalkMap.jsx'
import LandingDemoWalkShell from './LandingDemoWalkShell.jsx'
import LandingDemoBeginTourScreen from './LandingDemoBeginTourScreen.jsx'

function loadLandingDemoManifest() {
  try {
    return loadRomeManifest()
  } catch (error) {
    console.error('LandingProductPhoneStage: failed to load Rome manifest', error)
    return null
  }
}

const MANIFEST = loadLandingDemoManifest()
const PANTHEON = MANIFEST ? getWaypoint(MANIFEST, 'w17') : null
const NOOP_NAV = { navigate: () => {}, navigateToRoute: () => {} }
const noop = () => {}

const DEMO_WALK_DIRECTIONS = {
  steps: [
    { instruction: 'Continue toward Piazza di Spagna', distanceM: 160, durationSec: 130 },
    { instruction: 'Cross Piazza di Spagna', distanceM: 70, durationSec: 55 },
    { instruction: 'The Spanish Steps rise ahead', distanceM: 50, durationSec: 40 },
  ],
  geometry: {
    type: 'LineString',
    coordinates: [
      [12.48355, 41.90385],
      [12.48235, 41.90525],
      [12.48259, 41.90597],
    ],
  },
  distanceM: 1200,
  durationSec: 780,
  source: 'landing-demo',
}

/** Stable begin-route screen for acquisition sequential demos. */
const BeginTourScreen = memo(function BeginTourScreen() {
  return <LandingDemoBeginTourScreen />
})

/** Stable choose screen - never remounts a different root. */
const ChooseScreen = memo(function ChooseScreen({ beat = 0 }) {
  return (
    <B4PaceSelector
      options={LANDING_PACE_OPTIONS}
      selectedPace={beat >= 1 ? JOURNEY_PACE.CENTRAL : JOURNEY_PACE.HEROIC}
      onSelectPace={noop}
      onContinue={noop}
      showPrices
      subtitle={
        beat >= 1
          ? 'Shorter walks for the part of Rome you have time for.'
          : 'Roma Eterna for the complete 21-stop route.'
      }
    />
  )
})

/** Arrive - Threshold auto-reveal only while this chapter is the active scene. */
const ArriveScreen = memo(function ArriveScreen({ beat = 0, active = false }) {
  if (!MANIFEST || !PANTHEON) {
    return <ChooseScreen beat={0} />
  }
  return (
    <A2FreePreviewStory
      manifest={MANIFEST}
      waypoint={PANTHEON}
      waypointId="w17"
      eyebrowLabel="FREE COMPLETE STOP"
      narrationPlaying={false}
      audioAvailable
      currentTime={beat >= 2 ? 42 : 14}
      duration={240}
      storyEnded={false}
      initialTab="audio"
      continueLabel="See all 21 stops"
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
  if (!MANIFEST || !PANTHEON) {
    return <ChooseScreen beat={0} />
  }
  return (
    <A2FreePreviewStory
      manifest={MANIFEST}
      waypoint={PANTHEON}
      waypointId="w17"
      eyebrowLabel="FREE COMPLETE STOP"
      narrationPlaying={false}
      audioAvailable
      currentTime={beat === 0 ? 48 : beat === 1 ? 96 : 150}
      duration={240}
      storyEnded={beat >= 2}
      initialTab={beat >= 1 ? 'transcript' : 'audio'}
      continueLabel="See all 21 stops"
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
 * Walk - map-forward guidance scene (Spanish Steps approach).
 * Beats mostly stay on Map; one beat peeks at Steps. No resume cut.
 */
const WalkScreen = memo(function WalkScreen({ beat = 0 }) {
  return (
    <div className="cw-v4-walk-stack">
      <LandingDemoWalkShell>
        <C2Walking
          title="Spanish Steps"
          photo={spanishSteps}
          actNumeral="V"
          stopKey="w15"
          accent={T.actV}
          distanceM={beat >= 2 ? 90 : 180}
          locationStatus={LOCATION_STATUS.GRANTED}
          near
          insideGeofence={false}
          forcedRouteView={beat === 1 ? 'steps' : 'map'}
          directionsOverride={DEMO_WALK_DIRECTIONS}
          map={<LandingDemoWalkMap />}
          onPause={noop}
          onBeginChapter={noop}
          continueLabel="Open the Spanish Steps story →"
        />
      </LandingDemoWalkShell>
    </div>
  )
})

const ChapterScreen = memo(function ChapterScreen({ chapterId, beat, active }) {
  if (chapterId === 'begin') return <BeginTourScreen />
  if (chapterId === 'choose') return <ChooseScreen beat={beat} />
  if (chapterId === 'arrive') return <ArriveScreen beat={beat} active={active} />
  if (chapterId === 'listen') return <ListenScreen beat={beat} />
  if (chapterId === 'walk') return <WalkScreen beat={beat} />
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
