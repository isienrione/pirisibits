import { useMemo } from 'react'
import { AUDIO_MODES, audioOrchestrator } from '../../../audio/AudioOrchestrator.js'
import { ThresholdChromeProvider } from '../../../context/ThresholdChromeContext.jsx'
import { useAudioPlaybackState } from '../../../hooks/useAudioPlaybackState.js'
import { getWaypointGeo } from '../../../data/waypointGeo.js'
import {
  getAncientSliderUrl,
  getModernSliderUrl,
} from '../../../utils/sliderMedia.js'
import Threshold from '../../Threshold.jsx'
import { resolveV1JourneyPhase, V1_JOURNEY_PHASE } from '../../../utils/v1JourneyPhase.js'
import BeforeStartScreen from './BeforeStartScreen.jsx'
import WalkingJourneyScreen, { pauseWalkingAudio } from './WalkingJourneyScreen.jsx'
import ApproachingJourneyScreen from './ApproachingJourneyScreen.jsx'
import JourneyArrivedScreen from './JourneyArrivedScreen.jsx'
import StoryJourneyScreen from './StoryJourneyScreen.jsx'
import JourneyCompleteLetter from './JourneyCompleteLetter.jsx'
import JourneyImmersionShell from './JourneyImmersionShell.jsx'

function buildThresholdWaypoint(waypoint) {
  if (!waypoint) return null
  if (waypoint.reconstruction) return waypoint

  const modern = getModernSliderUrl(waypoint)
  const ancient = getAncientSliderUrl(waypoint)
  if (!modern || !ancient) return waypoint

  return {
    ...waypoint,
    name: waypoint.title,
    reconstruction: {
      now: modern,
      then: ancient,
      loop: modern,
      caption: waypoint.arrival_subtitle,
    },
  }
}

export default function JourneyTabView({
  tour,
  session,
  isTourComplete,
  journeyBegun,
  onJourneyBegin,
  thresholdActive,
  onThresholdActiveChange,
  activeWaypoint,
  discoveredWaypoint,
  cardDismissed,
  onContinueFromStory,
  walkedMeters,
  startedAtMs,
  isTourNarrationActive,
}) {
  const { currentMode } = useAudioPlaybackState()

  const phase = resolveV1JourneyPhase({
    isTourComplete,
    isAwaitingFirstStop: session.isAwaitingFirstStop,
    journeyBegun,
    geoState: session.state,
    distance: session.distance,
    activeWaypoint,
    thresholdActive,
    discoveredWaypoint,
    cardDismissed,
  })

  const seamProgress = useMemo(() => {
    const total = tour?.stopIds?.length ?? 1
    const heard = session.progress.arrivedStopIds.length
    return Math.min(1, heard / total)
  }, [session.progress.arrivedStopIds.length, tour?.stopIds?.length])

  const targetTitle =
    session.currentWaypoint?.title ??
    getWaypointGeo(session.targetStopId)?.title ??
    'Next landmark'

  const directionLine =
    session.nextWaypoint?.arrival_subtitle ??
    (session.progress.transitLegActive
      ? 'Follow the route between stops.'
      : `Walk toward ${targetTitle}.`)

  const ambientActive =
    currentMode === AUDIO_MODES.AMBIENT && !audioOrchestrator.ambientPlayer?.paused

  const thresholdWaypoint = buildThresholdWaypoint(activeWaypoint ?? discoveredWaypoint)

  let content = null

  switch (phase) {
    case V1_JOURNEY_PHASE.BEFORE_START:
      content = <BeforeStartScreen onBegin={onJourneyBegin} />
      break
    case V1_JOURNEY_PHASE.WALKING:
      content = (
        <WalkingJourneyScreen
          targetTitle={targetTitle}
          directionLine={directionLine}
          distance={session.distance}
          ambientActive={ambientActive}
          onPause={pauseWalkingAudio}
        />
      )
      break
    case V1_JOURNEY_PHASE.APPROACHING:
      content = (
        <ApproachingJourneyScreen
          waypoint={session.currentWaypoint ?? discoveredWaypoint}
          targetTitle={targetTitle}
          approachLine={session.currentWaypoint?.arrival_subtitle}
          distance={session.distance}
        />
      )
      break
    case V1_JOURNEY_PHASE.ARRIVED:
      content = <JourneyArrivedScreen waypoint={discoveredWaypoint ?? session.currentWaypoint} />
      break
    case V1_JOURNEY_PHASE.STORY:
      content = (
        <StoryJourneyScreen
          waypoint={activeWaypoint}
          onEnterThreshold={() => onThresholdActiveChange?.(true)}
          onContinue={onContinueFromStory}
        />
      )
      break
    case V1_JOURNEY_PHASE.THRESHOLD:
      content = (
        <ThresholdChromeProvider>
          <div className="fixed inset-0">
            <Threshold
              waypoint={thresholdWaypoint}
              nowAmbienceUrl={thresholdWaypoint?.ambient_url}
              thenSoundscapeUrl={thresholdWaypoint?.arrival_immersive_url}
              embedded
              active
              onDismiss={() => onThresholdActiveChange?.(false)}
              dismissLabel="Return to story"
            />
          </div>
        </ThresholdChromeProvider>
      )
      break
    case V1_JOURNEY_PHASE.COMPLETE:
      content = (
        <JourneyCompleteLetter
          tour={tour}
          visitedCount={session.progress.arrivedStopIds.length}
          walkedMeters={walkedMeters}
          startedAtMs={startedAtMs}
        />
      )
      break
    default:
      content = null
  }

  if (!content) return null

  if (phase === V1_JOURNEY_PHASE.THRESHOLD) {
    return content
  }

  return <JourneyImmersionShell seamProgress={seamProgress}>{content}</JourneyImmersionShell>
}
