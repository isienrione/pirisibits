import { useCallback, useEffect, useRef, useState } from 'react'
import {
  applyWalkingCompanionCamera,
  collectWalkingCompanionBoundsPoints,
  WALKING_COMPANION_MIN_ZOOM,
  WALKING_COMPANION_PITCH,
} from '../utils/walkingCompanionMapCamera.js'
import { loadMapboxRuntime } from '../map/mapboxLoader.js'
import { createMapboxTransformRequest } from '../map/offlineMapTiles.js'
import { reportMapboxInitFailure } from '../lib/errorVisibility.js'
import { setMapboxInitStatus } from '../lib/mapboxStatus.js'
import { JOURNEY_STATE } from '../hooks/useGeoLocation'
import { createCirclePolygon } from '../utils/circleGeoJSON'
import {
  fetchTourWalkingRoute,
  fetchWalkingDirections,
} from '../services/fetchWalkingRoute'
import { getTourBounds } from '../services/tourRegistry'
import { env, isDebugGeo, isDebugMap, isDevPanelEnabled, isMapboxConfigured } from '../config/env'
import { resolveTourMapStyleOptions, isMapboxStandardStyle } from '../map/mapStyles.js'
import { addGlowingRouteLayers, applyWalkingRoutePaint, ROUTE_LINE_COLOR } from '../map/routeLineLayers.js'
import {
  createLandmarkMarkerElement,
  createLegOriginMarkerElement,
  createUserMarkerElement,
} from '../map/mapMarkers.js'
import WalkingMapChrome from '../redesign/ui/WalkingMapChrome.jsx'
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
  activeLeg: ROUTE_LINE_COLOR,
}

/**
 * Custom overlay paint for Mapbox Standard 3D lighting.
 * Without emissive strength, route lines can look flat/washed under dusk/night presets.
 * @see https://docs.mapbox.com/mapbox-gl-js/guides/migrate-to-v3/
 */
const STANDARD_LINE_EMISSIVE = { 'line-emissive-strength': 0.8 }
const STANDARD_FILL_EMISSIVE = { 'fill-emissive-strength': 0.35 }

function setupMapLayers(map, { stops, tour, bounds, minimalUI, walkingCompanionUI, activeTargetId, useStandardSlots }) {
  const geofenceStops = minimalUI
    ? stops.filter((stop) => stop.id === activeTargetId)
    : stops

  // Standard styles place custom data via slots (bottom / middle / top).
  const fillSlot = useStandardSlots ? { slot: 'bottom' } : {}
  const lineSlot = useStandardSlots ? { slot: 'middle' } : {}
  const fillEmissive = useStandardSlots ? STANDARD_FILL_EMISSIVE : {}
  const lineEmissive = useStandardSlots ? STANDARD_LINE_EMISSIVE : {}
  // Walking hero: float the glow stack in `top` so the bloom isn’t crushed
  // under Standard Satellite trees/buildings. MAP tab keeps `middle`.
  const routeSlot = useStandardSlots ? (walkingCompanionUI ? 'top' : 'middle') : null

  if (!map.getSource('waypoint-zones')) {
    map.addSource('waypoint-zones', {
      type: 'geojson',
      data: stopsToFeatureCollection(geofenceStops),
    })

    map.addLayer({
      id: 'waypoint-zones-fill',
      type: 'fill',
      source: 'waypoint-zones',
      ...fillSlot,
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
        ...fillEmissive,
      },
    })

    map.addLayer({
      id: 'waypoint-zones-outline',
      type: 'line',
      source: 'waypoint-zones',
      ...lineSlot,
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
        ...lineEmissive,
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
      ...lineSlot,
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': MAP_COLORS.tourRoute,
        'line-width': minimalUI ? 3 : 4,
        'line-opacity': minimalUI ? 0.28 : 0.55,
        'line-dasharray': [1.2, 1.4],
        ...lineEmissive,
      },
    })

    map.addSource('active-leg-route', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    })

    addGlowingRouteLayers(map, {
      sourceId: 'active-leg-route',
      glowLayerId: 'active-leg-route-glow',
      casingLayerId: 'active-leg-route-casing',
      lineLayerId: 'active-leg-route-line',
      slot: routeSlot,
      glowWidth: walkingCompanionUI ? 28 : 18,
      glowBlur: walkingCompanionUI ? 3.25 : 2.5,
      glowOpacity: walkingCompanionUI ? 0.68 : 0.45,
      casingWidth: walkingCompanionUI ? 12 : 9,
      casingOpacity: walkingCompanionUI ? 0.6 : 0.4,
      lineWidth: walkingCompanionUI ? 4 : 3.5,
      // Solid core on the walk hero - dashed reads as a flat schematic stroke.
      dashed: !walkingCompanionUI,
    })

    map.addSource('directions-nav-route', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    })

    addGlowingRouteLayers(map, {
      sourceId: 'directions-nav-route',
      glowLayerId: 'directions-nav-route-glow',
      casingLayerId: 'directions-nav-route-casing',
      lineLayerId: 'directions-nav-route-line',
      slot: routeSlot,
      glowWidth: 28,
      glowBlur: 3.25,
      glowOpacity: 0.68,
      casingWidth: 12,
      casingOpacity: 0.6,
      lineWidth: 4,
      dashed: false,
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
  preferOfflineStyle = false,
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
  const [mapBearing, setMapBearing] = useState(0)
  const walkingCameraPinRef = useRef(null)
  const debugGeo = isDebugGeo()
  const showDebugOverlay =
    (debugMapEnabled || isDebugMap()) && (!minimalUI || isDevPanelEnabled())
  const activeTarget = stops.find((stop) => stop.id === activeTargetId)

  const frameWalkingCompanion = useCallback(
    ({ includeUser = true, duration = 0 } = {}) => {
      if (!walkingCompanionUI || !map.current || !mapLoaded || !mapboxglRef.current) return false

      const previousStop = activeLeg
        ? stops.find((stop) => stop.id === activeLeg.fromId)?.landmark ?? null
        : null

      const routeCoordinates =
        directionsGeometry?.coordinates?.length > 0
          ? directionsGeometry.coordinates
          : legRouteCoordinates ?? []

      const points = collectWalkingCompanionBoundsPoints({
        userPos,
        destination: activeTarget?.landmark ?? null,
        previousStop,
        routeCoordinates,
        includeUser,
      })

      return applyWalkingCompanionCamera(map.current, mapboxglRef.current, points, {
        duration,
      })
    },
    [
      activeLeg,
      activeTarget?.landmark,
      directionsGeometry?.coordinates,
      legRouteCoordinates,
      mapLoaded,
      stops,
      userPos,
      walkingCompanionUI,
    ],
  )

  useEffect(() => {
    setLegRouteCoordinates(null)
    walkingCameraPinRef.current = null
  }, [activeLeg?.fromId, activeLeg?.toId])

  useEffect(() => {
    walkingCameraPinRef.current = null
  }, [activeTargetId])

  useEffect(() => {
    onMapFailureRef.current = onMapFailure
  }, [onMapFailure])

  useEffect(() => {
    const container = mapContainer.current
    if (!mapboxToken || !container || map.current) {
      if (!mapboxToken) setMapboxInitStatus('no_token')
      return undefined
    }

    setMapboxInitStatus('loading')

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
      reportMapboxInitFailure('bootstrap_timeout')
      onMapFailureRef.current?.()
    }, MAP_BOOTSTRAP_TIMEOUT_MS)

    const clearBootstrapTimeout = () => {
      if (bootstrapTimeoutId != null) {
        window.clearTimeout(bootstrapTimeoutId)
        bootstrapTimeoutId = null
      }
    }

    const styleOptions = resolveTourMapStyleOptions({
      walkingCompanionUI,
      preferOfflineStyle,
    })

    const markMapReady = () => {
      if (cancelled || !map.current) return

      clearBootstrapTimeout()

      if (loadTimeoutId != null) {
        window.clearTimeout(loadTimeoutId)
        loadTimeoutId = null
      }

      try {
        setupMapLayers(map.current, {
          stops,
          tour,
          bounds,
          minimalUI,
          walkingCompanionUI,
          activeTargetId,
          useStandardSlots: isMapboxStandardStyle(styleOptions.style),
        })
      } catch (error) {
        console.error('Map layer setup failed:', error)
        onMapFailureRef.current?.()
        return
      }

      setMapLoaded(true)
      setMapboxInitStatus('ready')
      map.current.resize()
    }

    const initMap = (mapboxgl) => {
      if (cancelled || map.current || !mapContainer.current) return
      if (mapContainer.current.clientWidth === 0 || mapContainer.current.clientHeight === 0) return

      mapboxgl.accessToken = mapboxToken

      try {
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: styleOptions.style,
          ...(styleOptions.config ? { config: styleOptions.config } : {}),
          center: [center.lng, center.lat],
          zoom: walkingCompanionUI ? WALKING_COMPANION_MIN_ZOOM : tour?.mapZoom ?? 14,
          pitch: walkingCompanionUI ? WALKING_COMPANION_PITCH : 0,
          // Let one-finger vertical drags scroll the walking companion page.
          cooperativeGestures: Boolean(walkingCompanionUI),
          transformRequest: createMapboxTransformRequest(),
        })
      } catch (error) {
        console.error('Mapbox initialization failed:', error)
        reportMapboxInitFailure(
          'map_construct_failed',
          error instanceof Error ? error.message : String(error),
        )
        onMapFailureRef.current?.()
        return
      }

      // Keep basemap lightPreset in sync if style reloads (Standard styles).
      map.current.on('style.load', () => {
        const basemap = styleOptions.config?.basemap
        if (!basemap || typeof map.current?.setConfigProperty !== 'function') return
        try {
          for (const [key, value] of Object.entries(basemap)) {
            map.current.setConfigProperty('basemap', key, value)
          }
        } catch (error) {
          console.warn('Mapbox basemap config apply failed:', error)
        }
      })

      let offlineTileErrors = 0
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
          return
        }
        // Offline + missing tiles → compact OfflineRouteMap instead of a grey canvas.
        const radioOffline =
          preferOfflineStyle ||
          (typeof navigator !== 'undefined' && navigator.onLine === false)
        if (!radioOffline) return
        offlineTileErrors += 1
        if (offlineTileErrors >= 3) {
          console.warn('Mapbox offline tile errors - falling back to route sketch')
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
        reportMapboxInitFailure(
          'runtime_load_failed',
          error instanceof Error ? error.message : String(error),
        )
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

      if (walkingCompanionUI) {
        const isDestination = stop.id === activeTargetId
        const isLegOrigin = activeLeg?.fromId === stop.id
        if (!isDestination && !isLegOrigin) return

        const marker = new mapboxgl.Marker({
          element: isLegOrigin
            ? createLegOriginMarkerElement()
            : createLandmarkMarkerElement(stop.title, stop.status, null, {
                showLabel: true,
                stopId: stop.id,
                compact: true,
              }),
          anchor: isLegOrigin ? 'center' : 'bottom',
        })
          .setLngLat([stop.landmark.lng, stop.landmark.lat])
          .addTo(map.current)
        landmarkMarkers.current.push(marker)
        return
      }

      const showLabel =
        !minimalUI || stop.id === activeTargetId || stop.id === selectedStopId
      const marker = new mapboxgl.Marker({
        element: createLandmarkMarkerElement(
          stop.title,
          stop.status,
          onStopSelect ? () => onStopSelect(stop.id) : null,
          { showLabel, stopId: stop.id },
        ),
        anchor: 'bottom',
      })
        .setLngLat([stop.landmark.lng, stop.landmark.lat])
        .addTo(map.current)
      landmarkMarkers.current.push(marker)
    })
  }, [
    stops,
    mapLoaded,
    onStopSelect,
    minimalUI,
    walkingCompanionUI,
    activeTargetId,
    activeLeg?.fromId,
    selectedStopId,
  ])

  useEffect(() => {
    if (!map.current || !mapLoaded || !mapboxToken) return undefined

    let cancelled = false

    const loadRoutes = async () => {
      if (!tour?.stopIds?.length || tour.stopIds.length < 2) return

      if (!walkingCompanionUI) {
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
      }

      if (directionsModeActive && !walkingCompanionUI) {
        map.current.getSource('active-leg-route')?.setData({
          type: 'FeatureCollection',
          features: [],
        })
        return
      }

      // Live GPS→destination geometry from WalkingCompanionScreen owns the hero route.
      if (walkingCompanionUI && directionsGeometry?.coordinates?.length) {
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
  }, [
    tour,
    stops,
    activeLeg,
    transitLegActive,
    mapLoaded,
    directionsModeActive,
    walkingCompanionUI,
    directionsGeometry,
  ])

  useEffect(() => {
    if (!walkingCompanionUI || !mapLoaded || !map.current) return

    // Prefer live Directions geometry from the walking companion (GPS → stop).
    if (directionsGeometry?.coordinates?.length) {
      map.current.getSource('active-leg-route')?.setData({
        type: 'FeatureCollection',
        features: [{ type: 'Feature', geometry: directionsGeometry, properties: {} }],
      })
      setLegRouteCoordinates(directionsGeometry.coordinates)
      return
    }
  }, [walkingCompanionUI, mapLoaded, directionsGeometry])

  useEffect(() => {
    if (!walkingCompanionUI || !mapLoaded || !map.current) return
    if (!legRouteCoordinates?.length && !directionsGeometry?.coordinates?.length) return

    const pinKey = `${activeTargetId}:leg`
    if (walkingCameraPinRef.current === pinKey) return

    const frame = () => {
      const framed = frameWalkingCompanion({ includeUser: true, duration: 0 })
      if (framed) {
        walkingCameraPinRef.current = pinKey
      }
    }

    if (map.current.isStyleLoaded()) {
      frame()
      return undefined
    }

    map.current.once('idle', frame)
    return () => {
      map.current?.off('idle', frame)
    }
  }, [
    walkingCompanionUI,
    mapLoaded,
    activeTargetId,
    legRouteCoordinates,
    directionsGeometry?.coordinates,
    frameWalkingCompanion,
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

    // Walking hero paints Directions onto active-leg-route (glow stack) separately.
    if (walkingCompanionUI) return

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
    } else {
      navSource.setData({
        type: 'FeatureCollection',
        features: [],
      })
    }
  }, [
    directionsModeActive,
    directionsGeometry,
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
        element: createUserMarkerElement({ minimalUI: minimalUI || walkingCompanionUI }),
        anchor: 'center',
      })
        .setLngLat([markerLng, markerLat])
        .addTo(map.current)
    }
  }, [userPos, mapLoaded, debugGeo, activeTarget?.landmark?.lat, activeTarget?.landmark?.lng, minimalUI, walkingCompanionUI])

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
    // Walking hero recenter uses pitched fitBounds - never flatten via flyTo.
    if (walkingCompanionUI) return

    map.current.flyTo({
      center: [focusTarget.lng, focusTarget.lat],
      zoom: Math.max(map.current.getZoom(), 15.5),
      duration: 900,
      essential: true,
    })
  }, [focusTarget?.lng, focusTarget?.lat, focusTarget?.key, mapLoaded, walkingCompanionUI])

  const handleRecenter = useCallback(() => {
    walkingCameraPinRef.current = null
    const framed = frameWalkingCompanion({ includeUser: true, duration: 700 })
    if (framed) {
      walkingCameraPinRef.current = `${activeTargetId}:user`
    }
  }, [activeTargetId, frameWalkingCompanion])

  useEffect(() => {
    if (!walkingCompanionUI || !mapLoaded || !map.current) return undefined

    const syncBearing = () => {
      setMapBearing(map.current?.getBearing?.() ?? 0)
    }

    syncBearing()
    map.current.on('rotate', syncBearing)
    map.current.on('rotateend', syncBearing)

    return () => {
      map.current?.off('rotate', syncBearing)
      map.current?.off('rotateend', syncBearing)
    }
  }, [walkingCompanionUI, mapLoaded])

  useEffect(() => {
    if (!map.current || !mapLoaded || !walkingCompanionUI) return
    if (map.current.getLayer('tour-route-line')) {
      map.current.setPaintProperty('tour-route-line', 'line-opacity', 0.1)
    }
    applyWalkingRoutePaint(map.current, {
      glowLayerId: 'active-leg-route-glow',
      casingLayerId: 'active-leg-route-casing',
      lineLayerId: 'active-leg-route-line',
      dashed: false,
    })
    applyWalkingRoutePaint(map.current, {
      glowLayerId: 'directions-nav-route-glow',
      casingLayerId: 'directions-nav-route-casing',
      lineLayerId: 'directions-nav-route-line',
      dashed: false,
    })
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
      <WalkingMapChrome
        visible={walkingCompanionUI && mapLoaded}
        bearing={mapBearing}
        onRecenter={handleRecenter}
      />
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
  preferOfflineStyle = false,
}) => {
  const [offlineMapMode, setOfflineMapMode] = useState(!isMapboxConfigured())
  const handleMapFailure = useCallback(() => {
    setOfflineMapMode(true)
  }, [])

  useEffect(() => {
    if (!isMapboxConfigured()) {
      setOfflineMapMode(true)
      return
    }
    // Back online - restore Mapbox (remount via style key picks satellite/standard).
    if (!isOffline) setOfflineMapMode(false)
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
        compact={Boolean(fillContainer || walkingCompanionUI || minimalUI)}
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
      preferOfflineStyle={preferOfflineStyle || isOffline}
      key={preferOfflineStyle || isOffline ? 'map-offline-style' : 'map-online-style'}
    />
  )
}

export default TourMap
