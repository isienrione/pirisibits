import { useCallback, useMemo } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { buildJourneyMemories } from '../content/launchJourneyMemories'
import JourneyMemoriesScreen from '../components/journey/JourneyMemoriesScreen'
import { useJourney } from '../hooks/useJourney'
import { JOURNEY_STATES } from '../state/journeyState'
import { readJourneyRecap } from '../utils/journeyRecapStorage'
import {
  ROUTES,
  arrivalPath,
  continueWalkingPath,
  exploreMorePath,
  settingsPath,
  landmarkPath,
  thresholdPath,
} from '../routes/paths'

export default function JourneyMemoriesPage() {
  const navigate = useNavigate()
  const { state, context, manifest } = useJourney()

  const recap = useMemo(() => readJourneyRecap(), [])

  const archive = useMemo(
    () =>
      buildJourneyMemories({
        manifest,
        context,
        recap,
      }),
    [context, manifest, recap]
  )

  const handleBack = useCallback(() => {
    navigate(exploreMorePath(), { replace: true })
  }, [navigate])

  const handleOpenSettings = useCallback(() => {
    navigate(settingsPath())
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
    <JourneyMemoriesScreen
      title={archive.title}
      subtitle={archive.subtitle}
      places={archive.places}
      stories={archive.stories}
      photos={archive.photos}
      journal={archive.journal}
      onBack={handleBack}
      onOpenSettings={handleOpenSettings}
    />
  )
}
