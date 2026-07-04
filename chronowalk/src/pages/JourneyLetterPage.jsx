import { useCallback, useMemo } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { buildJourneyLetter } from '../content/launchJourneyLetter'
import JourneyLetter from '../components/journey/JourneyLetter'
import { useJourney } from '../hooks/useJourney'
import { JOURNEY_STATES } from '../state/journeyState'
import { readTravelerName } from '../utils/travelerProfile'
import {
  ROUTES,
  arrivalPath,
  continueWalkingPath,
  journeyTimelinePath,
  landmarkPath,
  thresholdPath,
} from '../routes/paths'

export default function JourneyLetterPage() {
  const navigate = useNavigate()
  const { state, context, manifest } = useJourney()

  const letter = useMemo(
    () =>
      buildJourneyLetter({
        travelerName: readTravelerName(),
        manifest,
        context,
      }),
    [context, manifest]
  )

  const handleReturnHome = useCallback(() => {
    navigate(ROUTES.home, { replace: true })
  }, [navigate])

  const handleViewTimeline = useCallback(() => {
    navigate(journeyTimelinePath(), { replace: true })
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
    <JourneyLetter
      salutation={letter.salutation}
      paragraphs={letter.paragraphs}
      signOff={letter.signOff}
      signature={letter.signature}
      onViewTimeline={handleViewTimeline}
      onReturnHome={handleReturnHome}
    />
  )
}
