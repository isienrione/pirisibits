import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useGeoLocation, JOURNEY_STATE } from '../hooks/useGeoLocation'
import { createCirclePolygon } from '../utils/circleGeoJSON'
import {
  COLOSSEUM,
  COLOSSEUM_ARRIVAL_RADIUS_M,
  GEOFENCE_ARRIVAL_THRESHOLD_M,
} from '../data/colosseum'
import { env, isMapboxConfigured } from '../config/env'
import { fetchWaypointById } from '../services/waypointService'

const mapboxToken = env.mapboxToken
const debugGeo = env.debugGeo

const createColosseumMarkerElement = () => {
  const el = document.createElement('div')
  el.className = 'flex flex-col items-center'
  el.innerHTML = `
    <div class="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-yellow-400 shadow-lg"></div>
    <span class="mt-1 rounded bg-black/70 px-2 py-0.5 text-xs font-semibold text-yellow-300">Colosseum</span>
  `
  return el
}

const createUserMarkerElement = () => {
  const el = document.createElement('div')
  el.className = 'flex flex-col items-center'
  el.innerHTML = `
    <div class="flex h-8 w-8 items-center justify-center rounded-full border-4 border-white bg-blue-500 text-xs font-bold text-white shadow-lg">You</div>
  `
  return el
}

const TourMap = ({ onWaypointArrival }) => {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const userMarker = useRef(null)
  const hasArrived = useRef(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const journey = useGeoLocation({
    debugMode: debugGeo,
    target: COLOSSEUM,
    geofenceThresholdM: GEOFENCE_ARRIVAL_THRESHOLD_M,
  })

  useEffect(() => {
    if (!mapboxToken || !mapContainer.current || map.current) return

    mapboxgl.accessToken = mapboxToken

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [COLOSSEUM.lng, COLOSSEUM.lat],
      zoom: 15,
    })

    new mapboxgl.Marker({ element: createColosseumMarkerElement(), anchor: 'bottom' })
      .setLngLat([COLOSSEUM.lng, COLOSSEUM.lat])
      .addTo(map.current)

    map.current.on('load', () => {
      map.current.addSource('colosseum-zone', {
        type: 'geojson',
        data: createCirclePolygon(COLOSSEUM, COLOSSEUM_ARRIVAL_RADIUS_M),
      })

      map.current.addLayer({
        id: 'colosseum-zone-fill',
        type: 'fill',
        source: 'colosseum-zone',
        paint: {
          'fill-color': '#FFD700',
          'fill-opacity': 0.15,
        },
      })

      map.current.addLayer({
        id: 'colosseum-zone-outline',
        type: 'line',
        source: 'colosseum-zone',
        paint: {
          'line-color': '#FFD700',
          'line-width': 2,
          'line-opacity': 0.6,
        },
      })

      setMapLoaded(true)
    })

    return () => {
      setMapLoaded(false)
      userMarker.current = null
      map.current?.remove()
      map.current = null
    }
  }, [])

  useEffect(() => {
    if (!journey.lat || !journey.lng || !map.current || !mapLoaded) return

    const markerLng = debugGeo ? COLOSSEUM.lng + 0.0002 : journey.lng
    const markerLat = debugGeo ? COLOSSEUM.lat + 0.0001 : journey.lat

    if (userMarker.current) {
      userMarker.current.setLngLat([markerLng, markerLat])
    } else {
      userMarker.current = new mapboxgl.Marker({
        element: createUserMarkerElement(),
        anchor: 'bottom',
      })
        .setLngLat([markerLng, markerLat])
        .addTo(map.current)
    }

    if (journey.status === JOURNEY_STATE.ARRIVAL && !hasArrived.current) {
      hasArrived.current = true
      fetchWaypointById('colosseum')
        .then((waypoint) => onWaypointArrival?.(waypoint))
        .catch((err) => console.error('Failed to load waypoint:', err))
    }
  }, [journey, mapLoaded, onWaypointArrival, debugGeo])

  if (!isMapboxConfigured()) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-900 p-6 text-center text-white">
        <p>
          Missing <code className="rounded bg-gray-800 px-2 py-1">VITE_MAPBOX_TOKEN</code>.
          Add it to <code className="rounded bg-gray-800 px-2 py-1">chronowalk/.env</code> and restart{' '}
          <code className="rounded bg-gray-800 px-2 py-1">npm run dev</code>.
        </p>
      </div>
    )
  }

  return (
    <div className="relative h-screen w-full">
      <div ref={mapContainer} className="h-full w-full" />
      <div className="absolute left-3 top-3 space-y-2">
        {debugGeo ? (
          <div className="rounded bg-blue-600 px-3 py-1 text-sm text-white shadow">
            Debug GPS: teleported to Rome
          </div>
        ) : (
          <div className="rounded bg-amber-600 px-3 py-1 text-sm text-white shadow">
            Debug GPS: off (using real location)
          </div>
        )}
        {journey.status && (
          <div
            className={`rounded px-3 py-1 text-sm font-semibold text-white shadow ${
              journey.status === JOURNEY_STATE.ARRIVAL ? 'bg-green-600' : 'bg-gray-600'
            }`}
          >
            Journey: {journey.status}
            {journey.distance != null && ` (${Math.round(journey.distance)}m)`}
          </div>
        )}
        <div className="rounded bg-black/80 px-3 py-1 text-xs text-white shadow">
          Arrival geofence: {GEOFENCE_ARRIVAL_THRESHOLD_M}m
        </div>
      </div>
    </div>
  )
}

export default TourMap
