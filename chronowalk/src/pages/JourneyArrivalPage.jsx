import { useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { useJourney } from '../hooks/useJourney'
import { JOURNEY_STATES } from '../state/journeyState'
import JourneyArrivalMoment from '../components/journey/JourneyArrivalMoment'
import { ROUTES } from '../routes/paths'

export default function JourneyArrivalPage() {
  const { state, currentStop, setState, states } = useJourney()

  const handleContinue = useCallback(() => {
    setState(states.STORY)
  }, [setState, states.STORY])

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
