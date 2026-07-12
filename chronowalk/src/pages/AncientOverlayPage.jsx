import { useCallback } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import AncientOverlayCamera from '../components/journey/AncientOverlayCamera'
import { useJourney } from '../hooks/useJourney'
import { getLocalWaypoint } from '../services/waypointMerge'
import { JOURNEY_STATES } from '../state/journeyState'
import { loadCalibration } from '../utils/calibrationStorage'
import { resolveReconstructionMedia } from '../utils/reconstructionMedia'
import { ROUTES, arrivalPath, continueWalkingPath, landmarkPath } from '../routes/paths'

export default function AncientOverlayPage() {
  const navigate = useNavigate()
  const { state, currentStop } = useJourney()

  const waypoint = currentStop?.id ? getLocalWaypoint(currentStop.id) : null
  const media = resolveReconstructionMedia(currentStop, waypoint)
  const calibration = loadCalibration(currentStop?.id)

  const handleContinue = useCallback(() => {
    navigate(continueWalkingPath(), { replace: true })
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
    <AncientOverlayCamera
      stopTitle={currentStop.shortTitle ?? currentStop.title}
      stopId={currentStop.id}
      overlayUrl={media.imageUrl}
      calibration={calibration}
      onContinue={handleContinue}
    />
  )
}
