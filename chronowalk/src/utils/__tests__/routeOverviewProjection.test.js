import { describe, expect, it } from 'vitest'
import { buildRouteOverviewModel } from '../routeOverviewProjection'

const stops = [
  {
    id: 'colosseum',
    title: 'Colosseum',
    status: 'completed',
    landmark: { lat: 41.8902, lng: 12.4922 },
  },
  {
    id: 'roman-forum',
    title: 'Roman Forum',
    status: 'current',
    landmark: { lat: 41.8925, lng: 12.4853 },
  },
  {
    id: 'pantheon',
    title: 'Pantheon',
    status: 'upcoming',
    landmark: { lat: 41.8986, lng: 12.4768 },
  },
  {
    id: 'castel',
    title: "Castel Sant'Angelo",
    status: 'upcoming',
    landmark: { lat: 41.903, lng: 12.4663 },
  },
]

describe('routeOverviewProjection', () => {
  it('projects landmark coordinates into an SVG route path', () => {
    const model = buildRouteOverviewModel({
      tour: { stopIds: ['colosseum', 'roman-forum'] },
      stops: stops.slice(0, 2),
      userPos: { lat: 41.8898, lng: 12.4915 },
    })

    expect(model.fullRoutePath).toMatch(/^M /)
    expect(model.stops).toHaveLength(2)
    expect(model.userPoint).toBeTruthy()
  })

  it('uses cached route coordinates when provided', () => {
    const model = buildRouteOverviewModel({
      tour: { stopIds: ['colosseum', 'roman-forum'] },
      stops: stops.slice(0, 2),
      routeCoordinates: [
        [12.4922, 41.8902],
        [12.488, 41.891],
        [12.4853, 41.8925],
      ],
    })

    expect(model.fullRoutePath.split('L').length).toBeGreaterThan(2)
  })

  it('frames the active leg large enough when the tour spans the city', () => {
    const model = buildRouteOverviewModel({
      tour: { stopIds: stops.map((stop) => stop.id) },
      stops,
      activeLeg: { fromId: 'colosseum', toId: 'roman-forum' },
      transitLegActive: true,
      userPos: { lat: 41.8905, lng: 12.49 },
      focus: 'active-leg',
      width: 360,
      height: 220,
    })

    expect(model.activeRoutePath).toMatch(/^M /)
    expect(model.activeRoutePath).toContain(' L ')
    expect(model.fullRoutePath).toBe('')
    expect(model.stops.length).toBeLessThanOrEqual(2)

    const nums = model.activeRoutePath.match(/[\d.]+/g)?.map(Number) ?? []
    // x0 y0 x1 y1 · active leg must span a usable distance, not a ~14px speck.
    const dx = Math.abs(nums[2] - nums[0])
    const dy = Math.abs(nums[3] - nums[1])
    expect(Math.hypot(dx, dy)).toBeGreaterThan(80)
  })
})
