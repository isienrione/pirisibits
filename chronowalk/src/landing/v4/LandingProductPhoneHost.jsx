import { useMemo } from 'react'
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
import LandingPhoneViewport from '../LandingPhoneViewport.jsx'
import LandingDemoWalkMap from './LandingDemoWalkMap.jsx'

const MANIFEST = loadRomeManifest()
const PANTHEON = getWaypoint(MANIFEST, 'w17')
const NOOP_NAV = { navigate: () => {}, navigateToRoute: () => {} }

const DEMO_WALK_DIRECTIONS = {
  steps: [
    {
      instruction: 'Continue along Via del Seminario',
      distanceM: 120,
      durationSec: 90,
    },
    {
      instruction: 'Cross Piazza della Rotonda',
      distanceM: 90,
      durationSec: 70,
    },
    {
      instruction: 'The Pantheon portico is ahead',
      distanceM: 70,
      durationSec: 55,
    },
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

function noop() {}

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

  const selectedPace = phase === 1 ? JOURNEY_PACE.CENTRAL : JOURNEY_PACE.HEROIC
  return (
    <B4PaceSelector
      options={PACE_OPTIONS}
      selectedPace={selectedPace}
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
  const initialTab = listening && phase >= 1 ? 'transcript' : 'audio'
  const currentTime = listening ? (phase === 0 ? 18 : phase === 1 ? 77 : 140) : phase >= 2 ? 42 : 12

  return (
    <A2FreePreviewStory
      manifest={MANIFEST}
      waypoint={PANTHEON}
      waypointId="w17"
      eyebrowLabel="FREE PREVIEW · PANTHEON"
      narrationPlaying={false}
      audioAvailable
      currentTime={currentTime}
      duration={240}
      storyEnded={listening && phase >= 2}
      initialTab={initialTab}
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

  const forcedRouteView = phase === 1 ? 'steps' : 'map'
  const near = phase >= 3
  const arrived = phase >= 3

  return (
    <C2Walking
      title="The Pantheon"
      photo={pantheonNow}
      actNumeral="V"
      stopKey="w17"
      accent={T.actV}
      distanceM={arrived ? 12 : near ? 55 : 280}
      locationStatus={LOCATION_STATUS.GRANTED}
      near={near}
      insideGeofence={arrived}
      forcedRouteView={arrived ? null : forcedRouteView}
      directionsOverride={DEMO_WALK_DIRECTIONS}
      map={<LandingDemoWalkMap />}
      onPause={noop}
      onBeginChapter={noop}
      onContinue={phase >= 3 ? noop : undefined}
      continueLabel="Continue walking →"
    />
  )
}

/**
 * Sticky-phone host — mounts real product screens inside the iPhone frame.
 * Scroll phase changes component state; no screenshots.
 */
export default function LandingProductPhoneHost({ chapterId = 'choose', phase = 0 }) {
  const screen = useMemo(() => {
    if (chapterId === 'choose') return <ChooseScreen phase={phase} />
    if (chapterId === 'arrive' || chapterId === 'listen') {
      return <PantheonScreen phase={phase} chapterId={chapterId} />
    }
    if (chapterId === 'walk') return <WalkScreen phase={phase} />
    return <ChooseScreen phase={0} />
  }, [chapterId, phase])

  return (
    <LandingPhoneViewport label="ChronoWalk product demo" size="xl">
      <RedesignNavCtx.Provider value={NOOP_NAV}>
        <ThresholdChromeProvider>
          <div className="cw-v4-phone-app" data-chapter={chapterId} data-phase={phase}>
            {screen}
          </div>
        </ThresholdChromeProvider>
      </RedesignNavCtx.Provider>
    </LandingPhoneViewport>
  )
}
