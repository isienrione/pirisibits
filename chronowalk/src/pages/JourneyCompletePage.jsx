import { useCallback } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { getJourneyCompleteMoment } from '../content/launchJourneyComplete'
import JourneyCompleteMoment from '../components/journey/JourneyCompleteMoment'
import { useJourney } from '../hooks/useJourney'
import { JOURNEY_STATES } from '../state/journeyState'
import {
  ROUTES,
  arrivalPath,
  continueWalkingPath,
  journeySummaryPath,
  landmarkPath,
  thresholdPath,
} from '../routes/paths'

export default function JourneyCompletePage() {
  const navigate = useNavigate()
  const { state, manifest } = useJourney()
  const moment = getJourneyCompleteMoment(manifest)

  const handleViewSummary = useCallback(() => {
    navigate(journeySummaryPath(), { replace: true })
  }, [navigate])

  if (state !== JOURNEY_STATES.COMPLETE) {
    if (state === JOURNEY_STATES.THRESHOLD) {
      return <Navigate to={continueWalkingPath()} replace />
    }
    if (state === JOURNEY_STATES.STORY) {
      return <Navigate to={landmarkPath()} replace />
    }
    if (state === JOURNEY_STATES.ARRIVED) {
      return <Navigate to={arrivalPath()} replace />
    }
    if ([JOURNEY_STATES.WALKING, JOURNEY_STATES.APPROACHING].includes(state)) {
      return <Navigate to={ROUTES.journey} replace />
    }
    return <Navigate to={ROUTES.home} replace />
  }

  return (
    <JourneyCompleteMoment
      headline={moment.headline}
      subline={moment.subline}
      heroImage={moment.heroImage}
      onViewSummary={handleViewSummary}
    />
  )
}
