import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import TourHero from './components/TourHero'
import TourMap from './components/TourMap'
import TourHud from './components/TourHud'
import WaypointCard from './components/WaypointCard'
import ArrivalMoment from './components/ArrivalMoment'
import WaypointAssetStudio from './components/WaypointAssetStudio'
import AppNavigation from './components/navigation/AppNavigation'
import { NAV_TABS } from './components/navigation/navConfig'
import TourOverviewView from './components/views/TourOverviewView'
import StopsView from './components/views/StopsView'
import SettingsView from './components/views/SettingsView'
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
  readAudioEnabled,
  readDebugMapPreference,
  writeAudioEnabled,
  writeDebugMapPreference,
} from './utils/appPreferences'
import { isDebugGeo } from './config/env'
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
  const [activeTab, setActiveTab] = useState(NAV_TABS.MAP)
  const [activeWaypoint, setActiveWaypoint] = useState(null)
  const [discoveredWaypoint, setDiscoveredWaypoint] = useState(null)
  const [cardDismissed, setCardDismissed] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(() => readAudioEnabled())
  const [debugMapEnabled, setDebugMapEnabled] = useState(() => readDebugMapPreference())
  const prevJourneyStateRef = useRef(null)
  const tourStartedRef = useRef(false)

  const session = useTourSession({
    tour: singleWaypointId ? null : tour,
    singleWaypointId,
    hasInteracted,
  })

  useAudioPageVisibility(hasInteracted)
  useArrivalAudioPrefetch({
    enabled: hasInteracted && Boolean(session.currentWaypoint) && audioEnabled,
    distance: session.distance,
    arrivalUrl: session.currentWaypoint?.arrival_immersive_url,
    prefetchRadiusM: session.prefetchRadiusM,
  })

  const revealWaypointCard = useCallback(
    (waypoint) => {
      setDiscoveredWaypoint(waypoint)
      setCardDismissed(false)
      setActiveTab(NAV_TABS.MAP)

      if (audioEnabled) {
        audioOrchestrator.playArrivalAlert(waypoint.arrival_alert_url)
      }

      const revealTimer = window.setTimeout(() => {
        setActiveWaypoint(waypoint)
      }, CARD_REVEAL_DELAY_MS)

      return () => window.clearTimeout(revealTimer)
    },
    [audioEnabled]
  )

  useEffect(() => {
    if (!hasInteracted || tourStartedRef.current) return
    if (session.loading) return
    if (!audioEnabled) {
      tourStartedRef.current = true
      return
    }

    tourStartedRef.current = true
    void session.startTourAmbient()

    return () => {
      audioOrchestrator.stop()
    }
  }, [hasInteracted, session.loading, session.startTourAmbient, audioEnabled])

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
    setActiveTab(NAV_TABS.MAP)
  }

  const handleAudioEnabledChange = (enabled) => {
    setAudioEnabled(enabled)
    writeAudioEnabled(enabled)
    if (!enabled) {
      audioOrchestrator.stop()
    } else if (hasInteracted && !tourStartedRef.current) {
      tourStartedRef.current = true
      void session.startTourAmbient()
    }
  }

  const handleDebugMapEnabledChange = (enabled) => {
    setDebugMapEnabled(enabled)
    writeDebugMapPreference(enabled)
  }

  const locationStatus = useMemo(() => {
    if (isDebugGeo()) return 'granted'
    if (session.position?.lat != null && session.position?.lng != null) return 'granted'
    return 'waiting'
  }, [session.position?.lat, session.position?.lng])

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
  const mapTabActive = activeTab === NAV_TABS.MAP

  return (
    <div className="relative h-screen w-full bg-warm-white lg:pl-[5.5rem]">
      <div className={mapTabActive ? 'relative h-full w-full' : 'hidden'} aria-hidden={!mapTabActive}>
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
          debugMapEnabled={debugMapEnabled}
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
          hasBottomNav
        />
      </div>

      {activeTab === NAV_TABS.TOUR ? (
        <TourOverviewView
          tour={singleWaypointId ? null : tour}
          progress={session.progress}
          targetStopId={session.targetStopId}
          nextWaypoint={session.nextWaypoint}
          state={session.state}
          distance={session.distance}
          transitLegActive={session.progress.transitLegActive}
          onNavigate={setActiveTab}
        />
      ) : null}

      {activeTab === NAV_TABS.STOPS ? (
        <StopsView
          tour={singleWaypointId ? null : tour}
          mapStops={session.mapStops}
          waypointsById={session.waypointsById}
          onNavigate={setActiveTab}
        />
      ) : null}

      {activeTab === NAV_TABS.SETTINGS ? (
        <SettingsView
          locationStatus={locationStatus}
          journeyState={session.state}
          distance={session.distance}
          audioEnabled={audioEnabled}
          onAudioEnabledChange={handleAudioEnabledChange}
          debugMapEnabled={debugMapEnabled}
          onDebugMapEnabledChange={handleDebugMapEnabledChange}
        />
      ) : null}

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
        !activeWaypoint &&
        mapTabActive && (
          <Button
            size="pill"
            className="pointer-events-auto fixed left-1/2 z-[200] -translate-x-1/2 shadow-glass-lg lg:left-[calc(50%+2.75rem)]"
            style={{ bottom: 'max(14rem, calc(env(safe-area-inset-bottom) + 12rem))' }}
            onClick={() => {
              setCardDismissed(false)
              setActiveWaypoint(discoveredWaypoint)
            }}
          >
            Reopen {discoveredWaypoint.title}
          </Button>
        )}

      <AppNavigation activeTab={activeTab} onChange={setActiveTab} />
    </div>
  )
}

export default App
