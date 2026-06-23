import { useEffect, useRef, useState } from 'react'
import TourMap from './components/TourMap'
import WaypointCard from './components/WaypointCard'
import { useGeoLocation, JOURNEY_STATE } from './hooks/useGeoLocation'
import { fetchWaypointById } from './services/waypointService'
import { GEOFENCE_ARRIVAL_THRESHOLD_M } from './data/colosseum'
import { audioOrchestrator, AUDIO_MODES } from './audio/AudioOrchestrator'

function App() {
  const [hasInteracted, setHasInteracted] = useState(false)
  const { position, state, distance } = useGeoLocation({
    geofenceThresholdM: GEOFENCE_ARRIVAL_THRESHOLD_M,
  })
  const [activeWaypoint, setActiveWaypoint] = useState(null)
  const [discoveredWaypoint, setDiscoveredWaypoint] = useState(null)
  const hasLoadedWaypoint = useRef(false)

  useEffect(() => {
    if (state !== JOURNEY_STATE.ARRIVAL || hasLoadedWaypoint.current) return

    hasLoadedWaypoint.current = true
    fetchWaypointById('colosseum')
      .then((waypoint) => {
        setDiscoveredWaypoint(waypoint)
        setActiveWaypoint(waypoint)
      })
      .catch((err) => console.error('Failed to load waypoint:', err))
  }, [state])

  const handleStartTour = async () => {
    setHasInteracted(true)

    try {
      const waypoint = await fetchWaypointById('colosseum')
      await audioOrchestrator.transitionTo(AUDIO_MODES.AMBIENT, {
        ambient_url: waypoint.ambient_url,
        transit_narrative_url: waypoint.transit_narrative_url,
        arrival_immersive_url: waypoint.arrival_immersive_url,
      })
    } catch (err) {
      console.error('Failed to start tour audio:', err)
    }
  }

  if (!hasInteracted) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <button
          type="button"
          onClick={handleStartTour}
          className="rounded-full bg-blue-600 p-6 text-lg font-semibold text-white shadow-lg transition hover:bg-blue-700"
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
