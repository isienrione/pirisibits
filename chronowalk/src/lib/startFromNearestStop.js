import { getWaypoint } from '../content/manifest.js'
import { getTourWaypointIds } from '../content/myTourPlan.js'
import { getDistance } from '../utils/distance.js'
import { requestLocationAccess, resolveCurrentPosition } from './locationAccess.js'

export { resolveCurrentPosition } from './locationAccess.js'

/** Nearest visit stop on the traveler's current tour plan (id + meters). */
export function findNearestTourWaypoint(manifest, context, position) {
  if (!manifest || !position) return null
  const tourIds = getTourWaypointIds(manifest, context)
  if (!tourIds.length) return null

  let nearestId = null
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
  if (!nearestId || !Number.isFinite(bestDist)) return null
  return { id: nearestId, distanceM: bestDist }
}

/** Nearest visit stop id on the traveler's current tour plan. */
export function findNearestTourWaypointId(manifest, context, position) {
  return findNearestTourWaypoint(manifest, context, position)?.id ?? null
}

/**
 * Ask for location and resolve the nearest tour stop (no jump).
 * @returns {{ status: 'ok', id: string, distanceM: number, position: {lat,lng} } | { status: 'no_gps'|'no_stop' }}
 */
export async function resolveNearestTourStop({ manifest, context }) {
  if (!manifest) return { status: 'no_stop' }
  await requestLocationAccess()
  const position = await resolveCurrentPosition()
  if (!position) return { status: 'no_gps' }
  const nearest = findNearestTourWaypoint(manifest, context, position)
  if (!nearest) return { status: 'no_stop' }
  return { status: 'ok', ...nearest, position }
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

  const nearest = await resolveNearestTourStop({ manifest, context })
  if (nearest.status !== 'ok') return nearest.status

  const jumped = await requestJumpToWaypoint(manifest, nearest.id, context, state)
  return jumped ? 'jumped' : 'cancelled'
}

export function formatWalkDistance(meters, t) {
  if (!Number.isFinite(meters)) return null
  if (meters < 1000) return t('home.resume.distanceM', { meters: Math.round(meters) })
  return t('home.resume.distanceKm', { km: (meters / 1000).toFixed(1) })
}
