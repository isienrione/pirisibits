import { useState } from 'react'
import TourMap from './components/TourMap'
import WaypointCard from './components/WaypointCard'

function App() {
  const [activeWaypoint, setActiveWaypoint] = useState(null)

  return (
    <div className="relative h-screen w-full">
      <TourMap onWaypointArrival={setActiveWaypoint} />
      {activeWaypoint && (
        <WaypointCard
          waypoint={activeWaypoint}
          onClose={() => setActiveWaypoint(null)}
        />
      )}
    </div>
  )
}

export default App
