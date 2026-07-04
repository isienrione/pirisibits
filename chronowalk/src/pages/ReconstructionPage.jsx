import { useCallback, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import AncientReconstructionExplorer from '../components/journey/AncientReconstructionExplorer'
import ContinueWalkingTransition from '../components/journey/ContinueWalkingTransition'
import { getReconstructionScene } from '../content/reconstructionHotspots'
import { useJourney } from '../hooks/useJourney'
import { getLocalWaypoint } from '../services/waypointMerge'
import { JOURNEY_STATES } from '../state/journeyState'
import { resolveReconstructionMedia } from '../utils/reconstructionMedia'
import { ROUTES, arrivalPath, landmarkPath } from '../routes/paths'

export default function ReconstructionPage() {
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

  const scene = useMemo(
    () => getReconstructionScene(currentStop, media.imageUrl),
    [currentStop, media.imageUrl]
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
      <AncientReconstructionExplorer
        stopTitle={currentStop.shortTitle ?? currentStop.title}
        imageUrl={scene.imageUrl}
        hotspots={scene.hotspots}
        onContinue={handleContinue}
      />
      <ContinueWalkingTransition open={readyToContinue} />
    </>
  )
}
