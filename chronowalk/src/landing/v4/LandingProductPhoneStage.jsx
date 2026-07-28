import { memo } from 'react'
import { loadRomeManifest, getWaypoint } from '../../content/manifest.js'
import { JOURNEY_PACE, PACE_OPTIONS } from '../../data/romePacing.js'
import { LOCATION_STATUS } from '../../hooks/useGeoLocation.js'
import { RedesignNavCtx } from '../../redesign/nav.js'
import { ThresholdChromeProvider } from '../../context/ThresholdChromeContext.jsx'
import { pantheonNow } from '../../redesign/images.js'
import { T } from '../../redesign/tokens.js'
import B4PaceSelector from '../../redesign/screens/B4PaceSelector.jsx'
import TourRoutePreviewScreen from '../../redesign/ui/TourRoutePreviewScreen.jsx'
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

function ChooseScreen({ phase }) {
  if (phase >= 2) {
    return (
      <TourRoutePreviewScreen
        manifest={MANIFEST}
        context={{ path: 'a', pace: JOURNEY_PACE.HEROIC }}
        continueLabel="Enable location & begin"
        footerNote="Begin anywhere — the route flexes around you."
        onContinue={noop}
      />
    )
  }
  return (
    <B4PaceSelector
      options={PACE_OPTIONS}
      selectedPace={phase === 1 ? JOURNEY_PACE.CENTRAL : JOURNEY_PACE.HEROIC}
      onSelectPace={noop}
      onContinue={noop}
      showPrices
      subtitle={
        phase === 1
          ? 'Shorter routes when time is tight.'
          : 'Roma Eterna for the full city loop.'
      }
    />
  )
}

function PantheonScreen({ phase, chapterId }) {
  const listening = chapterId === 'listen'
  return (
    <A2FreePreviewStory
      manifest={MANIFEST}
      waypoint={PANTHEON}
      waypointId="w17"
      eyebrowLabel="FREE PREVIEW · PANTHEON"
      narrationPlaying={false}
      audioAvailable
      currentTime={listening ? (phase === 0 ? 18 : phase === 1 ? 77 : 140) : phase >= 2 ? 42 : 12}
      duration={240}
      storyEnded={listening && phase >= 2}
      initialTab={listening && phase >= 1 ? 'transcript' : 'audio'}
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
}

function WalkScreen({ phase }) {
  if (phase === 2) {
    return (
      <C8dResume
        resumeLabel="Pick up at The Pantheon"
        onContinue={noop}
        onStartFresh={noop}
      />
    )
  }
  const arrived = phase >= 3
  return (
    <C2Walking
      title="The Pantheon"
      photo={pantheonNow}
      actNumeral="V"
      stopKey="w17"
      accent={T.actV}
      distanceM={arrived ? 12 : 280}
      locationStatus={LOCATION_STATUS.GRANTED}
      near={arrived}
      insideGeofence={arrived}
      forcedRouteView={arrived ? null : phase === 1 ? 'steps' : 'map'}
      directionsOverride={DEMO_WALK_DIRECTIONS}
      map={<LandingDemoWalkMap />}
      onPause={noop}
      onBeginChapter={noop}
      onContinue={arrived ? noop : undefined}
      continueLabel="Continue walking →"
    />
  )
}

const ChapterScreen = memo(function ChapterScreen({ chapterId, phase }) {
  if (chapterId === 'choose') return <ChooseScreen phase={phase} />
  if (chapterId === 'arrive' || chapterId === 'listen') {
    return <PantheonScreen phase={phase} chapterId={chapterId} />
  }
  if (chapterId === 'walk') return <WalkScreen phase={phase} />
  return <ChooseScreen phase={0} />
})

/**
 * Phone mounts once. All chapter screens stay layered and crossfade.
 * Hardware frame never animates — only screen layers.
 */
export default function LandingProductPhoneStage({ layers = [] }) {
  return (
    <LandingProductPhoneFrame>
      <RedesignNavCtx.Provider value={NOOP_NAV}>
        <ThresholdChromeProvider>
          <div className="cw-v4-phone-app cw-v4-phone-layers">
            {layers.map((layer) => (
              <div
                key={layer.id}
                className="cw-v4-phone-layer"
                data-chapter={layer.id}
                style={layer.style}
                aria-hidden={layer.style.opacity < 0.2}
              >
                <ChapterScreen chapterId={layer.id} phase={layer.phase} />
              </div>
            ))}
          </div>
        </ThresholdChromeProvider>
      </RedesignNavCtx.Provider>
    </LandingProductPhoneFrame>
  )
}
