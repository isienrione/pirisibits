import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import TourMap from './components/TourMap'
import WaypointCard from './components/WaypointCard'
import WaypointAssetStudio from './components/WaypointAssetStudio'
import { useGeoLocation, JOURNEY_STATE } from './hooks/useGeoLocation'
import { useAudioPageVisibility } from './hooks/useAudioPageVisibility'
import { useArrivalAudioPrefetch } from './hooks/useArrivalAudioPrefetch'
import { fetchWaypointById } from './services/waypointService'
import {
  ARRIVAL_AUDIO_PREFETCH_RADIUS_M,
  CARD_REVEAL_DELAY_MS,
  COLOSSEUM,
  DEBUG_USER_POS,
  GEOFENCE_ARRIVAL_THRESHOLD_M,
} from './data/colosseum'
import {
  PANTHEON,
  PANTHEON_DEBUG_USER_POS,
  PANTHEON_GEOFENCE_ARRIVAL_THRESHOLD_M,
} from './data/pantheon'
import { audioOrchestrator } from './audio/AudioOrchestrator'
import { requestDeviceTiltPermission } from './hooks/useDeviceTilt'
import { getTourWaypointId, isAssetStudio } from './config/env'

const TOUR_GEO = {
  colosseum: {
    target: COLOSSEUM,
    debugPosition: DEBUG_USER_POS,
    geofenceThresholdM: GEOFENCE_ARRIVAL_THRESHOLD_M,
  },
  pantheon: {
    target: PANTHEON,
    debugPosition: PANTHEON_DEBUG_USER_POS,
    geofenceThresholdM: PANTHEON_GEOFENCE_ARRIVAL_THRESHOLD_M,
  },
}

function App() {
  const assetStudio = isAssetStudio()
  const tourWaypointId = useMemo(() => getTourWaypointId(), [])
  const tourGeo = TOUR_GEO[tourWaypointId] ?? TOUR_GEO.colosseum
  const assetStudioWaypointId = tourWaypointId
  const [hasInteracted, setHasInteracted] = useState(false)
  const { position, state, distance } = useGeoLocation({
    target: tourGeo.target,
    debugPosition: tourGeo.debugPosition,
    geofenceThresholdM: tourGeo.geofenceThresholdM,
  })
  const [activeWaypoint, setActiveWaypoint] = useState(null)
  const [discoveredWaypoint, setDiscoveredWaypoint] = useState(null)
  const [waypointData, setWaypointData] = useState(null)
  const [cardDismissed, setCardDismissed] = useState(false)
  const prevJourneyStateRef = useRef(null)

  useAudioPageVisibility(hasInteracted)
  useArrivalAudioPrefetch({
    enabled: hasInteracted && Boolean(waypointData),
    distance,
    arrivalUrl: waypointData?.arrival_immersive_url,
    prefetchRadiusM: ARRIVAL_AUDIO_PREFETCH_RADIUS_M,
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
    if (!hasInteracted) return

    let cancelled = false

    fetchWaypointById(tourWaypointId)
      .then((waypoint) => {
        if (!cancelled) setWaypointData(waypoint)
      })
      .catch((err) => console.error('Failed to load waypoint data:', err))

    return () => {
      cancelled = true
      audioOrchestrator.stop()
    }
  }, [hasInteracted, tourWaypointId])

  useEffect(() => {
    if (!hasInteracted || !waypointData) return

    const justArrived =
      state === JOURNEY_STATE.ARRIVAL &&
      prevJourneyStateRef.current !== JOURNEY_STATE.ARRIVAL

    prevJourneyStateRef.current = state

    if (!justArrived) return undefined

    return revealWaypointCard(waypointData)
  }, [hasInteracted, waypointData, state, revealWaypointCard])

  if (assetStudio) {
    return <WaypointAssetStudio waypointId={assetStudioWaypointId} />
  }

  if (!hasInteracted) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <button
          type="button"
          onClick={async () => {
            await requestDeviceTiltPermission()
            setHasInteracted(true)
          }}
          className="rounded-full bg-blue-600 px-8 py-4 text-xl font-bold text-white shadow-lg transition-transform hover:scale-105"
        >
          Start Immersive Tour
        </button>
      </div>
    )
  }

  return (
    <div className="relative h-screen w-full">
      <TourMap userPos={position} state={state} distance={distance} />
      <WaypointCard
        waypoint={activeWaypoint}
        state={state}
        onClose={() => {
          setActiveWaypoint(null)
          setCardDismissed(true)
        }}
      />
      {state === JOURNEY_STATE.ARRIVAL && cardDismissed && discoveredWaypoint && !activeWaypoint && (
        <button
          type="button"
          onClick={() => {
            setCardDismissed(false)
            setActiveWaypoint(discoveredWaypoint)
          }}
          className="pointer-events-auto fixed left-1/2 z-[200] -translate-x-1/2 rounded-full bg-amber-500 px-6 py-3.5 text-sm font-bold text-gray-900 shadow-[0_8px_30px_rgba(0,0,0,0.45)] transition hover:bg-amber-400"
          style={{ bottom: 'max(5.5rem, calc(env(safe-area-inset-bottom) + 4.5rem))' }}
        >
          Reopen {discoveredWaypoint.title}
        </button>
      )}
    </div>
  )
}

export default App
