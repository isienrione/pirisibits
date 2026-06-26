import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { JOURNEY_STATE } from '../hooks/useGeoLocation'
import { createCirclePolygon } from '../utils/circleGeoJSON'
import { fetchTourWalkingRoute, fetchWalkingRoute } from '../services/fetchWalkingRoute'
import { getTourBounds } from '../services/tourRegistry'
import { env, isDebugGeo, isDebugMap, isMapboxConfigured } from '../config/env'

const mapboxToken = env.mapboxToken

const MAP_COLORS = {
  completed: '#7A8B5A',
  current: '#D9A441',
  pending: '#51606F',
  tourRoute: '#7CB7D8',
  activeLeg: '#D9A441',
}

const createLandmarkMarkerElement = (title, status) => {
  const el = document.createElement('div')
  el.className = 'flex flex-col items-center'

  const dotClass =
    status === 'completed'
      ? 'bg-olive'
      : status === 'current'
        ? 'bg-gold ring-2 ring-sand'
        : 'bg-soft-slate opacity-80'

  el.innerHTML = `
    <div class="flex h-6 w-6 items-center justify-center rounded-full border-2 border-warm-white ${dotClass} shadow-lg"></div>
    <span class="mt-1 max-w-[5.5rem] truncate rounded bg-deep-slate/80 px-2 py-0.5 text-center text-xs font-semibold text-gold">${title}</span>
  `
  return el
}

const createUserMarkerElement = () => {
  const el = document.createElement('div')
  el.className = 'flex flex-col items-center'
  el.innerHTML = `
    <div class="flex h-8 w-8 items-center justify-center rounded-full border-4 border-warm-white bg-sky-blue text-xs font-bold text-warm-white shadow-lg">You</div>
  `
  return el
}

const stopsToFeatureCollection = (stops) => ({
  type: 'FeatureCollection',
  features: (stops ?? [])
    .map((stop) => {
      if (!stop?.landmark) return null
      const circle = createCirclePolygon(stop.landmark, stop.arrivalRadiusM ?? 100)
      return {
        ...circle,
        properties: { id: stop.id, title: stop.title, status: stop.status },
      }
    })
    .filter(Boolean),
})

function MapDebugOverlay({
  debugGeo,
  activeTitle,
  transitLegActive,
  activeLeg,
  stops,
  state,
  distance,
  geofenceThresholdM,
}) {
  return (
    <div className="pointer-events-none absolute left-3 top-3 z-30 max-w-[min(92vw,20rem)] space-y-2">
      <div className="rounded-lg bg-deep-slate/90 px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-gold shadow">
        Debug map
      </div>
      <div className="rounded-lg bg-sky-blue/95 px-3 py-1.5 text-xs text-warm-white shadow">
        GPS: {debugGeo ? `simulated at ${activeTitle}` : 'live device location'}
      </div>
      {transitLegActive && activeLeg ? (
        <div className="rounded-lg bg-deep-slate/90 px-3 py-1.5 text-xs text-sand shadow">
          Leg: {stops.find((s) => s.id === activeLeg.fromId)?.title ?? activeLeg.fromId} →{' '}
          {stops.find((s) => s.id === activeLeg.toId)?.title ?? activeLeg.toId}
        </div>
      ) : null}
      {state ? (
        <div
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-warm-white shadow ${
            state === JOURNEY_STATE.ARRIVAL ? 'bg-olive/95' : 'bg-soft-slate/95'
          }`}
        >
          Journey: {state}
          {distance != null ? ` (${Math.round(distance)} m)` : ''}
        </div>
      ) : null}
      <div className="rounded-lg bg-deep-slate/90 px-3 py-1.5 text-xs text-sand shadow">
        Arrival geofence: {geofenceThresholdM} m
      </div>
    </div>
  )
}

const TourMap = ({
  tour,
  stops = [],
  activeTargetId,
  activeLeg,
  transitLegActive,
  geofenceThresholdM,
  userPos,
  state,
  distance,
}) => {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const userMarker = useRef(null)
  const landmarkMarkers = useRef([])
  const [mapLoaded, setMapLoaded] = useState(false)
  const debugGeo = isDebugGeo()
  const showDebugOverlay = isDebugMap()

  const activeTarget = stops.find((stop) => stop.id === activeTargetId)

  useEffect(() => {
    if (!mapboxToken || !mapContainer.current || map.current) return undefined

    const bounds = tour ? getTourBounds(tour) : null
    const center = bounds?.center ?? activeTarget?.landmark ?? { lat: 41.89, lng: 12.49 }

    mapboxgl.accessToken = mapboxToken

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [center.lng, center.lat],
      zoom: tour?.mapZoom ?? 14,
    })

    map.current.on('load', () => {
      map.current.addSource('waypoint-zones', {
        type: 'geojson',
        data: stopsToFeatureCollection(stops),
      })

      map.current.addLayer({
        id: 'waypoint-zones-fill',
        type: 'fill',
        source: 'waypoint-zones',
        paint: {
          'fill-color': [
            'match',
            ['get', 'status'],
            'completed',
            MAP_COLORS.completed,
            'current',
            MAP_COLORS.current,
            MAP_COLORS.pending,
          ],
          'fill-opacity': 0.14,
        },
      })

      map.current.addLayer({
        id: 'waypoint-zones-outline',
        type: 'line',
        source: 'waypoint-zones',
        paint: {
          'line-color': [
            'match',
            ['get', 'status'],
            'completed',
            MAP_COLORS.completed,
            'current',
            MAP_COLORS.current,
            MAP_COLORS.pending,
          ],
          'line-width': 2,
          'line-opacity': 0.65,
        },
      })

      map.current.addSource('tour-route', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })

      map.current.addLayer({
        id: 'tour-route-line',
        type: 'line',
        source: 'tour-route',
        paint: {
          'line-color': MAP_COLORS.tourRoute,
          'line-width': 4,
          'line-opacity': 0.45,
        },
      })

      map.current.addSource('active-leg-route', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })

      map.current.addLayer({
        id: 'active-leg-route-line',
        type: 'line',
        source: 'active-leg-route',
        paint: {
          'line-color': MAP_COLORS.activeLeg,
          'line-width': 5,
          'line-opacity': 0.9,
        },
      })

      if (bounds && tour?.stopIds?.length > 1) {
        map.current.fitBounds(
          [
            [bounds.minLng - 0.005, bounds.minLat - 0.004],
            [bounds.maxLng + 0.005, bounds.maxLat + 0.004],
          ],
          { padding: 56, maxZoom: 15, duration: 0 }
        )
      }

      setMapLoaded(true)
    })

    return () => {
      setMapLoaded(false)
      userMarker.current = null
      landmarkMarkers.current.forEach((marker) => marker.remove())
      landmarkMarkers.current = []
      map.current?.remove()
      map.current = null
    }
  }, [tour?.id])

  useEffect(() => {
    if (!map.current || !mapLoaded) return

    const source = map.current.getSource('waypoint-zones')
    if (source) {
      source.setData(stopsToFeatureCollection(stops))
    }

    landmarkMarkers.current.forEach((marker) => marker.remove())
    landmarkMarkers.current = []

    stops.forEach((stop) => {
      if (!stop?.landmark) return
      const marker = new mapboxgl.Marker({
        element: createLandmarkMarkerElement(stop.title, stop.status),
        anchor: 'bottom',
      })
        .setLngLat([stop.landmark.lng, stop.landmark.lat])
        .addTo(map.current)
      landmarkMarkers.current.push(marker)
    })
  }, [stops, mapLoaded])

  useEffect(() => {
    if (!map.current || !mapLoaded || !mapboxToken) return undefined

    let cancelled = false

    const loadRoutes = async () => {
      if (!tour?.stopIds?.length || tour.stopIds.length < 2) return

      const landmarks = tour.stopIds
        .map((id) => stops.find((stop) => stop.id === id)?.landmark)
        .filter(Boolean)

      const fullRoute = await fetchTourWalkingRoute(landmarks, mapboxToken)
      if (cancelled || !fullRoute) return

      map.current.getSource('tour-route')?.setData({
        type: 'FeatureCollection',
        features: [{ type: 'Feature', geometry: fullRoute, properties: {} }],
      })

      if (activeLeg && transitLegActive) {
        const from = stops.find((stop) => stop.id === activeLeg.fromId)?.landmark
        const to = stops.find((stop) => stop.id === activeLeg.toId)?.landmark
        const legRoute = from && to ? await fetchWalkingRoute(from, to, mapboxToken) : null

        if (!cancelled && legRoute) {
          map.current.getSource('active-leg-route')?.setData({
            type: 'FeatureCollection',
            features: [{ type: 'Feature', geometry: legRoute, properties: {} }],
          })
        }
      } else {
        map.current.getSource('active-leg-route')?.setData({
          type: 'FeatureCollection',
          features: [],
        })
      }
    }

    loadRoutes()

    return () => {
      cancelled = true
    }
  }, [tour, stops, activeLeg, transitLegActive, mapLoaded])

  useEffect(() => {
    if (!userPos?.lat || !userPos?.lng || !map.current || !mapLoaded) return

    const anchor = activeTarget?.landmark
    const markerLng = debugGeo && anchor ? anchor.lng + 0.0002 : userPos.lng
    const markerLat = debugGeo && anchor ? anchor.lat + 0.0001 : userPos.lat

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
  }, [userPos, mapLoaded, debugGeo, activeTarget?.landmark?.lat, activeTarget?.landmark?.lng])

  if (!isMapboxConfigured()) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-warm-white p-6 text-center text-deep-slate">
        <p>
          Missing <code className="rounded bg-sand px-2 py-1">VITE_MAPBOX_TOKEN</code>.
          Add it to <code className="rounded bg-sand px-1">chronowalk/.env</code>.
        </p>
      </div>
    )
  }

  const activeTitle = activeTarget?.title ?? 'waypoint'

  return (
    <div className="relative h-screen w-full">
      <div ref={mapContainer} className="h-full w-full" />
      {showDebugOverlay ? (
        <MapDebugOverlay
          debugGeo={debugGeo}
          activeTitle={activeTitle}
          transitLegActive={transitLegActive}
          activeLeg={activeLeg}
          stops={stops}
          state={state}
          distance={distance}
          geofenceThresholdM={geofenceThresholdM}
        />
      ) : null}
    </div>
  )
}

export default TourMap
