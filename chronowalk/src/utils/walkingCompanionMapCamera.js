export const WALKING_COMPANION_MIN_ZOOM = 15.5
export const WALKING_COMPANION_MAX_ZOOM = 16.5

/** Tilted hero-walk camera · composed 3D look over satellite. */
export const WALKING_COMPANION_PITCH = 45

/**
 * Generous padding so fitBounds keeps user + destination on-screen when pitched.
 * Bottom is larger because pitch foreshortens the near edge of the viewport.
 */
export const WALKING_COMPANION_MAP_PADDING = {
  top: 72,
  bottom: 110,
  left: 56,
  right: 56,
}

/** Rough Rome tour footprint · reject stray GPS / bad geometry for camera framing. */
export const ROME_CAMERA_BOUNDS = {
  minLat: 41.84,
  maxLat: 41.93,
  minLng: 12.42,
  maxLng: 12.54,
}

const MIN_BOUNDS_SPAN_DEG = 0.0018
const MAX_USER_DEST_DISTANCE_M = 3500
const MAX_ROUTE_SAMPLES = 28

function isValidLngLat([lng, lat]) {
  return (
    Number.isFinite(lng) &&
    Number.isFinite(lat) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180 &&
    lat >= ROME_CAMERA_BOUNDS.minLat &&
    lat <= ROME_CAMERA_BOUNDS.maxLat &&
    lng >= ROME_CAMERA_BOUNDS.minLng &&
    lng <= ROME_CAMERA_BOUNDS.maxLng
  )
}

function haversineMeters(a, b) {
  if (!a?.lat || !b?.lat) return Infinity
  const latDiff = (a.lat - b.lat) * 111_320
  const lngDiff =
    (a.lng - b.lng) * 111_320 * Math.cos(((a.lat + b.lat) / 2) * (Math.PI / 180))
  return Math.hypot(latDiff, lngDiff)
}

/**
 * Sample route geometry densely enough for fitBounds (not just endpoints),
 * so the full walking path stays in frame.
 */
export function sampleRouteCoordinates(routeCoordinates = [], maxSamples = MAX_ROUTE_SAMPLES) {
  if (!routeCoordinates.length) return []
  if (routeCoordinates.length === 1) return [routeCoordinates[0]]
  if (routeCoordinates.length <= maxSamples) return [...routeCoordinates]

  const samples = []
  const last = routeCoordinates.length - 1
  for (let i = 0; i < maxSamples; i += 1) {
    const index = Math.round((i / (maxSamples - 1)) * last)
    samples.push(routeCoordinates[index])
  }
  return samples
}

/** Collect lng/lat pairs for a walking-card camera frame (user + destination + route). */
export function collectWalkingCompanionBoundsPoints({
  userPos = null,
  destination = null,
  previousStop = null,
  routeCoordinates = [],
  includeUser = true,
} = {}) {
  const points = []

  const pushPoint = (point) => {
    if (point?.lat == null || point?.lng == null) return
    points.push([point.lng, point.lat])
  }

  if (
    includeUser &&
    userPos &&
    (!destination || haversineMeters(userPos, destination) <= MAX_USER_DEST_DISTANCE_M)
  ) {
    pushPoint(userPos)
  }

  pushPoint(destination)
  pushPoint(previousStop)

  for (const coordinate of sampleRouteCoordinates(routeCoordinates)) {
    if (!Array.isArray(coordinate) || coordinate.length < 2) continue
    points.push([coordinate[0], coordinate[1]])
  }

  return points.filter(isValidLngLat)
}

export function expandBoundsMinimumSpan(bounds, minSpanDeg = MIN_BOUNDS_SPAN_DEG) {
  const ne = bounds.getNorthEast()
  const sw = bounds.getSouthWest()
  const latMid = (ne.lat + sw.lat) / 2
  const lngMid = (ne.lng + sw.lng) / 2

  if (Math.abs(ne.lat - sw.lat) < minSpanDeg) {
    bounds.setSouthWest([sw.lng, latMid - minSpanDeg / 2])
    bounds.setNorthEast([ne.lng, latMid + minSpanDeg / 2])
  }

  if (Math.abs(ne.lng - sw.lng) < minSpanDeg) {
    bounds.setSouthWest([lngMid - minSpanDeg / 2, bounds.getSouthWest().lat])
    bounds.setNorthEast([lngMid + minSpanDeg / 2, bounds.getNorthEast().lat])
  }

  return bounds
}

/**
 * Frame the walking companion map on the active leg with a tilted camera.
 * Uses fitBounds (never jumpTo/setZoom) so Mapbox tiles keep rendering on mobile Safari.
 * Pitch is applied via fitBounds options so recenter restores the composed view.
 */
export function applyWalkingCompanionCamera(
  map,
  mapboxgl,
  points,
  {
    padding = WALKING_COMPANION_MAP_PADDING,
    pitch = WALKING_COMPANION_PITCH,
    duration = 0,
  } = {},
) {
  if (!map || !mapboxgl?.LngLatBounds || !points?.length) return false
  if (!map.isStyleLoaded()) return false

  const validPoints = points.filter(isValidLngLat)
  if (!validPoints.length) return false

  const bounds = new mapboxgl.LngLatBounds()
  validPoints.forEach((point) => bounds.extend(point))
  expandBoundsMinimumSpan(bounds)

  map.fitBounds(bounds, {
    padding,
    pitch,
    bearing: map.getBearing?.() ?? 0,
    maxZoom: WALKING_COMPANION_MAX_ZOOM,
    duration,
    essential: true,
  })

  return true
}
