import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { LOCATION_STATUS, useGeoLocation } from '../hooks/useGeoLocation'
import { useJourneyGeoSync } from '../hooks/useJourneyGeoSync'
import { JOURNEY_STATES } from '../state/journeyState'
import { useJourney } from '../hooks/useJourney'
import JourneyLaunchMap from '../components/journey/JourneyLaunchMap'
import JourneyBottomCard from '../components/journey/JourneyBottomCard'
import JourneyArrivalOverlay from '../components/journey/JourneyArrivalOverlay'
import StoryPlayer from '../components/journey/StoryPlayer'
import ThresholdReveal from '../components/journey/ThresholdReveal'
import ContinueWalkingTransition from '../components/journey/ContinueWalkingTransition'
import { ROUTES } from '../routes/paths'

export default function JourneyMapPage() {
  const { state, context, currentStop, setState, states } = useJourney()
  const [thresholdRevealed, setThresholdRevealed] = useState(false)

  const target = currentStop?.coords
  const { position, state: geoState, distance, locationStatus } = useGeoLocation({
    target,
    geofenceThresholdM: currentStop?.radiusM ?? 30,
  })

  useJourneyGeoSync({ geoState, distance, enabled: Boolean(currentStop) })

  useEffect(() => {
    if (state !== JOURNEY_STATES.THRESHOLD) {
      setThresholdRevealed(false)
    }
  }, [state, currentStop?.id])

  const handleOpenStory = useCallback(() => {
    setState(states.STORY)
  }, [setState, states.STORY])

  const handleSimulateArrival = useCallback(() => {
    setState(states.ARRIVED)
  }, [setState, states.ARRIVED])

  const handleRevealComplete = useCallback(() => {
    setThresholdRevealed(true)
  }, [])

  if (!currentStop && state === JOURNEY_STATES.IDLE) {
    return <Navigate to={ROUTES.begin} replace />
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-obsidian">
      <JourneyLaunchMap
        currentStopId={context.currentStopId}
        completedStopIds={context.completedStopIds}
        userPos={locationStatus === LOCATION_STATUS.GRANTED ? position : null}
      />

      <JourneyBottomCard
        onSimulateArrival={handleSimulateArrival}
        onOpenStory={handleOpenStory}
      />
      <JourneyArrivalOverlay onOpenStory={handleOpenStory} />
      <StoryPlayer />
      <ThresholdReveal onRevealComplete={handleRevealComplete} />
      <ContinueWalkingTransition open={thresholdRevealed} />
    </div>
  )
}
