import { describe, expect, it } from 'vitest'
import { isAtWaypoint } from '../waypointProximity'

describe('isAtWaypoint', () => {
  it('returns true when the user is within the geofence', () => {
    expect(
      isAtWaypoint({ lat: 41.8902, lng: 12.4922 }, 'colosseum')
    ).toBe(true)
  })

  it('returns false when the user is far from the landmark', () => {
    expect(
      isAtWaypoint({ lat: 41.91, lng: 12.49 }, 'colosseum')
    ).toBe(false)
  })
})
