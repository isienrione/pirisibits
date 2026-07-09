import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  applyGeofenceOverride,
  applyWaypointGeoOverride,
  getChileGeofenceOverride,
  isTestLocationOverrideActive,
} from '../testLocationOverrides.js'

vi.mock('../../config/env.js', () => ({
  getTestLocationRegion: vi.fn(() => null),
}))

import { getTestLocationRegion } from '../../config/env.js'

describe('testLocationOverrides', () => {
  afterEach(() => {
    vi.mocked(getTestLocationRegion).mockReturnValue(null)
  })

  it('returns Rome geofences when test region is inactive', () => {
    const geofence = { lat: 41.8902, lng: 12.4922, radius_m: 45 }
    expect(applyGeofenceOverride('w01', geofence)).toEqual(geofence)
    expect(isTestLocationOverrideActive()).toBe(false)
  })

  it('substitutes Colosseum with Teatro Municipal de Las Condes in Chile mode', () => {
    vi.mocked(getTestLocationRegion).mockReturnValue('chile')

    const override = getChileGeofenceOverride('w01')
    expect(override?.lat).toBeCloseTo(-33.41619, 4)
    expect(override?.lng).toBeCloseTo(-70.59582, 4)

    const geofence = applyGeofenceOverride('w01', { lat: 41.8902, lng: 12.4922, radius_m: 45 })
    expect(geofence.lat).toBeCloseTo(-33.41619, 4)
    expect(geofence.lng).toBeCloseTo(-70.59582, 4)
    expect(geofence.radius_m).toBe(45)
  })

  it('substitutes Spanish Steps with Apumanque in Chile mode', () => {
    vi.mocked(getTestLocationRegion).mockReturnValue('chile')

    const geofence = applyGeofenceOverride('w15', { lat: 41.90597, lng: 12.48259, radius_m: 35 })
    expect(geofence.lat).toBeCloseTo(-33.40972, 4)
    expect(geofence.lng).toBeCloseTo(-70.5675, 4)
  })

  it('substitutes Living City stops with new Las Condes addresses', () => {
    vi.mocked(getTestLocationRegion).mockReturnValue('chile')

    const trevi = applyGeofenceOverride('w16', { lat: 41.90094, lng: 12.48331, radius_m: 35 })
    expect(trevi.lat).toBeCloseTo(-33.38813, 4)
    expect(trevi.lng).toBeCloseTo(-70.53943, 4)

    const pantheon = applyGeofenceOverride('w17', { lat: 41.89885, lng: 12.47687, radius_m: 40 })
    expect(pantheon.lat).toBeCloseTo(-33.408143, 4)
    expect(pantheon.lng).toBeCloseTo(-70.522404, 4)

    const navona = applyGeofenceOverride('w18', { lat: 41.89918, lng: 12.47306, radius_m: 45 })
    expect(navona.lat).toBeCloseTo(-33.417018, 4)
    expect(navona.lng).toBeCloseTo(-70.595435, 4)
  })

  it('maps legacy colosseum slug through manifest id', () => {
    vi.mocked(getTestLocationRegion).mockReturnValue('chile')

    const geo = applyWaypointGeoOverride('colosseum', {
      id: 'colosseum',
      landmark: { lat: 41.8902, lng: 12.4922 },
      debugPosition: { lat: 41.8902, lng: 12.4922 },
      geofenceThresholdM: 30,
    })

    expect(geo.landmark.lat).toBeCloseTo(-33.41619, 4)
    expect(geo.geofenceThresholdM).toBe(45)
  })
})
