import { useCallback } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { getStoryReflectionSentence } from '../content/launchStoryReflections'
import { useJourney } from '../hooks/useJourney'
import { JOURNEY_STATES } from '../state/journeyState'
import StoryReflectionMoment from '../components/journey/StoryReflectionMoment'
import {
  ROUTES,
  arrivalPath,
  landmarkPath,
  thresholdPath,
} from '../routes/paths'

export default function StoryReflectionPage() {
  const navigate = useNavigate()
  const { state, currentStop } = useJourney()

  const handleContinue = useCallback(() => {
    navigate(landmarkPath(), { replace: true })
  }, [navigate])

  if (state !== JOURNEY_STATES.STORY) {
    if (state === JOURNEY_STATES.ARRIVED) {
      return <Navigate to={arrivalPath()} replace />
    }
    if (state === JOURNEY_STATES.THRESHOLD) {
      return <Navigate to={thresholdPath()} replace />
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
    <StoryReflectionMoment
      sentence={getStoryReflectionSentence(currentStop)}
      onContinue={handleContinue}
    />
  )
}
