import { describe, expect, it } from 'vitest'
import { buildRouteOverviewModel } from '../routeOverviewProjection'

const stops = [
  {
    id: 'colosseum',
    title: 'Colosseum',
    status: 'current',
    landmark: { lat: 41.8902, lng: 12.4922 },
  },
  {
    id: 'roman-forum',
    title: 'Roman Forum',
    status: 'upcoming',
    landmark: { lat: 41.8925, lng: 12.4853 },
  },
]

describe('routeOverviewProjection', () => {
  it('projects landmark coordinates into an SVG route path', () => {
    const model = buildRouteOverviewModel({
      tour: { stopIds: ['colosseum', 'roman-forum'] },
      stops,
      userPos: { lat: 41.8898, lng: 12.4915 },
    })

    expect(model.fullRoutePath).toMatch(/^M /)
    expect(model.stops).toHaveLength(2)
    expect(model.userPoint).toBeTruthy()
  })

  it('uses cached route coordinates when provided', () => {
    const model = buildRouteOverviewModel({
      tour: { stopIds: ['colosseum', 'roman-forum'] },
      stops,
      routeCoordinates: [
        [12.4922, 41.8902],
        [12.488, 41.891],
        [12.4853, 41.8925],
      ],
    })

    expect(model.fullRoutePath.split('L').length).toBeGreaterThan(2)
  })
})
