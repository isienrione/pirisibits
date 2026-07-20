import { SANTIAGO_DEV_WAYPOINT_GEOFENCES } from './devGeofenceOverrides.santiago.js'

/**
 * @param {import('./romeManifestZod.schema.js').RomeManifest} manifest
 * @param {'santiago'} mode
 */
export function applyDevGeofenceOverrides(manifest, mode) {
  if (mode !== 'santiago') return manifest

  const overrides = SANTIAGO_DEV_WAYPOINT_GEOFENCES
  const waypointsById = { ...manifest.waypoints }

  for (const [waypointId, site] of Object.entries(overrides)) {
    const waypoint = waypointsById[waypointId]
    if (!waypoint?.geofence) continue

    waypointsById[waypointId] = {
      ...waypoint,
      geofence: {
        lat: site.lat,
        lng: site.lng,
        radius_m: site.radius_m,
      },
      _devGeofenceOverride: {
        mode: 'santiago',
        label: site.label,
      },
    }
  }

  return {
    ...manifest,
    waypoints: waypointsById,
    _devGeofenceOverrides: {
      mode: 'santiago',
      waypointIds: Object.keys(overrides),
    },
  }
}
