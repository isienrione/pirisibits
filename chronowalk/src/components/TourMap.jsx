import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { JOURNEY_STATE } from '../hooks/useGeoLocation'
import { createCirclePolygon } from '../utils/circleGeoJSON'
import { fetchTourWalkingRoute, fetchWalkingRoute } from '../services/fetchWalkingRoute'
import { getTourBounds } from '../services/tourRegistry'
import { env, isDebugGeo, isDebugMap, isMapboxConfigured } from '../config/env'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { motionMapPulse } from './ui/motion'
import { Button, EmptyState, MapSkeletonOverlay, RouteLoadingShimmer, cn } from './ui'

const mapboxToken = env.mapboxToken

const MAP_COLORS = {
  completed: '#7A8B5A',
  current: '#D9A441',
  pending: '#51606F',
  tourRoute: '#C8643C',
  activeLeg: '#C8643C',
}

const MAP_STYLE = 'mapbox://styles/mapbox/light-v11'

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
    <div class="flex h-6 w-6 items-center justify-center rounded-full border-2 border-warm-white ${dotClass} shadow-md"></div>
    <span class="mt-1 max-w-[5.5rem] truncate rounded bg-warm-white/95 px-2 py-0.5 text-center text-[0.65rem] font-semibold text-deep-slate shadow-sm">${title}</span>
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

function MapArrivalPulse({ point, active }) {
  const reducedMotion = useReducedMotion()

  if (!active || !point) return null

  return (
    <div
      className="pointer-events-none absolute z-20"
      style={{ left: point.x, top: point.y }}
      aria-hidden="true"
    >
      <div
        className={cn(
          'absolute h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-gold/50 bg-gold/10',
          !reducedMotion && motionMapPulse
        )}
      />
      <div
        className={cn(
          'absolute h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/25',
          !reducedMotion && motionMapPulse
        )}
        style={{ animationDelay: '120ms' }}
      />
    </div>
  )
}

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
  arrivalPulseActive = false,
  debugMapEnabled = false,
  focusTarget = null,
}) => {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const userMarker = useRef(null)
  const landmarkMarkers = useRef([])
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [pulsePoint, setPulsePoint] = useState(null)
  const debugGeo = isDebugGeo()
  const showDebugOverlay = debugMapEnabled || isDebugMap()

  const activeTarget = stops.find((stop) => stop.id === activeTargetId)

  useEffect(() => {
    if (!mapboxToken || !mapContainer.current || map.current) return undefined

    setMapError(null)

    const bounds = tour ? getTourBounds(tour) : null
    const center = bounds?.center ?? activeTarget?.landmark ?? { lat: 41.89, lng: 12.49 }

    mapboxgl.accessToken = mapboxToken

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: MAP_STYLE,
        center: [center.lng, center.lat],
        zoom: tour?.mapZoom ?? 14,
      })
    } catch (error) {
      console.error('Mapbox initialization failed:', error)
      setMapError('Could not initialize the map. Verify your Mapbox token and try again.')
      return undefined
    }

    map.current.on('error', (event) => {
      console.error('Mapbox runtime error:', event?.error ?? event)
      setMapError('Map tiles failed to load. Check your connection or Mapbox token.')
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
          'line-opacity': 0.55,
          'line-dasharray': [1.2, 1.4],
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
          'line-opacity': 0.95,
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
      setMapError(null)
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

      setRouteLoading(true)

      const landmarks = tour.stopIds
        .map((id) => stops.find((stop) => stop.id === id)?.landmark)
        .filter(Boolean)

      const fullRoute = await fetchTourWalkingRoute(landmarks, mapboxToken)
      if (cancelled) return

      if (fullRoute) {
        map.current.getSource('tour-route')?.setData({
          type: 'FeatureCollection',
          features: [{ type: 'Feature', geometry: fullRoute, properties: {} }],
        })
      }

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

      if (!cancelled) setRouteLoading(false)
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

  useEffect(() => {
    const landmark = activeTarget?.landmark
    if (!arrivalPulseActive || !landmark || !map.current || !mapLoaded) {
      setPulsePoint(null)
      return undefined
    }

    const updatePulse = () => {
      const projected = map.current.project([landmark.lng, landmark.lat])
      setPulsePoint({ x: projected.x, y: projected.y })
    }

    updatePulse()
    map.current.on('move', updatePulse)
    map.current.on('zoom', updatePulse)
    map.current.on('resize', updatePulse)

    return () => {
      map.current?.off('move', updatePulse)
      map.current?.off('zoom', updatePulse)
      map.current?.off('resize', updatePulse)
    }
  }, [arrivalPulseActive, activeTarget?.landmark, mapLoaded])

  useEffect(() => {
    if (!focusTarget?.lng || !focusTarget?.lat || !map.current || !mapLoaded) return

    map.current.flyTo({
      center: [focusTarget.lng, focusTarget.lat],
      zoom: Math.max(map.current.getZoom(), 15.5),
      duration: 900,
      essential: true,
    })
  }, [focusTarget?.lng, focusTarget?.lat, focusTarget?.key, mapLoaded])

  if (!isMapboxConfigured()) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-warm-white p-6 text-center text-deep-slate">
        <div className="max-w-md">
          <p className="font-display text-xl font-semibold">Mapbox token required</p>
          <p className="mt-2 text-sm text-soft-slate">
            Add <code className="rounded bg-sand px-2 py-1">VITE_MAPBOX_TOKEN</code> to{' '}
            <code className="rounded bg-sand px-1">chronowalk/.env</code> and restart the dev
            server.
          </p>
        </div>
      </div>
    )
  }

  if (mapError) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-b from-sand/40 via-warm-white to-limestone/30 p-6">
        <EmptyState
          preset="routeUnavailable"
          body="We could not load the map right now. Check your connection and try again."
          actionLabel="Reload app"
          onAction={() => window.location.reload()}
          className="max-w-md"
        />
      </div>
    )
  }

  const activeTitle = activeTarget?.title ?? 'waypoint'

  return (
    <div className="relative h-screen w-full">
      <div ref={mapContainer} className="h-full w-full" />
      {!mapLoaded ? (
        <MapSkeletonOverlay
          label="Preparing your map…"
          hint="Drawing landmarks, routes, and walking paths"
        />
      ) : null}
      {mapLoaded && routeLoading ? (
        <div className="pointer-events-none absolute inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+6.5rem)] z-20 mx-auto max-w-md">
          <RouteLoadingShimmer label="Drawing your walking route…" />
        </div>
      ) : null}
      <MapArrivalPulse point={pulsePoint} active={arrivalPulseActive} />
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
