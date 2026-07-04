import { useCallback, useMemo } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { buildRomePassport } from '../content/launchRomePassport'
import RomePassportScreen from '../components/journey/RomePassportScreen'
import { useJourney } from '../hooks/useJourney'
import { JOURNEY_STATES } from '../state/journeyState'
import { readTravelerName } from '../utils/travelerProfile'
import {
  ROUTES,
  arrivalPath,
  continueWalkingPath,
  exploreMorePath,
  journeyTimelinePath,
  landmarkPath,
  thresholdPath,
} from '../routes/paths'

export default function RomePassportPage() {
  const navigate = useNavigate()
  const { state, context, manifest } = useJourney()

  const passport = useMemo(
    () =>
      buildRomePassport({
        travelerName: readTravelerName(),
        manifest,
        context,
      }),
    [context, manifest]
  )

  const handleBack = useCallback(() => {
    navigate(journeyTimelinePath(), { replace: true })
  }, [navigate])

  const handleExploreMore = useCallback(() => {
    navigate(exploreMorePath(), { replace: true })
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
    <RomePassportScreen
      title={passport.title}
      subtitle={passport.subtitle}
      holderName={passport.holderName}
      edition={passport.edition}
      stamps={passport.stamps}
      onBack={handleBack}
      onExploreMore={handleExploreMore}
    />
  )
}
