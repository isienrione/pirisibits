import { describe, expect, it } from 'vitest'
import {
  buildRoutePathD,
  getLandingTierRouteStops,
  LANDING_TIER_ROUTES,
  projectRouteStops,
  ROME_LANDING_MAP_BOUNDS,
} from '../landingTierRoutes.js'

describe('landingTierRoutes', () => {
  it('defines ordered routes for all landing tiers', () => {
    expect(LANDING_TIER_ROUTES['rome-central']).toHaveLength(7)
    expect(LANDING_TIER_ROUTES['rome-essential']).toHaveLength(9)
    expect(LANDING_TIER_ROUTES['rome-complete'].length).toBeGreaterThan(20)
  })

  it('resolves geo stops with titles for each tier', () => {
    for (const tierId of ['rome-central', 'rome-essential', 'rome-complete']) {
      const stops = getLandingTierRouteStops(tierId)
      expect(stops.length).toBe(LANDING_TIER_ROUTES[tierId].length)
      stops.forEach((stop) => {
        expect(stop.lat).toBeTypeOf('number')
        expect(stop.lng).toBeTypeOf('number')
        expect(stop.title).toBeTruthy()
      })
    }
  })

  it('projects stops inside the shared Rome frame', () => {
    const stops = getLandingTierRouteStops('rome-complete')
    const points = projectRouteStops(stops, { bounds: ROME_LANDING_MAP_BOUNDS })
    points.forEach((point) => {
      expect(point.x).toBeGreaterThanOrEqual(8)
      expect(point.x).toBeLessThanOrEqual(92)
      expect(point.y).toBeGreaterThanOrEqual(8)
      expect(point.y).toBeLessThanOrEqual(64)
    })
    expect(buildRoutePathD(points).startsWith('M ')).toBe(true)
  })

  it('shows central tier north of essential on the shared map', () => {
    const central = projectRouteStops(getLandingTierRouteStops('rome-central'), {
      bounds: ROME_LANDING_MAP_BOUNDS,
    })
    const essential = projectRouteStops(getLandingTierRouteStops('rome-essential'), {
      bounds: ROME_LANDING_MAP_BOUNDS,
    })
    const centralAvgY = central.reduce((sum, p) => sum + p.y, 0) / central.length
    const essentialAvgY = essential.reduce((sum, p) => sum + p.y, 0) / essential.length
    expect(centralAvgY).toBeLessThan(essentialAvgY)
  })
})
