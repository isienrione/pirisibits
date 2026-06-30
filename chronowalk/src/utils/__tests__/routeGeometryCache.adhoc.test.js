import { describe, expect, it, beforeEach } from 'vitest'
import {
  cacheAdhocWalkingDirections,
  getAdhocWalkingDirections,
} from '../routeGeometryCache'

describe('adhoc walking directions cache', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('stores and retrieves adhoc walking directions by coordinate pair', () => {
    const origin = { lat: 41.8902, lng: 12.4922 }
    const destination = { lat: 41.8986, lng: 12.4768 }
    const directions = {
      distanceM: 420,
      steps: [{ instruction: 'Head west', distanceM: 420, type: 'depart' }],
      geometry: { type: 'LineString', coordinates: [[12.4922, 41.8902], [12.4768, 41.8986]] },
    }

    cacheAdhocWalkingDirections(origin, destination, directions)

    expect(getAdhocWalkingDirections(origin, destination)).toEqual(directions)
    expect(getAdhocWalkingDirections(destination, origin)).toBeNull()
  })
})
