import {
  COLOSSEUM,
  COLOSSEUM_ARRIVAL_RADIUS_M,
  DEBUG_USER_POS,
  GEOFENCE_ARRIVAL_THRESHOLD_M,
} from './colosseum'
import {
  PANTHEON,
  PANTHEON_ARRIVAL_RADIUS_M,
  PANTHEON_DEBUG_USER_POS,
  PANTHEON_GEOFENCE_ARRIVAL_THRESHOLD_M,
} from './pantheon'

/** Map / geofence settings per waypoint — extend when adding new stops. */
export const WAYPOINT_GEO = {
  colosseum: {
    id: 'colosseum',
    title: 'Colosseum',
    landmark: COLOSSEUM,
    debugPosition: DEBUG_USER_POS,
    geofenceThresholdM: GEOFENCE_ARRIVAL_THRESHOLD_M,
    arrivalRadiusM: COLOSSEUM_ARRIVAL_RADIUS_M,
    mapZoom: 15,
  },
  pantheon: {
    id: 'pantheon',
    title: 'Pantheon',
    landmark: PANTHEON,
    debugPosition: PANTHEON_DEBUG_USER_POS,
    geofenceThresholdM: PANTHEON_GEOFENCE_ARRIVAL_THRESHOLD_M,
    arrivalRadiusM: PANTHEON_ARRIVAL_RADIUS_M,
    mapZoom: 17,
  },
}

export const getWaypointGeo = (waypointId) => WAYPOINT_GEO[waypointId] ?? null
