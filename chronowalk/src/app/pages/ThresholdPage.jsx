import { useJourney, useTourManifest } from '../../hooks/useJourney'
import { useJourneyStep } from '../../hooks/useJourneyStep'
import { JOURNEY_STATES } from '../../state/journey'
import { resolveWaypointMedia } from '../../lib/tour'
import { THRESHOLD_DEMO_WAYPOINT } from '../../data/thresholdDemo'
import { track, TRACK_EVENTS } from '../../lib/track'
import Threshold from '../../components/Threshold'

export function ThresholdDemoPage() {
  const waypoint = THRESHOLD_DEMO_WAYPOINT

  return (
    <Threshold
      waypoint={waypoint}
      nowAmbienceUrl={waypoint.nowAmbience}
      thenSoundscapeUrl={waypoint.thenSoundscape}
      active
    />
  )
}

export function JourneyThresholdLayer() {
  const { state, context, completeStoryAfterThreshold } = useJourney()
  const { manifest } = useTourManifest()
  const step = useJourneyStep(
    manifest,
    context.path,
    context.currentSequenceIndex,
    context.promotedOptionalIds
  )

  if (state !== JOURNEY_STATES.THRESHOLD || !manifest || step?.type !== 'waypoint') return null

  const waypoint = step.record
  if (!waypoint?.reconstruction) return null

  const resolved = resolveWaypointMedia(waypoint)

  const handleDismiss = () => {
    completeStoryAfterThreshold(step.id)
    track(TRACK_EVENTS.STORY_COMPLETE, { waypoint_id: step.id, via_threshold: true })
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 70,
      }}
    >
      <Threshold
        waypoint={resolved}
        nowAmbienceUrl={THRESHOLD_DEMO_WAYPOINT.nowAmbience}
        thenSoundscapeUrl={THRESHOLD_DEMO_WAYPOINT.thenSoundscape}
        active
        dismissLabel="Continue walking"
        onDismiss={handleDismiss}
      />
    </div>
  )
}
