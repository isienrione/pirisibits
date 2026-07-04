import { useCallback, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import AncientOverlayCamera from '../components/journey/AncientOverlayCamera'
import ContinueWalkingTransition from '../components/journey/ContinueWalkingTransition'
import { useJourney } from '../hooks/useJourney'
import { getLocalWaypoint } from '../services/waypointMerge'
import { JOURNEY_STATES } from '../state/journeyState'
import { loadCalibration } from '../utils/calibrationStorage'
import { resolveReconstructionMedia } from '../utils/reconstructionMedia'
import { ROUTES, arrivalPath, landmarkPath } from '../routes/paths'

export default function AncientOverlayPage() {
  const { state, currentStop } = useJourney()
  const [readyToContinue, setReadyToContinue] = useState(false)

  const waypoint = useMemo(
    () => (currentStop?.id ? getLocalWaypoint(currentStop.id) : null),
    [currentStop?.id]
  )

  const media = useMemo(
    () => resolveReconstructionMedia(currentStop, waypoint),
    [currentStop, waypoint]
  )

  const calibration = useMemo(
    () => loadCalibration(currentStop?.id),
    [currentStop?.id]
  )

  const handleContinue = useCallback(() => {
    setReadyToContinue(true)
  }, [])

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
    <>
      <AncientOverlayCamera
        stopTitle={currentStop.shortTitle ?? currentStop.title}
        stopId={currentStop.id}
        overlayUrl={media.imageUrl}
        calibration={calibration}
        onContinue={handleContinue}
      />
      <ContinueWalkingTransition open={readyToContinue} />
    </>
  )
}
