import { useCallback } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useJourney } from '../hooks/useJourney'
import { JOURNEY_STATES } from '../state/journeyState'
import JourneyArrivalMoment from '../components/journey/JourneyArrivalMoment'
import { ROUTES, landmarkPath } from '../routes/paths'

export default function JourneyArrivalPage() {
  const navigate = useNavigate()
  const { state, currentStop, setState, states } = useJourney()

  const handleContinue = useCallback(() => {
    setState(states.STORY)
    navigate(landmarkPath(), { replace: true })
  }, [navigate, setState, states.STORY])

  if (state !== JOURNEY_STATES.ARRIVED) {
    return <Navigate to={ROUTES.journey} replace />
  }

  return (
    <JourneyArrivalMoment
      stopTitle={currentStop?.shortTitle ?? currentStop?.title ?? null}
      onContinue={handleContinue}
    />
  )
}
