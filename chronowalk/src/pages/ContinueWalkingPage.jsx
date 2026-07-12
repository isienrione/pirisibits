import { Navigate } from 'react-router-dom'
import ContinueWalkingScreen from '../components/journey/ContinueWalkingScreen'
import { useJourney } from '../hooks/useJourney'
import { JOURNEY_STATES } from '../state/journeyState'
import { ROUTES, arrivalPath, landmarkPath } from '../routes/paths'

export default function ContinueWalkingPage() {
  const {
    state,
    manifest,
    currentStop,
    nextStop,
    distanceToNextM,
    isLastStop,
    continueWalking,
  } = useJourney()

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

  if (!currentStop || !manifest) {
    return <Navigate to={landmarkPath()} replace />
  }

  return (
    <ContinueWalkingScreen
      destination={isLastStop ? currentStop : nextStop}
      heroImage={isLastStop ? currentStop.heroImage : nextStop?.heroImage}
      distanceMeters={isLastStop ? null : distanceToNextM}
      stopNumber={currentStop.number}
      totalStops={manifest.stops.length}
      isLastStop={isLastStop}
      onContinue={continueWalking}
    />
  )
}
