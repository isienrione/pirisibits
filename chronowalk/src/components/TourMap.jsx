import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useGeoLocation } from '../hooks/useGeoLocation'
import { getDistance } from '../utils/distance'

const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN
const COLOSSEUM = { lat: 41.8902, lng: 12.4922 }
const debugGeo = import.meta.env.VITE_DEBUG_GEO === 'true'

const TourMap = () => {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const userMarker = useRef(null)
  const hasArrived = useRef(false)
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

    return () => {
      userMarker.current = null
      map.current?.remove()
      map.current = null
    }
  }, [])

  useEffect(() => {
    if (!userPos.lat || !userPos.lng || !map.current) return

    if (userMarker.current) {
      userMarker.current.setLngLat([userPos.lng, userPos.lat])
    } else {
      userMarker.current = new mapboxgl.Marker({ color: '#0000FF' })
        .setLngLat([userPos.lng, userPos.lat])
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
  }, [userPos])

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

  return <div ref={mapContainer} className="h-screen w-full" />
}

export default TourMap
