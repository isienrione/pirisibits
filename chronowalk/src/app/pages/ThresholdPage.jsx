import { useV2Journey, useTourManifest } from '../../hooks/useV2Journey'
import { useAudioEngine } from '../../hooks/useAudioEngine.js'
import { useJourneyStep } from '../../hooks/useJourneyStep'
import { JOURNEY_STATES } from '../../state/journey'
import { getWaypoint } from '../../content/manifest.js'
import { resolveWaypointMedia } from '../../lib/tour'
import { resolveThresholdAmbienceUrls } from '../../content/thresholdAmbience.js'
import { track, TRACK_EVENTS } from '../../lib/track'
import Threshold from '../../components/Threshold'

export function ThresholdDemoPage() {
  const { manifest } = useTourManifest()
  if (!manifest) return null

  const pantheon = getWaypoint(manifest, 'w17')
  const waypoint = resolveWaypointMedia(pantheon)
  const ambience = resolveThresholdAmbienceUrls(manifest)

  return (
    <Threshold
      waypoint={waypoint}
      nowAmbienceUrl={ambience.nowAmbienceUrl}
      thenSoundscapeUrl={ambience.thenSoundscapeUrl}
      active
    />
  )
}

export function JourneyThresholdLayer() {
  const { state, context, completeStoryAfterThreshold } = useV2Journey()
  const { manifest } = useTourManifest()
  const audio = useAudioEngine(manifest)
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
  const ambience = resolveThresholdAmbienceUrls(manifest)

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
        nowAmbienceUrl={ambience.nowAmbienceUrl}
        thenSoundscapeUrl={ambience.thenSoundscapeUrl}
        active
        dismissLabel="Continue walking"
        onDismiss={handleDismiss}
        onHoldStart={() => {
          void audio.playUiCue('threshold')
        }}
      />
    </div>
  )
}
