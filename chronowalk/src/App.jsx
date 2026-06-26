import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import TourHero from './components/TourHero'
import TourMap from './components/TourMap'
import TourHud from './components/TourHud'
import WaypointCard from './components/WaypointCard'
import ArrivalMoment from './components/ArrivalMoment'
import WaypointAssetStudio from './components/WaypointAssetStudio'
import { Button } from './components/ui'
import { JOURNEY_STATE } from './hooks/useGeoLocation'
import { useTourSession } from './hooks/useTourSession'
import { useAudioPageVisibility } from './hooks/useAudioPageVisibility'
import { useArrivalAudioPrefetch } from './hooks/useArrivalAudioPrefetch'
import { CARD_REVEAL_DELAY_MS } from './data/colosseum'
import { ROME_CORE_TOUR } from './data/rome-core-tour'
import { getTourById } from './services/tourRegistry'
import { audioOrchestrator } from './audio/AudioOrchestrator'
import { requestDeviceTiltPermission } from './hooks/useDeviceTilt'
import {
  getAssetStudioWaypointId,
  getSingleWaypointId,
  getTourId,
  isAssetStudio,
} from './config/env'

function App() {
  const assetStudio = isAssetStudio()
  const tourId = useMemo(() => getTourId(), [])
  const singleWaypointId = useMemo(() => getSingleWaypointId(), [])
  const tour = useMemo(() => (tourId ? getTourById(tourId) : null) ?? ROME_CORE_TOUR, [tourId])
  const assetStudioWaypointId = getAssetStudioWaypointId()

  const [hasInteracted, setHasInteracted] = useState(false)
  const [activeWaypoint, setActiveWaypoint] = useState(null)
  const [discoveredWaypoint, setDiscoveredWaypoint] = useState(null)
  const [cardDismissed, setCardDismissed] = useState(false)
  const prevJourneyStateRef = useRef(null)
  const tourStartedRef = useRef(false)

  const session = useTourSession({
    tour: singleWaypointId ? null : tour,
    singleWaypointId,
    hasInteracted,
  })

  useAudioPageVisibility(hasInteracted)
  useArrivalAudioPrefetch({
    enabled: hasInteracted && Boolean(session.currentWaypoint),
    distance: session.distance,
    arrivalUrl: session.currentWaypoint?.arrival_immersive_url,
    prefetchRadiusM: session.prefetchRadiusM,
  })

  const revealWaypointCard = useCallback((waypoint) => {
    setDiscoveredWaypoint(waypoint)
    setCardDismissed(false)
    audioOrchestrator.playArrivalAlert(waypoint.arrival_alert_url)

    const revealTimer = window.setTimeout(() => {
      setActiveWaypoint(waypoint)
    }, CARD_REVEAL_DELAY_MS)

    return () => window.clearTimeout(revealTimer)
  }, [])

  useEffect(() => {
    if (!hasInteracted || tourStartedRef.current) return
    if (session.loading) return

    tourStartedRef.current = true
    void session.startTourAmbient()

    return () => {
      audioOrchestrator.stop()
    }
  }, [hasInteracted, session.loading, session.startTourAmbient])

  useEffect(() => {
    if (!hasInteracted || !session.currentWaypoint) return

    const justArrived =
      session.state === JOURNEY_STATE.ARRIVAL &&
      prevJourneyStateRef.current !== JOURNEY_STATE.ARRIVAL

    prevJourneyStateRef.current = session.state

    if (!justArrived) return undefined

    session.markArrived()
    return revealWaypointCard(session.currentWaypoint)
  }, [
    hasInteracted,
    session.currentWaypoint,
    session.state,
    session.markArrived,
    revealWaypointCard,
  ])

  const handleContinueTour = async () => {
    setActiveWaypoint(null)
    setCardDismissed(true)
    await session.beginTransitToNextStop()
  }

  const handleStartTour = async () => {
    await requestDeviceTiltPermission()
    setHasInteracted(true)
  }

  if (assetStudio) {
    return <WaypointAssetStudio waypointId={assetStudioWaypointId} />
  }

  if (!hasInteracted) {
    return (
      <TourHero
        tour={tour}
        singleWaypointId={singleWaypointId}
        onStartTour={handleStartTour}
      />
    )
  }

  const discoveryVisible =
    Boolean(discoveredWaypoint) && !activeWaypoint && !cardDismissed

  return (
    <div className="relative h-screen w-full">
      <TourMap
        tour={singleWaypointId ? null : tour}
        stops={session.mapStops}
        activeTargetId={session.targetStopId}
        activeLeg={session.activeLeg}
        transitLegActive={session.progress.transitLegActive}
        geofenceThresholdM={session.targetGeo?.geofenceThresholdM ?? 30}
        userPos={session.position}
        state={session.state}
        distance={session.distance}
        arrivalPulseActive={discoveryVisible}
      />

      <ArrivalMoment waypoint={discoveredWaypoint} visible={discoveryVisible} />

      <TourHud
        tour={singleWaypointId ? null : tour}
        currentStopId={session.targetStopId ?? singleWaypointId}
        progress={session.progress}
        targetStopId={session.targetStopId}
        nextWaypoint={session.nextWaypoint}
        transitLegActive={session.progress.transitLegActive}
        state={session.state}
        distance={session.distance}
        waypointExploreActive={Boolean(discoveredWaypoint) && !cardDismissed}
        onContinueTour={handleContinueTour}
      />

      <WaypointCard
        waypoint={activeWaypoint}
        state={session.state}
        isFreshArrival={
          Boolean(activeWaypoint) &&
          Boolean(discoveredWaypoint) &&
          activeWaypoint.id === discoveredWaypoint.id
        }
        onClose={() => {
          setActiveWaypoint(null)
          setCardDismissed(true)
        }}
      />

      {session.state === JOURNEY_STATE.ARRIVAL &&
        cardDismissed &&
        discoveredWaypoint &&
        !activeWaypoint && (
          <Button
            size="pill"
            className="pointer-events-auto fixed left-1/2 z-[200] -translate-x-1/2 shadow-glass-lg"
            style={{ bottom: 'max(11rem, calc(env(safe-area-inset-bottom) + 10rem))' }}
            onClick={() => {
              setCardDismissed(false)
              setActiveWaypoint(discoveredWaypoint)
            }}
          >
            Reopen {discoveredWaypoint.title}
          </Button>
        )}
    </div>
  )
}

export default App
