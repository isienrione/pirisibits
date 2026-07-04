import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import mapboxgl from '../../map/mapboxClient'
import { env, isMapboxConfigured } from '../../config/env'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { loadRomeTourManifest } from '../../content/romeTourManifest'
import { LoadingPanel } from '../ui'
import OfflineRouteMap from '../map/OfflineRouteMap'
import { HEART_OF_ANCIENT_ROME_TOUR } from '../../data/heart-of-ancient-rome-tour'

const WARM_MAP_STYLE = 'mapbox://styles/mapbox/outdoors-v12'

const MARKER_COLORS = {
  completed: '#A8742A',
  current: '#D4AF37',
  upcoming: '#686E72',
}

function stopsToGeoJson(stops, currentStopId, completedStopIds) {
  return {
    type: 'FeatureCollection',
    features: stops.map((stop) => {
      let status = 'upcoming'
      if (completedStopIds.includes(stop.id)) status = 'completed'
      else if (stop.id === currentStopId) status = 'current'

      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [stop.coords.lng, stop.coords.lat] },
        properties: {
          id: stop.id,
          number: stop.number,
          status,
        },
      }
    }),
  }
}

function JourneyMapboxView({ stops, currentStopId, completedStopIds, userPos }) {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const userMarker = useRef(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const reducedMotion = useReducedMotion()

  const bounds = useMemo(() => {
    if (!stops.length) return null
    const lngs = stops.map((s) => s.coords.lng)
    const lats = stops.map((s) => s.coords.lat)
    return [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)],
    ]
  }, [stops])

  useEffect(() => {
    if (!mapContainer.current || map.current || !isMapboxConfigured()) return

    mapboxgl.accessToken = env.mapboxToken
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: WARM_MAP_STYLE,
      center: stops[0] ? [stops[0].coords.lng, stops[0].coords.lat] : [12.4924, 41.8902],
      zoom: 14,
      attributionControl: false,
    })

    map.current.on('load', () => {
      setMapLoaded(true)
      if (bounds) {
        map.current.fitBounds(bounds, { padding: 60, duration: reducedMotion ? 0 : 800 })
      }
    })

    return () => {
      userMarker.current?.remove()
      map.current?.remove()
      map.current = null
    }
  }, [bounds, reducedMotion, stops])

  useEffect(() => {
    if (!map.current || !mapLoaded) return

    const sourceId = 'journey-stops'
    const data = stopsToGeoJson(stops, currentStopId, completedStopIds)

    if (map.current.getSource(sourceId)) {
      map.current.getSource(sourceId).setData(data)
    } else {
      map.current.addSource(sourceId, { type: 'geojson', data })
      map.current.addLayer({
        id: 'journey-stops-circle',
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': ['match', ['get', 'status'], 'current', 14, 10],
          'circle-color': [
            'match',
            ['get', 'status'],
            'completed',
            MARKER_COLORS.completed,
            'current',
            MARKER_COLORS.current,
            MARKER_COLORS.upcoming,
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#F7F3EC',
        },
      })
      map.current.addLayer({
        id: 'journey-stops-label',
        type: 'symbol',
        source: sourceId,
        layout: {
          'text-field': ['to-string', ['get', 'number']],
          'text-size': 11,
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        },
        paint: {
          'text-color': '#1C1C1C',
        },
      })
    }
  }, [completedStopIds, currentStopId, mapLoaded, stops])

  useEffect(() => {
    if (!map.current || !mapLoaded || !userPos?.lat || !userPos?.lng) return

    if (!userMarker.current) {
      const el = document.createElement('div')
      el.className = 'h-4 w-4 rounded-full border-2 border-ivory bg-sky-blue shadow-plaque'
      userMarker.current = new mapboxgl.Marker(el).setLngLat([userPos.lng, userPos.lat]).addTo(map.current)
    } else {
      userMarker.current.setLngLat([userPos.lng, userPos.lat])
    }
  }, [mapLoaded, userPos?.lat, userPos?.lng])

  const currentStop = stops.find((s) => s.id === currentStopId)
  useEffect(() => {
    if (!map.current || !mapLoaded || !currentStop) return
    map.current.easeTo({
      center: [currentStop.coords.lng, currentStop.coords.lat],
      zoom: Math.max(map.current.getZoom(), 15),
      duration: reducedMotion ? 0 : 900,
    })
  }, [currentStop, currentStopId, mapLoaded, reducedMotion])

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainer} className="h-full w-full" />
      {!mapLoaded ? (
        <div className="absolute inset-0 z-10">
          <LoadingPanel label="Preparing your map…" fullScreen className="bg-warm-white/90" />
        </div>
      ) : null}
    </div>
  )
}

function toLegacyStops(stops, currentStopId, completedStopIds) {
  return stops.map((stop) => ({
    id: stop.id,
    title: stop.title,
    landmark: stop.coords,
    status: completedStopIds.includes(stop.id)
      ? 'completed'
      : stop.id === currentStopId
        ? 'current'
        : 'locked',
  }))
}

/**
 * Launch journey map — warm Mapbox style with offline fallback.
 */
export default function JourneyLaunchMap({ currentStopId, completedStopIds = [], userPos }) {
  const manifest = useMemo(() => loadRomeTourManifest(), [])
  const [offlineMode, setOfflineMode] = useState(!isMapboxConfigured())

  const handleMapFailure = useCallback(() => setOfflineMode(true), [])

  useEffect(() => {
    if (!isMapboxConfigured()) setOfflineMode(true)
  }, [])

  const legacyStops = useMemo(
    () => toLegacyStops(manifest.stops, currentStopId, completedStopIds),
    [completedStopIds, currentStopId, manifest.stops]
  )

  if (offlineMode) {
    return (
      <OfflineRouteMap
        tour={HEART_OF_ANCIENT_ROME_TOUR}
        stops={legacyStops}
        activeTargetId={currentStopId}
        userPos={userPos}
        state="TRANSIT"
        distance={null}
      />
    )
  }

  try {
    return (
      <JourneyMapboxView
        stops={manifest.stops}
        currentStopId={currentStopId}
        completedStopIds={completedStopIds}
        userPos={userPos}
      />
    )
  } catch {
    handleMapFailure()
    return null
  }
}
