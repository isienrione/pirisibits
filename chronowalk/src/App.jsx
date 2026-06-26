import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import TourMap from './components/TourMap'
import TourHud from './components/TourHud'
import WaypointCard from './components/WaypointCard'
import WaypointAssetStudio from './components/WaypointAssetStudio'
import { Button } from './components/ui'
import { JOURNEY_STATE } from './hooks/useGeoLocation'
import { useTourSession } from './hooks/useTourSession'
import { useAudioPageVisibility } from './hooks/useAudioPageVisibility'
import { useArrivalAudioPrefetch } from './hooks/useArrivalAudioPrefetch'
import { CARD_REVEAL_DELAY_MS } from './data/colosseum'
import { ROME_CORE_TOUR } from './data/rome-core-tour'
import { getWaypointGeo } from './data/waypointGeo'
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
  const tourStopLabels = useMemo(
    () => tour.stopIds.map((id) => getWaypointGeo(id)?.title ?? id).join(' → '),
    [tour.stopIds]
  )

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

  if (assetStudio) {
    return <WaypointAssetStudio waypointId={assetStudioWaypointId} />
  }

  if (!hasInteracted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-warm-white via-sand/40 to-limestone/30 px-6 pb-safe pt-safe text-center">
        {singleWaypointId ? (
          <>
            <p className="text-lg font-semibold text-deep-slate">
              Debug: {getWaypointGeo(singleWaypointId)?.title ?? singleWaypointId}
            </p>
            <p className="max-w-sm text-sm text-soft-slate">
              Single-stop test mode. Add <span className="font-medium text-deep-slate">?debugGeo=true</span> to
              fake GPS at this landmark.
            </p>
          </>
        ) : (
          <>
            <p className="font-display text-2xl font-semibold text-deep-slate">{tour.title}</p>
            <p className="text-base text-terracotta">{tour.subtitle ?? tourStopLabels}</p>
            <p className="max-w-sm text-sm text-soft-slate">
              {tour.stopIds.length} stops · {tourStopLabels}
            </p>
          </>
        )}
        <Button
          size="lg"
          className="rounded-full px-10 shadow-cta transition-transform hover:scale-[1.02]"
          onClick={async () => {
            await requestDeviceTiltPermission()
            setHasInteracted(true)
          }}
        >
          Start Immersive Tour
        </Button>
      </div>
    )
  }

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
        tourTitle={singleWaypointId ? null : tour.title}
      />

      <TourHud
        tour={singleWaypointId ? null : tour}
        progress={session.progress}
        targetStopId={session.targetStopId}
        nextWaypoint={session.nextWaypoint}
        transitLegActive={session.progress.transitLegActive}
        state={session.state}
        waypointExploreActive={Boolean(discoveredWaypoint) && !cardDismissed}
        onContinueTour={handleContinueTour}
      />

      <WaypointCard
        waypoint={activeWaypoint}
        state={session.state}
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
            style={{ bottom: 'max(5.5rem, calc(env(safe-area-inset-bottom) + 4.5rem))' }}
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
