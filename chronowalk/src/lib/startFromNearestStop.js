import { getWaypoint } from '../content/manifest.js'
import { getTourWaypointIds } from '../content/myTourPlan.js'
import { getDistance } from '../utils/distance.js'
import { requestLocationAccess } from './locationAccess.js'

/** One-shot GPS fix for "start from where I am". */
export function resolveCurrentPosition({ timeoutMs = 12000 } = {}) {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(null)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: timeoutMs },
    )
  })
}

/** Nearest visit stop on the traveler's current tour plan. */
export function findNearestTourWaypointId(manifest, context, position) {
  if (!manifest || !position) return null
  const tourIds = getTourWaypointIds(manifest, context)
  if (!tourIds.length) return null

  let nearestId = tourIds[0]
  let bestDist = Infinity
  for (const id of tourIds) {
    const waypoint = getWaypoint(manifest, id)
    if (!waypoint?.geofence) continue
    const dist = getDistance(
      position.lat,
      position.lng,
      waypoint.geofence.lat,
      waypoint.geofence.lng,
    )
    if (dist < bestDist) {
      bestDist = dist
      nearestId = id
    }
  }
  return nearestId
}

/**
 * Ask for location, find the nearest tour stop, and jump there.
 * @returns {'jumped' | 'no_gps' | 'no_stop' | 'cancelled'}
 */
export async function startFromNearestTourStop({
  manifest,
  context,
  state,
  requestJumpToWaypoint,
}) {
  if (!manifest || typeof requestJumpToWaypoint !== 'function') return 'cancelled'

  await requestLocationAccess()
  const position = await resolveCurrentPosition()
  if (!position) return 'no_gps'

  const nearestId = findNearestTourWaypointId(manifest, context, position)
  if (!nearestId) return 'no_stop'

  const jumped = await requestJumpToWaypoint(manifest, nearestId, context, state)
  return jumped ? 'jumped' : 'cancelled'
}
