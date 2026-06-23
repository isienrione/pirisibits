import { useCallback, useEffect, useRef, useState } from 'react'
import TourMap from './components/TourMap'
import WaypointCard from './components/WaypointCard'
import { useGeoLocation, JOURNEY_STATE } from './hooks/useGeoLocation'
import { fetchWaypointById, getWaypointAudioUrls } from './services/waypointService'
import { GEOFENCE_ARRIVAL_THRESHOLD_M } from './data/colosseum'
import { audioOrchestrator, AUDIO_MODES } from './audio/AudioOrchestrator'

function App() {
  const [hasInteracted, setHasInteracted] = useState(false)
  const { position, state, distance } = useGeoLocation({
    geofenceThresholdM: GEOFENCE_ARRIVAL_THRESHOLD_M,
  })
  const [activeWaypoint, setActiveWaypoint] = useState(null)
  const [discoveredWaypoint, setDiscoveredWaypoint] = useState(null)
  const waypointDataRef = useRef(null)
  const lastAudioStateRef = useRef(null)

  const handleArrival = useCallback(async (waypoint) => {
    const audioUrls = getWaypointAudioUrls(waypoint)
    await audioOrchestrator.transitionTo(AUDIO_MODES.ARRIVAL, audioUrls)
    setDiscoveredWaypoint(waypoint)
    setActiveWaypoint(waypoint)
  }, [])

  useEffect(() => {
    if (!hasInteracted) return

    let cancelled = false

    fetchWaypointById('colosseum')
      .then((waypoint) => {
        if (cancelled) return
        waypointDataRef.current = waypoint
        lastAudioStateRef.current = AUDIO_MODES.AMBIENT
        return audioOrchestrator.transitionTo(
          AUDIO_MODES.AMBIENT,
          getWaypointAudioUrls(waypoint)
        )
      })
      .catch((err) => console.error('Failed to load waypoint data:', err))

    return () => {
      cancelled = true
      audioOrchestrator.stop()
      lastAudioStateRef.current = null
    }
  }, [hasInteracted])

  useEffect(() => {
    if (!hasInteracted || !waypointDataRef.current) return

    if (state === JOURNEY_STATE.ARRIVAL) {
      if (lastAudioStateRef.current === AUDIO_MODES.ARRIVAL) return
      lastAudioStateRef.current = AUDIO_MODES.ARRIVAL
      handleArrival(waypointDataRef.current)
      return
    }

    if (state === JOURNEY_STATE.TRANSIT) {
      if (lastAudioStateRef.current === AUDIO_MODES.TRANSIT) return
      lastAudioStateRef.current = AUDIO_MODES.TRANSIT
      audioOrchestrator.transitionTo(
        AUDIO_MODES.TRANSIT,
        getWaypointAudioUrls(waypointDataRef.current)
      )
    }
  }, [hasInteracted, state, handleArrival])

  if (!hasInteracted) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <button
          type="button"
          onClick={() => setHasInteracted(true)}
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
        onClose={() => setActiveWaypoint(null)}
      />
      {state === JOURNEY_STATE.ARRIVAL &&
        discoveredWaypoint &&
        !activeWaypoint && (
          <button
            type="button"
            onClick={() => setActiveWaypoint(discoveredWaypoint)}
            className="absolute bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700"
          >
            Reopen {discoveredWaypoint.title}
          </button>
        )}
    </div>
  )
}

export default App
