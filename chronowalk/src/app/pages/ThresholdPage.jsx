import { useMemo } from 'react'
import { useV2Journey } from '../../hooks/useV2Journey'
import { useJourneyStep } from '../../hooks/useJourneyStep'
import { JOURNEY_STATES } from '../../state/journey'
import { loadRomeManifest } from '../../content/manifest.js'
import { resolveWaypointMedia } from '../../lib/tour'
import { resolveThresholdAmbienceUrls } from '../../content/thresholdAmbience.js'
import RedesignThresholdOverlay from '../../redesign/ui/RedesignThresholdOverlay.jsx'

export function JourneyThresholdLayer() {
  const { state, context, transition, completeStoryAfterThreshold } = useV2Journey()
  const manifest = useMemo(() => loadRomeManifest(), [])
  const step = useJourneyStep(
    manifest,
    context.path,
    context.currentSequenceIndex,
    context.promotedOptionalIds
  )

  if (state !== JOURNEY_STATES.THRESHOLD || !manifest || step?.type !== 'waypoint') return null

  const waypoint = step.record
  if (!waypoint) return null

  const resolved = resolveWaypointMedia(waypoint)
  const { nowAmbienceUrl, thenSoundscapeUrl } = resolveThresholdAmbienceUrls(manifest)

  const handleComplete = () => {
    completeStoryAfterThreshold(waypoint.id)
  }

  const handleBackToStory = () => {
    transition(JOURNEY_STATES.STORY)
  }

  return (
    <RedesignThresholdOverlay
      waypoint={resolved}
      nowAmbienceUrl={nowAmbienceUrl}
      thenSoundscapeUrl={thenSoundscapeUrl}
      onComplete={handleComplete}
      onBackToStory={handleBackToStory}
    />
  )
}
