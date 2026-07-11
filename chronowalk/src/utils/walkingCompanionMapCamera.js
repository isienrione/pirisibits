export const WALKING_COMPANION_MIN_ZOOM = 16
export const WALKING_COMPANION_MAX_ZOOM = 17

export const WALKING_COMPANION_MAP_PADDING = {
  top: 48,
  bottom: 56,
  left: 40,
  right: 40,
}

/** Collect lng/lat pairs for a tight walking-card camera frame. */
export function collectWalkingCompanionBoundsPoints({
  userPos = null,
  destination = null,
  previousStop = null,
  routeCoordinates = [],
} = {}) {
  const points = []

  const pushPoint = (point) => {
    if (point?.lat == null || point?.lng == null) return
    points.push([point.lng, point.lat])
  }

  pushPoint(userPos)
  pushPoint(destination)
  pushPoint(previousStop)

  for (const coordinate of routeCoordinates) {
    if (!Array.isArray(coordinate) || coordinate.length < 2) continue
    points.push([coordinate[0], coordinate[1]])
  }

  return points
}

/**
 * Frame the walking companion map on the active leg — never the full tour.
 * Enforces a street-level minimum zoom so cards do not open city-wide.
 */
export function applyWalkingCompanionCamera(
  map,
  mapboxgl,
  points,
  { animate = false, padding = WALKING_COMPANION_MAP_PADDING } = {},
) {
  if (!map || !mapboxgl || !points?.length) return false

  if (points.length === 1) {
    map.jumpTo({
      center: points[0],
      zoom: WALKING_COMPANION_MIN_ZOOM,
    })
    return true
  }

  const bounds = new mapboxgl.LngLatBounds()
  points.forEach(([lng, lat]) => bounds.extend([lng, lat]))

  if (bounds.isEmpty()) return false

  map.fitBounds(bounds, {
    padding,
    maxZoom: WALKING_COMPANION_MAX_ZOOM,
    duration: animate ? 650 : 0,
  })

  if (map.getZoom() < WALKING_COMPANION_MIN_ZOOM) {
    map.setZoom(WALKING_COMPANION_MIN_ZOOM)
  }

  return true
}
