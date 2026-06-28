import { beforeEach, describe, expect, it } from 'vitest'
import {
  cacheLegDirections,
  cacheLegRoute,
  cacheTourRoute,
  getLegRouteCoordinates,
  getLegWalkingSteps,
  getTourRouteCoordinates,
  resetRouteGeometryCache,
} from '../routeGeometryCache'

describe('routeGeometryCache', () => {
  beforeEach(() => {
    resetRouteGeometryCache('rome-core')
  })

  it('stores and retrieves tour and leg route coordinates', () => {
    cacheTourRoute('rome-core', {
      type: 'LineString',
      coordinates: [
        [12.49, 41.89],
        [12.5, 41.9],
      ],
    })

    cacheLegRoute('rome-core', 'colosseum', 'roman-forum', {
      type: 'LineString',
      coordinates: [
        [12.492, 41.891],
        [12.495, 41.893],
      ],
    })

    cacheLegDirections('rome-core', 'colosseum', 'roman-forum', [
      { instruction: 'Head northeast', distanceM: 120, type: 'depart' },
    ])

    expect(getTourRouteCoordinates('rome-core')).toHaveLength(2)
    expect(getLegRouteCoordinates('rome-core', 'colosseum', 'roman-forum')).toHaveLength(2)
    expect(getLegWalkingSteps('rome-core', 'colosseum', 'roman-forum')?.[0]?.instruction).toBe(
      'Head northeast'
    )
  })
})
