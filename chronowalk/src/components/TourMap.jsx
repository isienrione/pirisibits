import { useCallback, useEffect, useRef, useState } from 'react'
import { LocateFixed } from 'lucide-react'
import {
  applyWalkingCompanionCamera,
  collectWalkingCompanionBoundsPoints,
  WALKING_COMPANION_MIN_ZOOM,
} from '../utils/walkingCompanionMapCamera.js'
import { loadMapboxRuntime } from '../map/mapboxLoader.js'
import { createMapboxTransformRequest } from '../map/offlineMapTiles.js'
import { JOURNEY_STATE } from '../hooks/useGeoLocation'
import { createCirclePolygon } from '../utils/circleGeoJSON'
import {
  fetchTourWalkingRoute,
  fetchWalkingDirections,
} from '../services/fetchWalkingRoute'
import { getTourBounds } from '../services/tourRegistry'
import { env, isDebugGeo, isDebugMap, isDevPanelEnabled, isMapboxConfigured } from '../config/env'
import { useReducedMotion } from '../hooks/useReducedMotion'
import {
  cacheLegDirections,
  cacheLegRoute,
  cacheTourRoute,
} from '../utils/routeGeometryCache'
import OfflineRouteMap from './map/OfflineRouteMap'
import { LoadingPanel } from './ui'
import { hex } from '../design/tokens.js'

const mapboxToken = env.mapboxToken

const MAP_COLORS = {
  completed: hex.verdigris,
  current: hex.ember,
  pending: hex.inkMuted,
  tourRoute: hex.cityRome,
  activeLeg: hex.cityRome,
}

const MAP_STYLE = env.mapboxStyleUrl

function setupMapLayers(map, { stops, tour, bounds, minimalUI, walkingCompanionUI, activeTargetId }) {
  const geofenceStops = minimalUI
    ? stops.filter((stop) => stop.id === activeTargetId)
    : stops

  if (!map.getSource('waypoint-zones')) {
    map.addSource('waypoint-zones', {
      type: 'geojson',
      data: stopsToFeatureCollection(geofenceStops),
    })

    map.addLayer({
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
          'locked',
          MAP_COLORS.pending,
          MAP_COLORS.pending,
        ],
        'fill-opacity': minimalUI ? 0.08 : 0.14,
      },
    })

    map.addLayer({
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
          'locked',
          MAP_COLORS.pending,
          MAP_COLORS.pending,
        ],
        'line-width': minimalUI ? 1.5 : 2,
        'line-opacity': minimalUI ? 0.35 : 0.65,
      },
    })

    map.addSource('tour-route', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    })

    map.addLayer({
      id: 'tour-route-line',
      type: 'line',
      source: 'tour-route',
      paint: {
        'line-color': MAP_COLORS.tourRoute,
        'line-width': minimalUI ? 3 : 4,
        'line-opacity': minimalUI ? 0.28 : 0.55,
        'line-dasharray': [1.2, 1.4],
      },
    })

    map.addSource('active-leg-route', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    })

    map.addLayer({
      id: 'active-leg-route-line',
      type: 'line',
      source: 'active-leg-route',
      paint: {
        'line-color': walkingCompanionUI ? '#E4552E' : MAP_COLORS.activeLeg,
        'line-width': walkingCompanionUI ? 4 : 5,
        'line-opacity': walkingCompanionUI ? 0.92 : 0.95,
        ...(walkingCompanionUI ? { 'line-dasharray': [2, 2.2] } : {}),
      },
    })

    map.addSource('directions-nav-route', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    })

    map.addLayer({
      id: 'directions-nav-route-line',
      type: 'line',
      source: 'directions-nav-route',
      paint: {
        'line-color': MAP_COLORS.activeLeg,
        'line-width': 6,
        'line-opacity': 1,
      },
    })
  } else {
    map.getSource('waypoint-zones')?.setData(stopsToFeatureCollection(geofenceStops))
  }

  if (bounds && tour?.stopIds?.length > 1 && !walkingCompanionUI) {
    map.fitBounds(
      [
        [bounds.minLng - 0.005, bounds.minLat - 0.004],
        [bounds.maxLng + 0.005, bounds.maxLat + 0.004],
      ],
      { padding: minimalUI ? 72 : 56, maxZoom: minimalUI ? 14 : 15, duration: 0 }
    )
  }
}

const createLandmarkMarkerElement = (title, status, onPress, { showLabel = true } = {}) => {
  const el = document.createElement('div')
  el.className = 'flex flex-col items-center'
  if (onPress) {
    el.style.cursor = 'pointer'
    el.addEventListener('click', (event) => {
      event.stopPropagation()
      onPress()
    })
  }

  const dotClass =
    status === 'completed'
      ? 'bg-acthill'
      : status === 'current'
        ? 'bg-ember ring-2 ring-sand'
        : status === 'locked'
          ? 'bg-muted opacity-60'
          : 'bg-muted opacity-80'

  const dotSize = showLabel ? 'h-6 w-6' : 'h-3 w-3'
  const labelHtml = showLabel
    ? `<span class="mt-1 max-w-[5.5rem] truncate rounded bg-bone/95 px-2 py-0.5 text-center text-[0.65rem] font-semibold text-ink900 shadow-sm">${title}</span>`
    : ''

  el.innerHTML = `
    <div class="flex ${dotSize} items-center justify-center rounded-full border-2 border-warm-white ${dotClass} shadow-md"></div>
    ${labelHtml}
  `
  return el
}

const createUserMarkerElement = (minimalUI = false) => {
  const el = document.createElement('div')
  el.className = 'flex flex-col items-center'
  el.innerHTML = minimalUI
    ? `<div class="flex h-5 w-5 items-center justify-center rounded-full border-[3px] border-warm-white bg-sky-blue shadow-lg"></div>`
    : `<div class="flex h-8 w-8 items-center justify-center rounded-full border-4 border-warm-white bg-sky-blue text-xs font-bold text-warmwhite shadow-lg">You</div>`
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
        className={`absolute h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ember/50 bg-ember/10 ${
          reducedMotion ? '' : 'animate-arrival-map-pulse'
        }`}
      />
      <div
        className={`absolute h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ember/25 ${
          reducedMotion ? '' : 'animate-arrival-map-pulse'
        }`}
        style={{ animationDelay: '0.35s' }}
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
      <div className="rounded-lg bg-ink900/90 px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-ember shadow">
        Debug map
      </div>
      <div className="rounded-lg bg-sky-blue/95 px-3 py-1.5 text-xs text-warmwhite shadow">
        GPS: {debugGeo ? `simulated at ${activeTitle}` : 'live device location'}
      </div>
      {transitLegActive && activeLeg ? (
        <div className="rounded-lg bg-ink900/90 px-3 py-1.5 text-xs text-sand shadow">
          Leg: {stops.find((s) => s.id === activeLeg.fromId)?.title ?? activeLeg.fromId} →{' '}
          {stops.find((s) => s.id === activeLeg.toId)?.title ?? activeLeg.toId}
        </div>
      ) : null}
      {state ? (
        <div
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-warmwhite shadow ${
            state === JOURNEY_STATE.ARRIVAL ? 'bg-acthill/95' : 'bg-muted/95'
          }`}
        >
          Journey: {state}
          {distance != null ? ` (${Math.round(distance)} m)` : ''}
        </div>
      ) : null}
      <div className="rounded-lg bg-ink900/90 px-3 py-1.5 text-xs text-sand shadow">
        Arrival geofence: {geofenceThresholdM} m
      </div>
    </div>
  )
}

const MAP_BOOTSTRAP_TIMEOUT_MS = 10000

function TourMapboxView({
  tour,
  stops,
  activeTargetId,
  selectedStopId = null,
  activeLeg,
  transitLegActive,
  geofenceThresholdM,
  userPos,
  state,
  distance,
  arrivalPulseActive,
  debugMapEnabled,
  focusTarget,
  onMapFailure,
  directionsModeActive = false,
  directionsGeometry = null,
  onStopSelect = null,
  minimalUI = false,
  walkingCompanionUI = false,
  fillContainer = false,
}) {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const mapboxglRef = useRef(null)
  const userMarker = useRef(null)
  const landmarkMarkers = useRef([])
  const onMapFailureRef = useRef(onMapFailure)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [pulsePoint, setPulsePoint] = useState(null)
  const [legRouteCoordinates, setLegRouteCoordinates] = useState(null)
  const debugGeo = isDebugGeo()
  const showDebugOverlay =
    (debugMapEnabled || isDebugMap()) && (!minimalUI || isDevPanelEnabled())
  const activeTarget = stops.find((stop) => stop.id === activeTargetId)

  const frameWalkingCompanion = useCallback(
    (animate = false) => {
      if (!walkingCompanionUI || !map.current || !mapLoaded || !mapboxglRef.current) return

      const previousStop = activeLeg
        ? stops.find((stop) => stop.id === activeLeg.fromId)?.landmark ?? null
        : null

      const routeCoordinates =
        directionsModeActive && directionsGeometry?.coordinates?.length
          ? directionsGeometry.coordinates
          : legRouteCoordinates ?? []

      const points = collectWalkingCompanionBoundsPoints({
        userPos,
        destination: activeTarget?.landmark ?? null,
        previousStop,
        routeCoordinates,
      })

      applyWalkingCompanionCamera(map.current, mapboxglRef.current, points, { animate })
    },
    [
      activeLeg,
      activeTarget?.landmark,
      directionsGeometry,
      directionsModeActive,
      legRouteCoordinates,
      mapLoaded,
      stops,
      userPos,
      walkingCompanionUI,
    ],
  )

  useEffect(() => {
    setLegRouteCoordinates(null)
  }, [activeLeg?.fromId, activeLeg?.toId])

  useEffect(() => {
    onMapFailureRef.current = onMapFailure
  }, [onMapFailure])

  useEffect(() => {
    const container = mapContainer.current
    if (!mapboxToken || !container || map.current) return undefined

    const bounds = tour?.bounds ?? (tour ? getTourBounds(tour) : null)
    const center =
      walkingCompanionUI && activeTarget?.landmark
        ? activeTarget.landmark
        : bounds?.center ?? activeTarget?.landmark ?? { lat: 41.89, lng: 12.49 }
    let cancelled = false
    let loadTimeoutId = null
    let bootstrapTimeoutId = window.setTimeout(() => {
      if (cancelled || map.current?.loaded?.()) return
      console.warn('Mapbox bootstrap timed out before the map became ready')
      onMapFailureRef.current?.()
    }, MAP_BOOTSTRAP_TIMEOUT_MS)

    const clearBootstrapTimeout = () => {
      if (bootstrapTimeoutId != null) {
        window.clearTimeout(bootstrapTimeoutId)
        bootstrapTimeoutId = null
      }
    }

    const markMapReady = () => {
      if (cancelled || !map.current) return

      clearBootstrapTimeout()

      if (loadTimeoutId != null) {
        window.clearTimeout(loadTimeoutId)
        loadTimeoutId = null
      }

      try {
        setupMapLayers(map.current, { stops, tour, bounds, minimalUI, walkingCompanionUI, activeTargetId })
      } catch (error) {
        console.error('Map layer setup failed:', error)
        onMapFailureRef.current?.()
        return
      }

      setMapLoaded(true)
      map.current.resize()
    }

    const initMap = (mapboxgl) => {
      if (cancelled || map.current || !mapContainer.current) return
      if (mapContainer.current.clientWidth === 0 || mapContainer.current.clientHeight === 0) return

      mapboxgl.accessToken = mapboxToken

      try {
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: MAP_STYLE,
          center: [center.lng, center.lat],
          zoom: walkingCompanionUI ? WALKING_COMPANION_MIN_ZOOM : tour?.mapZoom ?? 14,
          transformRequest: createMapboxTransformRequest(),
        })
      } catch (error) {
        console.error('Mapbox initialization failed:', error)
        onMapFailureRef.current?.()
        return
      }

      map.current.on('error', (event) => {
        const status = event?.error?.status
        const message = event?.error?.message ?? ''
        if (
          status === 401 ||
          status === 403 ||
          /unauthorized|forbidden|not authorized/i.test(message)
        ) {
          console.warn('Mapbox auth error:', event?.error ?? event)
          onMapFailureRef.current?.()
        }
      })

      map.current.once('load', markMapReady)
      if (map.current.loaded()) {
        markMapReady()
      }

      loadTimeoutId = window.setTimeout(() => {
        if (cancelled || map.current?.loaded?.()) return
        console.warn('Mapbox load timed out')
        onMapFailureRef.current?.()
      }, MAP_BOOTSTRAP_TIMEOUT_MS)
    }

    void loadMapboxRuntime()
      .then((mapboxgl) => {
        if (cancelled) return
        mapboxglRef.current = mapboxgl
        initMap(mapboxgl)
      })
      .catch((error) => {
        console.error('Mapbox runtime load failed:', error)
        onMapFailureRef.current?.()
      })

    const resizeObserver = new ResizeObserver(() => {
      if (map.current) {
        map.current.resize()
        return
      }
      if (mapboxglRef.current) {
        initMap(mapboxglRef.current)
      }
    })
    resizeObserver.observe(container)

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        map.current?.resize()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      cancelled = true
      clearBootstrapTimeout()
      resizeObserver.disconnect()
      document.removeEventListener('visibilitychange', onVisibilityChange)
      if (loadTimeoutId != null) {
        window.clearTimeout(loadTimeoutId)
      }
      setMapLoaded(false)
      userMarker.current = null
      landmarkMarkers.current.forEach((marker) => marker.remove())
      landmarkMarkers.current = []
      map.current?.remove()
      map.current = null
      mapboxglRef.current = null
    }
  }, [tour?.id])

  useEffect(() => {
    const mapboxgl = mapboxglRef.current
    if (!map.current || !mapLoaded || !mapboxgl) return

    const source = map.current.getSource('waypoint-zones')
    if (source) {
      const geofenceStops = minimalUI
        ? stops.filter((stop) => stop.id === activeTargetId)
        : stops
      source.setData(stopsToFeatureCollection(geofenceStops))
    }

    landmarkMarkers.current.forEach((marker) => marker.remove())
    landmarkMarkers.current = []

    stops.forEach((stop) => {
      if (!stop?.landmark) return
      if (walkingCompanionUI && stop.id !== activeTargetId) return
      const showLabel =
        !walkingCompanionUI &&
        (!minimalUI || stop.id === activeTargetId || stop.id === selectedStopId)
      const marker = new mapboxgl.Marker({
        element: createLandmarkMarkerElement(
          stop.title,
          stop.status,
          onStopSelect ? () => onStopSelect(stop.id) : null,
          { showLabel },
        ),
        anchor: 'bottom',
      })
        .setLngLat([stop.landmark.lng, stop.landmark.lat])
        .addTo(map.current)
      landmarkMarkers.current.push(marker)
    })
  }, [stops, mapLoaded, onStopSelect, minimalUI, walkingCompanionUI, activeTargetId, selectedStopId])

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

      cacheTourRoute(tour.id, fullRoute)

      map.current.getSource('tour-route')?.setData({
        type: 'FeatureCollection',
        features: [{ type: 'Feature', geometry: fullRoute, properties: {} }],
      })

      if (directionsModeActive) {
        map.current.getSource('active-leg-route')?.setData({
          type: 'FeatureCollection',
          features: [],
        })
        return
      }

      if (activeLeg && (transitLegActive || walkingCompanionUI)) {
        const fromStop = stops.find((stop) => stop.id === activeLeg.fromId)
        const toStop = stops.find((stop) => stop.id === activeLeg.toId)
        const from = fromStop?.landmark
        const to = toStop?.landmark

        if (from && to) {
          const directions = await fetchWalkingDirections(from, to, mapboxToken, {
            destinationName: toStop?.title ?? null,
          })

          if (!cancelled && directions?.geometry) {
            cacheLegRoute(tour.id, activeLeg.fromId, activeLeg.toId, directions.geometry)
            cacheLegDirections(tour.id, activeLeg.fromId, activeLeg.toId, directions.steps)

            map.current.getSource('active-leg-route')?.setData({
              type: 'FeatureCollection',
              features: [{ type: 'Feature', geometry: directions.geometry, properties: {} }],
            })

            if (walkingCompanionUI) {
              setLegRouteCoordinates(directions.geometry.coordinates ?? null)
            }
          }
        }
      } else {
        map.current.getSource('active-leg-route')?.setData({
          type: 'FeatureCollection',
          features: [],
        })
        if (walkingCompanionUI) {
          setLegRouteCoordinates(null)
        }
      }
    }

    loadRoutes()

    return () => {
      cancelled = true
    }
  }, [tour, stops, activeLeg, transitLegActive, mapLoaded, directionsModeActive, walkingCompanionUI])

  useEffect(() => {
    if (!walkingCompanionUI || !mapLoaded) return
    frameWalkingCompanion(false)
  }, [walkingCompanionUI, mapLoaded, activeTargetId, frameWalkingCompanion])

  useEffect(() => {
    if (!walkingCompanionUI || !mapLoaded) return
    if (!legRouteCoordinates?.length && !directionsGeometry?.coordinates?.length) return
    frameWalkingCompanion(true)
  }, [
    directionsGeometry,
    frameWalkingCompanion,
    legRouteCoordinates,
    mapLoaded,
    walkingCompanionUI,
  ])

  useEffect(() => {
    if (!map.current || !mapLoaded) return

    const tourOpacity = directionsModeActive ? 0.18 : 0.55
    if (map.current.getLayer('tour-route-line')) {
      map.current.setPaintProperty('tour-route-line', 'line-opacity', tourOpacity)
    }
  }, [directionsModeActive, mapLoaded])

  useEffect(() => {
    if (!directionsModeActive || !map.current || !mapLoaded) {
      return
    }

    const navSource = map.current.getSource('directions-nav-route')
    if (!navSource) return

    if (directionsGeometry?.coordinates?.length) {
      navSource.setData({
        type: 'FeatureCollection',
        features: [{ type: 'Feature', geometry: directionsGeometry, properties: {} }],
      })

      map.current.getSource('active-leg-route')?.setData({
        type: 'FeatureCollection',
        features: [],
      })

      if (walkingCompanionUI) {
        frameWalkingCompanion(true)
      }
    } else {
      navSource.setData({
        type: 'FeatureCollection',
        features: [],
      })
    }
  }, [
    directionsModeActive,
    directionsGeometry,
    frameWalkingCompanion,
    mapLoaded,
    transitLegActive,
    walkingCompanionUI,
  ])

  useEffect(() => {
    if (
      walkingCompanionUI ||
      !directionsModeActive ||
      !directionsGeometry?.coordinates?.length ||
      !map.current ||
      !mapLoaded
    ) {
      return
    }

    const coordinates = directionsGeometry.coordinates
    let minLng = coordinates[0][0]
    let maxLng = coordinates[0][0]
    let minLat = coordinates[0][1]
    let maxLat = coordinates[0][1]

    coordinates.forEach(([lng, lat]) => {
      minLng = Math.min(minLng, lng)
      maxLng = Math.max(maxLng, lng)
      minLat = Math.min(minLat, lat)
      maxLat = Math.max(maxLat, lat)
    })

    if (userPos?.lat != null && userPos?.lng != null) {
      minLng = Math.min(minLng, userPos.lng)
      maxLng = Math.max(maxLng, userPos.lng)
      minLat = Math.min(minLat, userPos.lat)
      maxLat = Math.max(maxLat, userPos.lat)
    }

    map.current.fitBounds(
      [
        [minLng - 0.0015, minLat - 0.0015],
        [maxLng + 0.0015, maxLat + 0.0015],
      ],
      { padding: { top: 120, bottom: 220, left: 48, right: 48 }, maxZoom: 17, duration: 800 },
    )
  }, [
    directionsModeActive,
    directionsGeometry,
    mapLoaded,
    userPos?.lat,
    userPos?.lng,
    walkingCompanionUI,
  ])

  useEffect(() => {
    const mapboxgl = mapboxglRef.current
    if (!userPos?.lat || !userPos?.lng || !map.current || !mapLoaded || !mapboxgl) return

    const anchor = activeTarget?.landmark
    const markerLng = debugGeo && anchor ? anchor.lng + 0.0002 : userPos.lng
    const markerLat = debugGeo && anchor ? anchor.lat + 0.0001 : userPos.lat

    if (userMarker.current) {
      userMarker.current.setLngLat([markerLng, markerLat])
    } else {
      userMarker.current = new mapboxgl.Marker({
        element: createUserMarkerElement(minimalUI),
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

  const handleRecenter = useCallback(() => {
    frameWalkingCompanion(true)
  }, [frameWalkingCompanion])

  useEffect(() => {
    if (!map.current || !mapLoaded || !walkingCompanionUI) return
    if (map.current.getLayer('tour-route-line')) {
      map.current.setPaintProperty('tour-route-line', 'line-opacity', 0.1)
    }
    if (map.current.getLayer('active-leg-route-line')) {
      map.current.setPaintProperty('active-leg-route-line', 'line-color', '#E4552E')
      map.current.setPaintProperty('active-leg-route-line', 'line-dasharray', [2, 2.2])
    }
  }, [mapLoaded, walkingCompanionUI])

  const activeTitle = activeTarget?.title ?? 'waypoint'

  return (
    <div className={fillContainer ? 'relative h-full w-full' : 'relative h-screen w-full'}>
      <div ref={mapContainer} className="h-full w-full" />
      {!mapLoaded ? (
        <div className="absolute inset-0 z-10">
          <LoadingPanel
            label="Preparing your map…"
            hint="Drawing landmarks, routes, and walking paths"
            fullScreen
            className="bg-bone/90"
          />
        </div>
      ) : null}
      <MapArrivalPulse point={pulsePoint} active={arrivalPulseActive} />
      {walkingCompanionUI && mapLoaded ? (
        <button
          type="button"
          className="absolute bottom-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(245,239,227,0.12)] bg-[rgba(28,26,24,0.82)] text-[#F5EFE3] shadow-lg backdrop-blur-md"
          onClick={handleRecenter}
          aria-label="Recenter map"
        >
          <LocateFixed size={16} strokeWidth={2} />
        </button>
      ) : null}
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

const TourMap = ({
  tour,
  stops = [],
  activeTargetId,
  selectedStopId = null,
  activeLeg,
  transitLegActive,
  geofenceThresholdM,
  userPos,
  state,
  distance,
  arrivalPulseActive = false,
  debugMapEnabled = false,
  focusTarget = null,
  isOffline = false,
  awaitingFirstStop = false,
  directionsModeActive = false,
  directionsGeometry = null,
  onStopSelect = null,
  minimalUI = false,
  walkingCompanionUI = false,
  fillContainer = false,
}) => {
  const [offlineMapMode, setOfflineMapMode] = useState(isOffline || !isMapboxConfigured())
  const handleMapFailure = useCallback(() => {
    setOfflineMapMode(true)
  }, [])

  useEffect(() => {
    if (isOffline) setOfflineMapMode(true)
  }, [isOffline])

  if (offlineMapMode) {
    return (
      <OfflineRouteMap
        tour={tour}
        stops={stops}
        activeTargetId={activeTargetId}
        activeLeg={activeLeg}
        transitLegActive={transitLegActive}
        userPos={userPos}
        state={state}
        distance={distance}
        awaitingFirstStop={awaitingFirstStop}
      />
    )
  }

  return (
    <TourMapboxView
      tour={tour}
      stops={stops}
      activeTargetId={activeTargetId}
      selectedStopId={selectedStopId}
      activeLeg={activeLeg}
      transitLegActive={transitLegActive}
      geofenceThresholdM={geofenceThresholdM}
      userPos={userPos}
      state={state}
      distance={distance}
      arrivalPulseActive={arrivalPulseActive}
      debugMapEnabled={debugMapEnabled}
      focusTarget={focusTarget}
      onMapFailure={handleMapFailure}
      directionsModeActive={directionsModeActive}
      directionsGeometry={directionsGeometry}
      onStopSelect={onStopSelect}
      minimalUI={minimalUI}
      walkingCompanionUI={walkingCompanionUI}
      fillContainer={fillContainer}
    />
  )
}

export default TourMap
