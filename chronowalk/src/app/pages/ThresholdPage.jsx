import { useMemo } from 'react'
import { useV2Journey } from '../../hooks/useV2Journey'
import { useJourneyStep } from '../../hooks/useJourneyStep'
import { JOURNEY_STATES } from '../../state/journey'
import { loadRomeManifest } from '../../content/manifest.js'
import { resolveWaypointMedia } from '../../lib/tour'
import { resolveThresholdAmbienceUrls } from '../../content/thresholdAmbience.js'
import { useSharedWalkGuard } from '../../redesign/context/SharedWalkGuardContext.jsx'
import RedesignThresholdOverlay from '../../redesign/ui/RedesignThresholdOverlay.jsx'

export function JourneyThresholdLayer() {
  const { state, context, completeStoryAfterThreshold } = useV2Journey()
  const { requestAdvanceToWaypoint } = useSharedWalkGuard()
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
    void requestAdvanceToWaypoint(waypoint.id, () => {
      completeStoryAfterThreshold(waypoint.id, manifest)
      return true
    })
  }

  return (
    <RedesignThresholdOverlay
      waypoint={resolved}
      nowAmbienceUrl={nowAmbienceUrl}
      thenSoundscapeUrl={thenSoundscapeUrl}
      onComplete={handleComplete}
    />
  )
}
