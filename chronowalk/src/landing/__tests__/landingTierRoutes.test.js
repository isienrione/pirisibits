import { describe, expect, it } from 'vitest'
import {
  buildBoundsFromStops,
  buildRoutePathD,
  getLandingTierMapBounds,
  getLandingTierMapStops,
  getLandingTierRouteStops,
  LANDING_TIER_ROUTES,
  projectRouteStops,
  ROME_LANDING_MAP_BOUNDS,
} from '../landingTierRoutes.js'

describe('landingTierRoutes', () => {
  it('defines ordered routes for all landing tiers', () => {
    // 8 centro kebabs (Pantheon once) + Via Appia encore — not unlock authority.
    expect(LANDING_TIER_ROUTES['rome-central']).toHaveLength(9)
    expect(LANDING_TIER_ROUTES['rome-central']).toContain('appian-way')
    expect(LANDING_TIER_ROUTES['rome-essential']).toHaveLength(12)
    expect(LANDING_TIER_ROUTES['rome-complete'].length).toBeGreaterThan(20)
  })

  it('includes Trajan\'s Market in Roma Historica and ancient hills in Roma Antica', () => {
    expect(LANDING_TIER_ROUTES['rome-central'][0]).toBe('trajan-market')
    expect(LANDING_TIER_ROUTES['rome-essential']).toEqual(
      expect.arrayContaining([
        'palatine-hill-cluster',
        'capitoline-hill',
        'circus-maximus',
      ]),
    )
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

  it('projects map stops inside each tier map frame', () => {
    for (const tierId of ['rome-central', 'rome-essential', 'rome-complete']) {
      const stops = getLandingTierMapStops(tierId)
      const bounds = getLandingTierMapBounds(tierId)
      const points = projectRouteStops(stops, { bounds, padding: 7 })
      points.forEach((point) => {
        expect(point.x).toBeGreaterThanOrEqual(7)
        expect(point.x).toBeLessThanOrEqual(93)
        expect(point.y).toBeGreaterThanOrEqual(7)
        expect(point.y).toBeLessThanOrEqual(73)
      })
      expect(buildRoutePathD(points).startsWith('M ')).toBe(true)
    }
  })

  it('keeps Historica map on centro cluster while inventory lists Appia encore', () => {
    expect(getLandingTierRouteStops('rome-central').map((s) => s.id)).toContain('appian-way')
    expect(getLandingTierMapStops('rome-central').map((s) => s.id)).not.toContain('appian-way')
    expect(getLandingTierMapStops('rome-central')).toHaveLength(8)
  })

  it('zooms central and ancient tiers tighter than complete', () => {
    const centralSpan = spanForBounds(getLandingTierMapBounds('rome-central'))
    const essentialSpan = spanForBounds(getLandingTierMapBounds('rome-essential'))
    const completeSpan = spanForBounds(getLandingTierMapBounds('rome-complete'))

    expect(centralSpan).toBeLessThan(completeSpan)
    expect(essentialSpan).toBeLessThan(completeSpan)
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

function spanForBounds(bounds) {
  return bounds.maxLat - bounds.minLat + (bounds.maxLng - bounds.minLng)
}
