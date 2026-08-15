import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../content/myTourPlan.js', () => ({
  getTourWaypointIds: () => ['far', 'near'],
}))

vi.mock('../../content/manifest.js', () => ({
  getWaypoint: (_manifest, id) =>
    ({
      far: { id: 'far', geofence: { lat: 41.91, lng: 12.51 } },
      near: { id: 'near', geofence: { lat: 41.8902, lng: 12.4922 } },
    })[id],
}))

vi.mock('../locationAccess.js', () => ({
  requestLocationAccess: vi.fn(async () => 'granted'),
}))

import {
  findNearestTourWaypointId,
  startFromNearestTourStop,
} from '../startFromNearestStop.js'
import { requestLocationAccess } from '../locationAccess.js'

describe('startFromNearestStop', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('picks the closest tour waypoint with a geofence', () => {
    const nearest = findNearestTourWaypointId(
      {},
      {},
      { lat: 41.8903, lng: 12.4923 },
    )
    expect(nearest).toBe('near')
  })

  it('jumps to the nearest stop after a GPS fix', async () => {
    vi.stubGlobal('navigator', {
      geolocation: {
        getCurrentPosition: (success) =>
          success({ coords: { latitude: 41.8903, longitude: 12.4923 } }),
      },
    })
    const requestJumpToWaypoint = vi.fn(async () => true)
    const result = await startFromNearestTourStop({
      manifest: {},
      context: {},
      state: 'walking',
      requestJumpToWaypoint,
    })
    expect(requestLocationAccess).toHaveBeenCalled()
    expect(requestJumpToWaypoint).toHaveBeenCalledWith({}, 'near', {}, 'walking')
    expect(result).toBe('jumped')
  })

  it('returns no_gps when location is unavailable', async () => {
    vi.stubGlobal('navigator', {
      geolocation: {
        getCurrentPosition: (_success, error) => error?.(new Error('denied')),
      },
    })
    const result = await startFromNearestTourStop({
      manifest: {},
      context: {},
      state: 'walking',
      requestJumpToWaypoint: vi.fn(),
    })
    expect(result).toBe('no_gps')
  })
})
