import { useV2Journey, useTourManifest } from '../../hooks/useV2Journey'
import { useJourneyStep } from '../../hooks/useJourneyStep'
import { JOURNEY_STATES } from '../../state/journey'
import { resolveWaypointMedia } from '../../lib/tour'
import RedesignThresholdOverlay from '../../redesign/ui/RedesignThresholdOverlay.jsx'

export function JourneyThresholdLayer() {
  const { state, context, transition } = useV2Journey()
  const { manifest } = useTourManifest()
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

  const handleDismiss = () => {
    transition(JOURNEY_STATES.STORY)
  }

  return <RedesignThresholdOverlay waypoint={resolved} onDismiss={handleDismiss} />
}
