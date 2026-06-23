import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useGeoLocation } from '../hooks/useGeoLocation'
import { getDistance } from '../utils/distance'

const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN
const COLOSSEUM = { lat: 41.8902, lng: 12.4922 }
const debugGeo = String(import.meta.env.VITE_DEBUG_GEO ?? '').trim() === 'true'

const createUserMarkerElement = () => {
  const el = document.createElement('div')
  el.className =
    'flex h-8 w-8 items-center justify-center rounded-full border-4 border-white bg-blue-500 text-xs font-bold text-white shadow-lg'
  el.textContent = 'You'
  return el
}

const TourMap = () => {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const userMarker = useRef(null)
  const hasArrived = useRef(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const userPos = useGeoLocation(debugGeo)

  useEffect(() => {
    if (!mapboxToken || !mapContainer.current || map.current) return

    mapboxgl.accessToken = mapboxToken

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [COLOSSEUM.lng, COLOSSEUM.lat],
      zoom: 15,
    })

    new mapboxgl.Marker({ color: '#FFD700' })
      .setLngLat([COLOSSEUM.lng, COLOSSEUM.lat])
      .addTo(map.current)

    map.current.on('load', () => setMapLoaded(true))

    return () => {
      setMapLoaded(false)
      userMarker.current = null
      map.current?.remove()
      map.current = null
    }
  }, [])

  useEffect(() => {
    if (!userPos.lat || !userPos.lng || !map.current || !mapLoaded) return

    // Nudge marker slightly in debug so it doesn't hide under the gold pin
    const markerLng = debugGeo ? COLOSSEUM.lng + 0.0002 : userPos.lng
    const markerLat = debugGeo ? COLOSSEUM.lat + 0.0001 : userPos.lat

    if (userMarker.current) {
      userMarker.current.setLngLat([markerLng, markerLat])
    } else {
      userMarker.current = new mapboxgl.Marker({ element: createUserMarkerElement() })
        .setLngLat([markerLng, markerLat])
        .addTo(map.current)
    }

    const dist = getDistance(
      userPos.lat,
      userPos.lng,
      COLOSSEUM.lat,
      COLOSSEUM.lng
    )

    if (dist < 30 && !hasArrived.current) {
      hasArrived.current = true
      alert("You've arrived at the Colosseum!")
    }
  }, [userPos, mapLoaded])

  if (!mapboxToken) {
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
            Debug GPS: off (blue pin uses real location)
          </div>
        )}
        {import.meta.env.DEV && (
          <div className="rounded bg-black/80 px-3 py-1 text-xs text-white shadow">
            VITE_DEBUG_GEO = {String(import.meta.env.VITE_DEBUG_GEO ?? 'not set')}
          </div>
        )}
      </div>
    </div>
  )
}

export default TourMap
