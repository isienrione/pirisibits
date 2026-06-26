import { getWaypointGeo } from '../data/waypointGeo'
import { getDistance } from './distance'

/** True when the user is within the waypoint geofence. */
export function isAtWaypoint(userPosition, stopId) {
  const geo = getWaypointGeo(stopId)
  if (!geo?.landmark || userPosition?.lat == null || userPosition?.lng == null) {
    return false
  }

  const distance = getDistance(
    userPosition.lat,
    userPosition.lng,
    geo.landmark.lat,
    geo.landmark.lng
  )

  return distance <= (geo.geofenceThresholdM ?? 30)
}
