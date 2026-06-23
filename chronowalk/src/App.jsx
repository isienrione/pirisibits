import { useCallback, useEffect, useState } from 'react'
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
  const [waypointData, setWaypointData] = useState(null)

  const handleArrival = useCallback(async (waypoint) => {
    setDiscoveredWaypoint(waypoint)
    setActiveWaypoint(waypoint)

    try {
      await audioOrchestrator.transitionTo(
        AUDIO_MODES.ARRIVAL,
        getWaypointAudioUrls(waypoint)
      )
    } catch (err) {
      console.error('Failed to play arrival audio:', err)
    }
  }, [])

  useEffect(() => {
    if (!hasInteracted) return

    let cancelled = false

    fetchWaypointById('colosseum')
      .then((waypoint) => {
        if (!cancelled) setWaypointData(waypoint)
      })
      .catch((err) => console.error('Failed to load waypoint data:', err))

    return () => {
      cancelled = true
      audioOrchestrator.stop()
    }
  }, [hasInteracted])

  useEffect(() => {
    if (!hasInteracted || !waypointData) return

    if (state === JOURNEY_STATE.ARRIVAL) {
      handleArrival(waypointData)
      return
    }

    if (state === JOURNEY_STATE.TRANSIT) {
      audioOrchestrator.transitionTo(
        AUDIO_MODES.TRANSIT,
        getWaypointAudioUrls(waypointData)
      )
      return
    }

    audioOrchestrator.transitionTo(
      AUDIO_MODES.AMBIENT,
      getWaypointAudioUrls(waypointData)
    )
  }, [hasInteracted, waypointData, state, handleArrival])

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
