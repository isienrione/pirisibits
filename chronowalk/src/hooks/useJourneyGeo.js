import { useMemo } from 'react'
import { useGeoLocation, JOURNEY_STATE as GEO_STATE } from './useGeoLocation.js'

export function useJourneyGeo(waypoint, { debugMode = false, simulateAtTarget = false, debugPosition = null } = {}) {
  const target = useMemo(() => {
    if (!waypoint?.geofence) return null
    return {
      lat: waypoint.geofence.lat,
      lng: waypoint.geofence.lng,
    }
  }, [waypoint?.geofence?.lat, waypoint?.geofence?.lng])

  const geo = useGeoLocation({
    target,
    geofenceThresholdM: waypoint?.geofence?.radius_m ?? 40,
    debugMode,
    debugPosition,
    simulateAtTarget,
  })

  return {
    ...geo,
    insideGeofence: geo.state === GEO_STATE.ARRIVAL,
    approachingGeofence:
      geo.distance != null &&
      waypoint?.geofence?.radius_m != null &&
      geo.distance > waypoint.geofence.radius_m &&
      geo.distance <= waypoint.geofence.radius_m * 2,
  }
}
