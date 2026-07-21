import { describe, expect, it } from 'vitest'
import { applyDevGeofenceOverrides } from '../applyDevGeofenceOverrides.js'
import { SANTIAGO_DEV_WAYPOINT_GEOFENCES } from '../devGeofenceOverrides.santiago.js'
import { loadRomeManifest, clearRomeManifestCache } from '../manifest.js'

describe('applyDevGeofenceOverrides', () => {
  it('remaps forum waypoints to Santiago coordinates', () => {
    const rome = loadRomeManifest()
    clearRomeManifestCache()

    const manifest = applyDevGeofenceOverrides(
      {
        waypoints: {
          w06: { title: 'Basilica', geofence: { lat: 41.89, lng: 12.48, radius_m: 40 } },
          pause: { title: 'Forum rest', geofence: { lat: 41.89, lng: 12.48, radius_m: 80 } },
          w11_12: { title: 'Arch of Septimius Severus', geofence: { lat: 41.89, lng: 12.48, radius_m: 40 } },
          w99: { title: 'Other', geofence: { lat: 1, lng: 2, radius_m: 30 } },
        },
      },
      'santiago',
    )

    expect(manifest.waypoints.w06.geofence).toEqual({
      lat: SANTIAGO_DEV_WAYPOINT_GEOFENCES.w06.lat,
      lng: SANTIAGO_DEV_WAYPOINT_GEOFENCES.w06.lng,
      radius_m: SANTIAGO_DEV_WAYPOINT_GEOFENCES.w06.radius_m,
    })
    expect(manifest.waypoints.w06._devGeofenceOverride.label).toMatch(/Starbucks/i)
    expect(manifest.waypoints.pause._devGeofenceOverride.label).toMatch(/Quinoa/i)
    expect(manifest.waypoints.w11_12._devGeofenceOverride.label).toMatch(/Bidasoa/i)
    expect(manifest.waypoints.w99.geofence.lat).toBe(1)
    expect(manifest._devGeofenceOverrides.mode).toBe('santiago')
    expect(manifest._devGeofenceOverrides.waypointIds).toEqual(
      expect.arrayContaining(['pause', 'w11_12']),
    )
    expect(rome.waypointsById.w06.geofence.lat).toBe(41.89175)
  })
})
