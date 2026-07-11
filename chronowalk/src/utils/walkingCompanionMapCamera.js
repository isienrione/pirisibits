export const WALKING_COMPANION_MIN_ZOOM = 15.5
export const WALKING_COMPANION_MAX_ZOOM = 16.75

export const WALKING_COMPANION_MAP_PADDING = {
  top: 48,
  bottom: 56,
  left: 40,
  right: 40,
}

/** Rough Rome tour footprint — reject stray GPS / bad geometry for camera framing. */
export const ROME_CAMERA_BOUNDS = {
  minLat: 41.84,
  maxLat: 41.93,
  minLng: 12.42,
  maxLng: 12.54,
}

const MIN_BOUNDS_SPAN_DEG = 0.0012
const MAX_USER_DEST_DISTANCE_M = 3500

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

function sampleRouteEndpoints(routeCoordinates = []) {
  if (!routeCoordinates.length) return []
  if (routeCoordinates.length === 1) return [routeCoordinates[0]]
  const mid = routeCoordinates[Math.floor(routeCoordinates.length / 2)]
  return [routeCoordinates[0], mid, routeCoordinates[routeCoordinates.length - 1]]
}

/** Collect lng/lat pairs for a tight walking-card camera frame. */
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

  for (const coordinate of sampleRouteEndpoints(routeCoordinates)) {
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

function clampZoom(zoom) {
  if (!Number.isFinite(zoom)) return WALKING_COMPANION_MIN_ZOOM
  return Math.min(WALKING_COMPANION_MAX_ZOOM, Math.max(WALKING_COMPANION_MIN_ZOOM, zoom))
}

/**
 * Frame the walking companion map on the active leg — never the full tour.
 * Uses cameraForBounds so tight or collapsed routes do not break tile loading.
 */
export function applyWalkingCompanionCamera(
  map,
  mapboxgl,
  points,
  { padding = WALKING_COMPANION_MAP_PADDING } = {},
) {
  if (!map || !mapboxgl?.LngLatBounds || !points?.length) return false
  if (!map.isStyleLoaded()) return false

  const validPoints = points.filter(isValidLngLat)
  if (!validPoints.length) return false

  if (validPoints.length === 1) {
    map.jumpTo({
      center: validPoints[0],
      zoom: WALKING_COMPANION_MIN_ZOOM,
    })
    requestAnimationFrame(() => map.resize())
    return true
  }

  const bounds = new mapboxgl.LngLatBounds()
  validPoints.forEach((point) => bounds.extend(point))
  expandBoundsMinimumSpan(bounds)

  const camera = map.cameraForBounds(bounds, {
    padding,
    maxZoom: WALKING_COMPANION_MAX_ZOOM,
  })

  if (!camera?.center || !Number.isFinite(camera.zoom)) {
    map.jumpTo({
      center: validPoints[0],
      zoom: WALKING_COMPANION_MIN_ZOOM,
    })
    requestAnimationFrame(() => map.resize())
    return true
  }

  map.jumpTo({
    center: [camera.center.lng, camera.center.lat],
    zoom: clampZoom(camera.zoom),
  })

  requestAnimationFrame(() => map.resize())
  return true
}
