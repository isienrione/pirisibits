import { useCallback, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import ContinueWalkingTransition from '../components/journey/ContinueWalkingTransition'
import ThresholdReveal from '../components/journey/ThresholdReveal'
import { useJourney } from '../hooks/useJourney'
import { getLocalWaypoint } from '../services/waypointMerge'
import { JOURNEY_STATES } from '../state/journeyState'
import { resolveThresholdMedia } from '../utils/thresholdMedia'
import { ROUTES, arrivalPath, landmarkPath } from '../routes/paths'

export default function ThresholdPage() {
  const { state, currentStop } = useJourney()
  const [revealComplete, setRevealComplete] = useState(false)

  const waypoint = useMemo(
    () => (currentStop?.id ? getLocalWaypoint(currentStop.id) : null),
    [currentStop?.id]
  )

  const media = useMemo(
    () => resolveThresholdMedia(currentStop, waypoint),
    [currentStop, waypoint]
  )

  const handleRevealComplete = useCallback(() => {
    setRevealComplete(true)
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
      <ThresholdReveal
        stopTitle={currentStop.shortTitle ?? currentStop.title}
        modernUrl={media.modernUrl}
        ancientUrl={media.ancientUrl}
        onRevealComplete={handleRevealComplete}
      />
      <ContinueWalkingTransition open={revealComplete} />
    </>
  )
}
