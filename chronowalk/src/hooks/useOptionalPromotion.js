import { useEffect, useMemo } from 'react'
import {
  canPromoteOptionalWaypoint,
  getOptionalWaypointIds,
} from '../content/optionalPromotion.js'
import { getWaypoint } from '../content/manifest.js'
import { useGeoLocation, JOURNEY_STATE as GEO_STATE } from './useGeoLocation.js'

function useOptionalWaypointGeo(waypoint) {
  const target = useMemo(() => {
    if (!waypoint?.geofence) return null
    return {
      lat: waypoint.geofence.lat,
      lng: waypoint.geofence.lng,
    }
  }, [waypoint?.geofence?.lat, waypoint?.geofence?.lng])

  return useGeoLocation({
    target,
    geofenceThresholdM: waypoint?.geofence?.radius_m ?? 50,
  })
}

/**
 * Watch optional waypoints during the promotion window; fire onPromote when GPS enters geofence.
 */
export function useOptionalPromotion(manifest, context, { onPromote, enabled = true }) {
  const optionalIds = useMemo(
    () => (manifest ? getOptionalWaypointIds(manifest, context.path) : []),
    [manifest, context.path]
  )

  const w04 = optionalIds.includes('w04') ? getWaypoint(manifest, 'w04') : null
  const w04Geo = useOptionalWaypointGeo(w04)

  useEffect(() => {
    if (!enabled || !manifest || !onPromote) return
    if (w04Geo.state !== GEO_STATE.ARRIVAL) return

    for (const waypointId of optionalIds) {
      if (
        !canPromoteOptionalWaypoint(manifest, {
          path: context.path,
          waypointId,
          promotedOptionalIds: context.promotedOptionalIds ?? [],
          completedWaypointIds: context.completedWaypointIds ?? [],
          currentSequenceIndex: context.currentSequenceIndex ?? 0,
        })
      ) {
        continue
      }

      onPromote(waypointId)
      break
    }
  }, [
    context.completedWaypointIds,
    context.currentSequenceIndex,
    context.path,
    context.promotedOptionalIds,
    enabled,
    manifest,
    onPromote,
    optionalIds,
    w04Geo.state,
  ])
}
