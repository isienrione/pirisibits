import { useState } from 'react'
import TourMap from './components/TourMap'
import WaypointCard from './components/WaypointCard'
import { JOURNEY_STATE } from './hooks/useGeoLocation'

function App() {
  const [journeyState, setJourneyState] = useState(null)
  const [activeWaypoint, setActiveWaypoint] = useState(null)
  const [discoveredWaypoint, setDiscoveredWaypoint] = useState(null)

  const handleWaypointArrival = (waypoint) => {
    setDiscoveredWaypoint(waypoint)
    setActiveWaypoint(waypoint)
  }

  return (
    <div className="relative h-screen w-full">
      <TourMap
        onWaypointArrival={handleWaypointArrival}
        onJourneyStateChange={setJourneyState}
      />
      {activeWaypoint && (
        <WaypointCard
          waypoint={activeWaypoint}
          state={journeyState}
          onClose={() => setActiveWaypoint(null)}
        />
      )}
      {journeyState === JOURNEY_STATE.ARRIVAL &&
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
