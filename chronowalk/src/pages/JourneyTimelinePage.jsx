import { useCallback, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { buildJourneyTimeline } from '../content/launchJourneyTimeline'
import JourneyTimelineScreen from '../components/journey/JourneyTimelineScreen'
import { useJourney } from '../hooks/useJourney'
import { JOURNEY_STATES } from '../state/journeyState'
import { readJourneyRecap } from '../utils/journeyRecapStorage'
import {
  ROUTES,
  arrivalPath,
  continueWalkingPath,
  journeySummaryPath,
  landmarkPath,
  thresholdPath,
} from '../routes/paths'

export default function JourneyTimelinePage() {
  const navigate = useNavigate()
  const { state, context, manifest } = useJourney()
  const [selectedStopId, setSelectedStopId] = useState(null)

  const recap = useMemo(() => readJourneyRecap(), [])

  const timeline = useMemo(
    () =>
      buildJourneyTimeline({
        manifest,
        context,
        recap,
      }),
    [context, manifest, recap]
  )

  const completedStopIds = useMemo(() => {
    const ids = new Set([...(context.completedStopIds ?? []), context.currentStopId].filter(Boolean))
    return [...ids]
  }, [context.completedStopIds, context.currentStopId])

  const handleBack = useCallback(() => {
    navigate(journeySummaryPath(), { replace: true })
  }, [navigate])

  const handleSelectStop = useCallback((stopId) => {
    setSelectedStopId((current) => (current === stopId ? null : stopId))
  }, [])

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
    <JourneyTimelineScreen
      intro={timeline.intro}
      routeLabel={timeline.routeLabel}
      monuments={timeline.monuments}
      moments={timeline.moments}
      manifest={manifest}
      completedStopIds={completedStopIds}
      currentStopId={context.currentStopId}
      selectedStopId={selectedStopId}
      onSelectStop={handleSelectStop}
      onBack={handleBack}
    />
  )
}
