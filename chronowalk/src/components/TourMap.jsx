import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN

const TourMap = () => {
  const mapContainer = useRef(null)
  const map = useRef(null)

  useEffect(() => {
    if (!mapboxToken || !mapContainer.current || map.current) return

    mapboxgl.accessToken = mapboxToken

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [12.4922, 41.8902],
      zoom: 15,
    })

    new mapboxgl.Marker({ color: '#FFD700' })
      .setLngLat([12.4922, 41.8902])
      .addTo(map.current)

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

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
