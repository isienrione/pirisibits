import { memo } from 'react'
import { loadRomeManifest, getWaypoint } from '../../content/manifest.js'
import { JOURNEY_PACE, PACE_OPTIONS } from '../../data/romePacing.js'
import { LOCATION_STATUS } from '../../hooks/useGeoLocation.js'
import { RedesignNavCtx } from '../../redesign/nav.js'
import { ThresholdChromeProvider } from '../../context/ThresholdChromeContext.jsx'
import { pantheonNow } from '../../redesign/images.js'
import { T } from '../../redesign/tokens.js'
import B4PaceSelector from '../../redesign/screens/B4PaceSelector.jsx'
import A2FreePreviewStory from '../../redesign/screens/A2FreePreviewStory.jsx'
import C2Walking from '../../redesign/screens/C2Walking.jsx'
import C8dResume from '../../redesign/screens/C8dResume.jsx'
import LandingProductPhoneFrame from './LandingProductPhoneFrame.jsx'
import LandingDemoWalkMap from './LandingDemoWalkMap.jsx'

const MANIFEST = loadRomeManifest()
const PANTHEON = getWaypoint(MANIFEST, 'w17')
const NOOP_NAV = { navigate: () => {}, navigateToRoute: () => {} }
const noop = () => {}

const DEMO_WALK_DIRECTIONS = {
  steps: [
    { instruction: 'Continue along Via del Seminario', distanceM: 120, durationSec: 90 },
    { instruction: 'Cross Piazza della Rotonda', distanceM: 90, durationSec: 70 },
    { instruction: 'The Pantheon portico is ahead', distanceM: 70, durationSec: 55 },
  ],
  geometry: {
    type: 'LineString',
    coordinates: [
      [12.4765, 41.8992],
      [12.4768, 41.8990],
      [12.4770, 41.8988],
    ],
  },
  distanceM: 280,
  durationSec: 240,
  source: 'landing-demo',
}

/** Stable choose screen — never remounts a different root. */
const ChooseScreen = memo(function ChooseScreen({ beat = 0 }) {
  return (
    <B4PaceSelector
      options={PACE_OPTIONS}
      selectedPace={beat >= 1 ? JOURNEY_PACE.CENTRAL : JOURNEY_PACE.HEROIC}
      onSelectPace={noop}
      onContinue={noop}
      showPrices
      subtitle={
        beat >= 1
          ? 'Shorter routes when time is tight.'
          : 'Roma Eterna for the full city loop.'
      }
    />
  )
})

/** Arrive — Threshold / story open with auto demo reveal. */
const ArriveScreen = memo(function ArriveScreen({ beat = 0 }) {
  return (
    <A2FreePreviewStory
      manifest={MANIFEST}
      waypoint={PANTHEON}
      waypointId="w17"
      eyebrowLabel="FREE PREVIEW · PANTHEON"
      narrationPlaying={false}
      audioAvailable
      currentTime={beat >= 2 ? 42 : 14}
      duration={240}
      storyEnded={false}
      initialTab="audio"
      continueLabel="See the full tour →"
      demoAutoReveal
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

/** Listen — narration / transcript. Stable tree (no tab remount thrash). */
const ListenScreen = memo(function ListenScreen({ beat = 0 }) {
  return (
    <A2FreePreviewStory
      manifest={MANIFEST}
      waypoint={PANTHEON}
      waypointId="w17"
      eyebrowLabel="FREE PREVIEW · PANTHEON"
      narrationPlaying={false}
      audioAvailable
      currentTime={beat === 0 ? 48 : beat === 1 ? 96 : 150}
      duration={240}
      storyEnded={beat >= 2}
      initialTab={beat >= 1 ? 'transcript' : 'audio'}
      continueLabel="See the full tour →"
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
 * Walk — one walking root forever.
 * Resume is an opacity overlay driven by --resume-blend (scroll), never a remount cut.
 */
const WalkScreen = memo(function WalkScreen({ beat = 0 }) {
  const near = beat >= 3
  return (
    <div className="cw-v4-walk-stack">
      <div className="cw-v4-walk-live">
        <C2Walking
          title="The Pantheon"
          photo={pantheonNow}
          actNumeral="V"
          stopKey="w17"
          accent={T.actV}
          distanceM={near ? 12 : 280}
          locationStatus={LOCATION_STATUS.GRANTED}
          near={near}
          insideGeofence={near}
          forcedRouteView={near ? null : 'map'}
          directionsOverride={DEMO_WALK_DIRECTIONS}
          map={<LandingDemoWalkMap />}
          onPause={noop}
          onBeginChapter={noop}
          onContinue={near ? noop : undefined}
          continueLabel="Continue walking →"
        />
      </div>
      <div className="cw-v4-walk-resume" aria-hidden>
        <C8dResume
          resumeLabel="Pick up at The Pantheon"
          onContinue={noop}
          onStartFresh={noop}
        />
      </div>
    </div>
  )
})

const ChapterScreen = memo(function ChapterScreen({ chapterId, beat }) {
  if (chapterId === 'choose') return <ChooseScreen beat={beat} />
  if (chapterId === 'arrive') return <ArriveScreen beat={beat} />
  if (chapterId === 'listen') return <ListenScreen beat={beat} />
  if (chapterId === 'walk') return <WalkScreen beat={beat} />
  return <ChooseScreen beat={0} />
})

/**
 * Phone mounts once. Chapter screens stay layered; parent scrubs opacity via refs.
 * Hardware frame never animates — only screen layers.
 */
export default function LandingProductPhoneStage({
  chapters = [],
  layerRefs,
  beats = [],
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
                <ChapterScreen chapterId={chapter.id} beat={beats[index] ?? 0} />
              </div>
            ))}
          </div>
        </ThresholdChromeProvider>
      </RedesignNavCtx.Provider>
    </LandingProductPhoneFrame>
  )
}
