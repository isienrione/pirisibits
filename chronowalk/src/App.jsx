import { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react'
import TourHero from './components/TourHero'
import TourHud from './components/TourHud'
import ArrivalMoment from './components/ArrivalMoment'
import LiveAnnouncer from './components/LiveAnnouncer'
import LocationNotice from './components/LocationNotice'
import ErrorBoundary from './components/ErrorBoundary'
import PersistentAudioBar from './components/PersistentAudioBar'
import AppNavigation from './components/navigation/AppNavigation'
import TourCompleteView from './components/TourCompleteView'
import { NAV_TABS } from './components/navigation/navConfig'
import { estimateWalkedDistanceMeters } from './utils/tourStats'
import { getModernCoverUrl } from './utils/sliderMedia'
import { getTourDirectionsOrigin } from './utils/tourDirections'
import { isAtWaypoint } from './utils/waypointProximity'
import { getWaypointGeo } from './data/waypointGeo'
import { LoadingPanel } from './components/ui'
import { ConfirmDialog } from './components/ui/ConfirmDialog'
import PwaUpdatePrompt from './components/PwaUpdatePrompt'
import { JOURNEY_STATE, LOCATION_STATUS } from './hooks/useGeoLocation'
import { useTourSession } from './hooks/useTourSession'
import { useAudioPageVisibility } from './hooks/useAudioPageVisibility'
import { useArrivalAudioPrefetch } from './hooks/useArrivalAudioPrefetch'
import { useAudioPlaybackState } from './hooks/useAudioPlaybackState'
import { useCelebrationHaptic, useLocationHaptics } from './hooks/useHapticTriggers'
import { HAPTIC_KIND, triggerHaptic } from './utils/haptics'
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

const TourMap = lazy(() => import('./components/TourMap'))
const WaypointAssetStudio = lazy(() => import('./components/WaypointAssetStudio'))
const WaypointCard = lazy(() => import('./components/WaypointCard'))
const TourOverviewView = lazy(() => import('./components/views/TourOverviewView'))
const StopsView = lazy(() => import('./components/views/StopsView'))
const SettingsView = lazy(() => import('./components/views/SettingsView'))
const DirectionsView = lazy(() => import('./components/views/DirectionsView'))

function TabLoadingFallback() {
  return <LoadingPanel label="Loading view…" className="min-h-[50vh]" />
}

function App() {
  const assetStudio = isAssetStudio()
  const tourId = useMemo(() => getTourId(), [])
  const singleWaypointId = useMemo(() => getSingleWaypointId(), [])
  const tour = useMemo(() => (tourId ? getTourById(tourId) : null) ?? ROME_CORE_TOUR, [tourId])
  const assetStudioWaypointId = getAssetStudioWaypointId()
  const [mapRetryKey, setMapRetryKey] = useState(0)
  const [mapFocusTarget, setMapFocusTarget] = useState(null)
  const [directionsDestination, setDirectionsDestination] = useState(null)
  const [directionsOrigin, setDirectionsOrigin] = useState(null)
  const [completionDismissed, setCompletionDismissed] = useState(false)
  const tourStartedAtRef = useRef(null)

  const [hasInteracted, setHasInteracted] = useState(false)
  const [activeTab, setActiveTab] = useState(NAV_TABS.MAP)
  const [activeWaypoint, setActiveWaypoint] = useState(null)
  const [discoveredWaypoint, setDiscoveredWaypoint] = useState(null)
  const [cardDismissed, setCardDismissed] = useState(false)
  const [waypointAccessMode, setWaypointAccessMode] = useState('arrival')
  const [stopOpenPrompt, setStopOpenPrompt] = useState(null)
  const [freshDiscoveryId, setFreshDiscoveryId] = useState(null)
  const [audioEnabled, setAudioEnabled] = useState(() => readAudioEnabled())
  const [debugMapEnabled, setDebugMapEnabled] = useState(() => readDebugMapPreference())
  const [audioPlayerLayout, setAudioPlayerLayout] = useState('mini')
  const [liveAnnouncement, setLiveAnnouncement] = useState('')
  const prevJourneyStateRef = useRef(null)
  const tourStartedRef = useRef(false)

  const session = useTourSession({
    tour: singleWaypointId ? null : tour,
    singleWaypointId,
    hasInteracted,
  })

  const { isTourNarrationActive } = useAudioPlaybackState()

  useEffect(() => {
    if (!isTourNarrationActive) {
      setAudioPlayerLayout('mini')
    }
  }, [isTourNarrationActive])

  useEffect(() => {
    const audioInset =
      !isTourNarrationActive
        ? '0px'
        : audioPlayerLayout === 'expanded'
          ? '15.5rem'
          : audioPlayerLayout === 'collapsed'
            ? '8.5rem'
            : '3.75rem'
    const stackInset =
      !isTourNarrationActive
        ? '5.5rem'
        : audioPlayerLayout === 'expanded'
          ? '21.25rem'
          : audioPlayerLayout === 'collapsed'
            ? '14.25rem'
            : '9.25rem'
    document.documentElement.style.setProperty('--audio-bar-inset', audioInset)
    document.documentElement.style.setProperty('--bottom-stack-inset', stackInset)
  }, [isTourNarrationActive, audioPlayerLayout])

  useAudioPageVisibility(hasInteracted)
  useArrivalAudioPrefetch({
    enabled: hasInteracted && Boolean(session.currentWaypoint) && audioEnabled,
    distance: session.distance,
    arrivalUrl: session.currentWaypoint?.arrival_immersive_url,
    prefetchRadiusM: session.prefetchRadiusM,
  })

  const revealWaypointCard = useCallback(
    (waypoint) => {
      setWaypointAccessMode('arrival')
      setFreshDiscoveryId(waypoint.id)
      setDiscoveredWaypoint(waypoint)
      setCardDismissed(false)
      setActiveTab(NAV_TABS.MAP)
      setLiveAnnouncement(
        `Waypoint discovered: ${waypoint.title}. Your story is unlocking.`
      )

      if (audioEnabled) {
        audioOrchestrator.playArrivalAlert(waypoint.arrival_alert_url)
      }

      const revealTimer = window.setTimeout(() => {
        setActiveWaypoint(waypoint)
        triggerHaptic(HAPTIC_KIND.ARRIVAL_UNLOCK)
        setLiveAnnouncement(
          `${waypoint.title} unlocked. Audio story and historical reveal are ready.`
        )
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

    triggerHaptic(HAPTIC_KIND.ARRIVAL_PULSE)
    session.markArrived()
    return revealWaypointCard(session.currentWaypoint)
  }, [
    hasInteracted,
    session.currentWaypoint,
    session.state,
    session.markArrived,
    revealWaypointCard,
  ])

  const openWaypointCard = useCallback(
    (stopId, accessMode = 'arrival') => {
      const waypoint = session.waypointsById[stopId]
      if (!waypoint) return

      const geo = getWaypointGeo(stopId)
      setWaypointAccessMode(accessMode)
      setDiscoveredWaypoint(waypoint)
      setActiveWaypoint(waypoint)
      setCardDismissed(false)
      setActiveTab(NAV_TABS.MAP)

      if (geo?.landmark) {
        setMapFocusTarget({
          lat: geo.landmark.lat,
          lng: geo.landmark.lng,
          key: Date.now(),
        })
      }

      setLiveAnnouncement(
        accessMode === 'remote'
          ? `Opened ${waypoint.title} for remote preview.`
          : `Opened ${waypoint.title}.`
      )
      triggerHaptic(HAPTIC_KIND.SELECTION)
    },
    [session.waypointsById]
  )

  const handleOpenStop = useCallback(
    (stopId) => {
      const geo = getWaypointGeo(stopId)
      const title = geo?.title ?? stopId

      if (!session.waypointsById[stopId]) return

      if (isAtWaypoint(session.position, stopId)) {
        openWaypointCard(stopId, 'arrival')
        return
      }

      const visited = session.progress.arrivedStopIds.includes(stopId)
      setStopOpenPrompt({
        stopId,
        title,
        message: visited
          ? `You're not at ${title} yet. Are you sure you want to reopen this landmark and reveal its story remotely?`
          : `You're not at ${title} yet. Are you sure you want to open this stop before arriving on foot?`,
        confirmLabel: visited ? 'Reopen anyway' : 'Open anyway',
      })
    },
    [openWaypointCard, session.position, session.progress.arrivedStopIds, session.waypointsById]
  )

  const handleConfirmStopOpen = useCallback(() => {
    if (!stopOpenPrompt?.stopId) return
    triggerHaptic(HAPTIC_KIND.SELECTION)
    openWaypointCard(stopOpenPrompt.stopId, 'remote')
    setStopOpenPrompt(null)
  }, [openWaypointCard, stopOpenPrompt])

  const handleContinueTour = async () => {
    setActiveWaypoint(null)
    setCardDismissed(true)
    await session.beginTransitToNextStop()
  }

  const handleStartTour = async () => {
    await requestDeviceTiltPermission()
    tourStartedAtRef.current = Date.now()
    void import('./components/TourMap')
    void import('./components/WaypointCard')
    setHasInteracted(true)
    setActiveTab(NAV_TABS.TOUR)
  }

  const openDirections = useCallback((landmark, title, origin = null) => {
    if (!landmark?.lat || !landmark?.lng) return

    setDirectionsDestination({
      lat: landmark.lat,
      lng: landmark.lng,
      title: title ?? 'Destination',
    })
    setDirectionsOrigin(
      origin?.lat != null && origin?.lng != null
        ? {
            lat: origin.lat,
            lng: origin.lng,
            title: origin.title ?? null,
          }
        : null
    )
    setMapFocusTarget({
      lat: landmark.lat,
      lng: landmark.lng,
      key: Date.now(),
    })
    setActiveTab(NAV_TABS.DIRECTIONS)
  }, [])

  const handleDirections = useCallback(
    (landmark, title, origin = null) => {
      openDirections(landmark, title, origin)
    },
    [openDirections]
  )

  const handleOpenExternalMaps = useCallback((url) => {
    if (!url) return
    window.open(url, '_blank', 'noopener,noreferrer')
  }, [])

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

  const handleMapRetry = useCallback(() => {
    setMapRetryKey((current) => current + 1)
  }, [])

  const locationStatus = useMemo(() => {
    if (isDebugGeo()) return LOCATION_STATUS.GRANTED
    return session.locationStatus
  }, [session.locationStatus])

  useLocationHaptics(locationStatus)

  const showLocationNotice =
    hasInteracted &&
    !isDebugGeo() &&
    locationStatus !== LOCATION_STATUS.GRANTED

  const showTourComplete =
    session.isTourComplete &&
    !completionDismissed &&
    !activeWaypoint &&
    cardDismissed

  useCelebrationHaptic(showTourComplete)

  const walkedMeters = useMemo(
    () => estimateWalkedDistanceMeters(tour, session.progress.arrivedStopIds),
    [tour, session.progress.arrivedStopIds]
  )

  const audioWaypoint = activeWaypoint ?? discoveredWaypoint ?? session.currentWaypoint
  const audioPosterUrl = audioWaypoint ? getModernCoverUrl(audioWaypoint) : null
  const cardIsOpen = Boolean(activeWaypoint)

  const handleToggleTourAudio = useCallback(async () => {
    const wasPlaying = audioOrchestrator.isTourNarrationPlaying()
    await audioOrchestrator.toggleTourNarration()
    if (!wasPlaying && audioOrchestrator.isTourNarrationPlaying()) {
      triggerHaptic(HAPTIC_KIND.AUDIO_PLAY)
    }
  }, [])

  const handleStopTourAudio = useCallback(() => {
    audioOrchestrator.stop()
  }, [])

  const handleReopenWaypoint = useCallback(() => {
    if (!discoveredWaypoint) return
    handleOpenStop(discoveredWaypoint.id)
  }, [discoveredWaypoint, handleOpenStop])

  if (assetStudio) {
    return (
      <ErrorBoundary
        fullScreen
        title="Asset studio unavailable"
        message="The creator studio could not load. Check the console and reload the page."
      >
        <Suspense fallback={<LoadingPanel label="Loading asset studio…" fullScreen />}>
          <WaypointAssetStudio waypointId={assetStudioWaypointId} />
        </Suspense>
      </ErrorBoundary>
    )
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
      <a
        href="#main-tour-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[500] focus:rounded-xl focus:bg-warm-white focus:px-4 focus:py-2 focus:shadow-glass-lg"
      >
        Skip to tour content
      </a>
      <LiveAnnouncer message={liveAnnouncement} />

      <div
        id="main-tour-content"
        className={mapTabActive ? 'relative h-full w-full' : 'hidden'}
        aria-hidden={!mapTabActive}
      >
        <ErrorBoundary
          key={mapRetryKey}
          fullScreen
          title="Map unavailable"
          message="The walking map failed to load. Check your connection and Mapbox token, then try again."
          onRetry={handleMapRetry}
        >
          <Suspense
            fallback={
              <LoadingPanel
                label="Loading map…"
                hint="Fetching Mapbox and tour route layers"
                fullScreen
              />
            }
          >
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
              focusTarget={mapFocusTarget}
            />
          </Suspense>
        </ErrorBoundary>

        <ArrivalMoment waypoint={discoveredWaypoint} visible={discoveryVisible} />

        <TourHud
          tour={singleWaypointId ? null : tour}
          currentStopId={session.targetStopId ?? singleWaypointId}
          progress={session.progress}
          targetStopId={session.targetStopId}
          nextWaypoint={session.nextWaypoint}
          currentWaypoint={session.currentWaypoint}
          transitLegActive={session.progress.transitLegActive}
          state={session.state}
          distance={session.distance}
          locationStatus={locationStatus}
          waypointExploreActive={Boolean(discoveredWaypoint) && !cardDismissed}
          awaitingFirstStop={session.isAwaitingFirstStop}
          firstStopTitle={session.firstStopTitle}
          dismissedWaypointTitle={
            cardDismissed && discoveredWaypoint && !activeWaypoint
              ? discoveredWaypoint.title
              : null
          }
          onReopenWaypoint={handleReopenWaypoint}
          onContinueTour={handleContinueTour}
          onDirections={handleDirections}
          hasBottomNav
        />

        {showLocationNotice && mapTabActive ? (
          <div className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+5.5rem)] z-[42] px-4">
            <div className="pointer-events-auto mx-auto max-w-md">
              <LocationNotice
                status={locationStatus}
                onRetry={session.retryLocation}
                compact={locationStatus === LOCATION_STATUS.WAITING}
              />
            </div>
          </div>
        ) : null}
      </div>

      {activeTab === NAV_TABS.TOUR ? (
        <Suspense fallback={<TabLoadingFallback />}>
          <TourOverviewView
            tour={singleWaypointId ? null : tour}
            progress={session.progress}
            mapStops={session.mapStops}
            waypointsById={session.waypointsById}
            targetStopId={session.targetStopId}
            nextWaypoint={session.nextWaypoint}
            state={session.state}
            distance={session.distance}
            transitLegActive={session.progress.transitLegActive}
            isAwaitingFirstStop={session.isAwaitingFirstStop}
            firstStopTitle={session.firstStopTitle}
            onNavigate={setActiveTab}
            onOpenStop={handleOpenStop}
            onGetDirections={() => {
              if (!tour?.stopIds?.[0]) return
              const landmark = getWaypointGeo(tour.stopIds[0])?.landmark
              openDirections(landmark, session.firstStopTitle)
            }}
          />
        </Suspense>
      ) : null}

      {activeTab === NAV_TABS.STOPS ? (
        <Suspense fallback={<TabLoadingFallback />}>
          <StopsView
            tour={singleWaypointId ? null : tour}
            mapStops={session.mapStops}
            waypointsById={session.waypointsById}
            onOpenStop={handleOpenStop}
            onNavigate={() => setActiveTab(NAV_TABS.MAP)}
          />
        </Suspense>
      ) : null}

      {activeTab === NAV_TABS.DIRECTIONS && directionsDestination ? (
        <Suspense fallback={<TabLoadingFallback />}>
          <DirectionsView
            destination={directionsDestination}
            origin={directionsOrigin}
            userPosition={session.position}
            locationStatus={locationStatus}
            onBack={() => setActiveTab(NAV_TABS.MAP)}
            onOpenExternalMaps={handleOpenExternalMaps}
          />
        </Suspense>
      ) : null}

      {activeTab === NAV_TABS.SETTINGS ? (
        <Suspense fallback={<TabLoadingFallback />}>
          <SettingsView
            locationStatus={locationStatus}
            journeyState={session.state}
            distance={session.distance}
            audioEnabled={audioEnabled}
            onAudioEnabledChange={handleAudioEnabledChange}
            debugMapEnabled={debugMapEnabled}
            onDebugMapEnabledChange={handleDebugMapEnabledChange}
            onRetryLocation={session.retryLocation}
          />
        </Suspense>
      ) : null}

      <ErrorBoundary
        title="Landmark card unavailable"
        message="The arrival card could not load. Try reopening the stop from the map."
      >
        <Suspense fallback={null}>
          <WaypointCard
            waypoint={activeWaypoint}
            state={session.state}
            accessMode={waypointAccessMode}
            isFreshArrival={activeWaypoint?.id === freshDiscoveryId && waypointAccessMode === 'arrival'}
            onClose={() => {
              setActiveWaypoint(null)
              setCardDismissed(true)
              setWaypointAccessMode('arrival')
            }}
          />
        </Suspense>
      </ErrorBoundary>

      <AppNavigation
        activeTab={activeTab}
        onChange={setActiveTab}
        audioSlot={
          isTourNarrationActive ? (
            <PersistentAudioBar
              title={audioWaypoint?.title}
              subtitle={audioWaypoint?.arrival_subtitle}
              posterUrl={audioPosterUrl}
              cardOpen={cardIsOpen}
              onReopenCard={
                cardDismissed && discoveredWaypoint && !activeWaypoint ? handleReopenWaypoint : null
              }
              onTogglePlayback={handleToggleTourAudio}
              onStop={handleStopTourAudio}
              onLayoutChange={setAudioPlayerLayout}
            />
          ) : null
        }
      />

      {showTourComplete ? (
        <TourCompleteView
          tour={singleWaypointId ? null : tour}
          visitedCount={session.progress.arrivedStopIds.length}
          walkedMeters={walkedMeters}
          startedAtMs={tourStartedAtRef.current}
          onViewSummary={() => {
            setCompletionDismissed(true)
            setActiveTab(NAV_TABS.TOUR)
          }}
          onDismiss={() => setCompletionDismissed(true)}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(stopOpenPrompt)}
        title={`Open ${stopOpenPrompt?.title ?? 'landmark'}?`}
        message={stopOpenPrompt?.message ?? ''}
        confirmLabel={stopOpenPrompt?.confirmLabel ?? 'Open anyway'}
        onConfirm={handleConfirmStopOpen}
        onCancel={() => setStopOpenPrompt(null)}
      />

      <PwaUpdatePrompt />
    </div>
  )
}

export default App
