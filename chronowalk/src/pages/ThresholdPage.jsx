import { useCallback } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import ThresholdReveal from '../components/journey/ThresholdReveal'
import { useJourney } from '../hooks/useJourney'
import { getLocalWaypoint } from '../services/waypointMerge'
import { JOURNEY_STATES } from '../state/journeyState'
import { resolveThresholdMedia } from '../utils/thresholdMedia'
import { ROUTES, arrivalPath, landmarkPath, reconstructionPath } from '../routes/paths'

export default function ThresholdPage() {
  const navigate = useNavigate()
  const { state, currentStop } = useJourney()

  const waypoint = currentStop?.id ? getLocalWaypoint(currentStop.id) : null
  const media = resolveThresholdMedia(currentStop, waypoint)

  const handleRevealComplete = useCallback(() => {
    navigate(reconstructionPath(), { replace: true })
  }, [navigate])

  if (state !== JOURNEY_STATES.THRESHOLD) {
    if (state === JOURNEY_STATES.STORY) {
      return <Navigate to={landmarkPath()} replace />
    }
    if (state === JOURNEY_STATES.ARRIVED) {
      return <Navigate to={arrivalPath()} replace />
    }
    if ([JOURNEY_STATES.WALKING, JOURNEY_STATES.APPROACHING].includes(state)) {
      return <Navigate to={ROUTES.journey} replace />
    }
    return <Navigate to={landmarkPath()} replace />
  }

  if (!currentStop) {
    return <Navigate to={landmarkPath()} replace />
  }

  return (
    <ThresholdReveal
      stopTitle={currentStop.shortTitle ?? currentStop.title}
      modernUrl={media.modernUrl}
      ancientUrl={media.ancientUrl}
      onRevealComplete={handleRevealComplete}
    />
  )
}
