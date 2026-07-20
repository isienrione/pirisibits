import { useCallback } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useJourney } from '../hooks/useJourney'
import { JOURNEY_STATES } from '../state/journeyState'
import LandmarkCard from '../components/journey/LandmarkCard'
import { ROUTES, arrivalPath, storyPath, thresholdPath } from '../routes/paths'

export default function LandmarkCardPage() {
  const navigate = useNavigate()
  const { state, currentStop, setState, states } = useJourney()

  const handleBeginStory = useCallback(() => {
    navigate(storyPath(), { replace: true })
  }, [navigate])

  const handleSeeAncientRome = useCallback(() => {
    setState(states.THRESHOLD)
    navigate(thresholdPath(), { replace: true })
  }, [navigate, setState, states.THRESHOLD])

  if (state !== JOURNEY_STATES.STORY) {
    if (state === JOURNEY_STATES.ARRIVED) {
      return <Navigate to={arrivalPath()} replace />
    }
    if (state === JOURNEY_STATES.THRESHOLD) {
      return <Navigate to={thresholdPath()} replace />
    }
    return <Navigate to={ROUTES.journey} replace />
  }

  if (!currentStop) {
    return <Navigate to={ROUTES.journey} replace />
  }

  return (
    <LandmarkCard
      stop={currentStop}
      onBeginStory={handleBeginStory}
      onSeeAncientRome={handleSeeAncientRome}
    />
  )
}
