import { useCallback, useMemo } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { getExploreMoreContent } from '../content/launchExploreMore'
import ExploreMoreScreen from '../components/journey/ExploreMoreScreen'
import { useJourney } from '../hooks/useJourney'
import { JOURNEY_STATES } from '../state/journeyState'
import {
  ROUTES,
  arrivalPath,
  continueWalkingPath,
  exploreMorePath,
  journeyMemoriesPath,
  landmarkPath,
  romePassportPath,
  thresholdPath,
} from '../routes/paths'

export default function ExploreMorePage() {
  const navigate = useNavigate()
  const { state } = useJourney()

  const content = useMemo(() => getExploreMoreContent(), [])

  const handleBack = useCallback(() => {
    navigate(romePassportPath(), { replace: true })
  }, [navigate])

  const handleReturnHome = useCallback(() => {
    navigate(ROUTES.home, { replace: true })
  }, [navigate])

  const handleViewMemories = useCallback(() => {
    navigate(journeyMemoriesPath(), { replace: true })
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
    <ExploreMoreScreen
      title={content.title}
      subtitle={content.subtitle}
      journeys={content.journeys}
      onBack={handleBack}
      onReturnHome={handleReturnHome}
      onViewMemories={handleViewMemories}
    />
  )
}
