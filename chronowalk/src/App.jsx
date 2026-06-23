import { useCallback, useEffect, useRef, useState } from 'react'
import TourMap from './components/TourMap'
import WaypointCard from './components/WaypointCard'
import { useGeoLocation, JOURNEY_STATE } from './hooks/useGeoLocation'
import { fetchWaypointById } from './services/waypointService'
import { CARD_REVEAL_DELAY_MS, GEOFENCE_ARRIVAL_THRESHOLD_M } from './data/colosseum'
import { audioOrchestrator } from './audio/AudioOrchestrator'
import { requestDeviceTiltPermission } from './hooks/useDeviceTilt'

function App() {
  const [hasInteracted, setHasInteracted] = useState(false)
  const { position, state, distance } = useGeoLocation({
    geofenceThresholdM: GEOFENCE_ARRIVAL_THRESHOLD_M,
  })
  const [activeWaypoint, setActiveWaypoint] = useState(null)
  const [discoveredWaypoint, setDiscoveredWaypoint] = useState(null)
  const [waypointData, setWaypointData] = useState(null)
  const [cardDismissed, setCardDismissed] = useState(false)
  const prevJourneyStateRef = useRef(null)

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

    const justArrived =
      state === JOURNEY_STATE.ARRIVAL &&
      prevJourneyStateRef.current !== JOURNEY_STATE.ARRIVAL

    prevJourneyStateRef.current = state

    if (!justArrived) return undefined

    return revealWaypointCard(waypointData)
  }, [hasInteracted, waypointData, state, revealWaypointCard])

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
      {state === JOURNEY_STATE.ARRIVAL &&
        cardDismissed &&
        discoveredWaypoint &&
        !activeWaypoint && (
          <button
            type="button"
            onClick={() => setActiveWaypoint(discoveredWaypoint)}
            className="absolute bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-gray-900 shadow-lg transition hover:bg-amber-400"
          >
            Reopen {discoveredWaypoint.title}
          </button>
        )}
    </div>
  )
}

export default App
