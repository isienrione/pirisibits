import { describe, expect, it } from 'vitest'
import { getLandingTierStats } from '../landingTierStats.js'

describe('getLandingTierStats', () => {
  it('returns audio, route-time range, and distance labels for each tier', () => {
    for (const tierId of ['rome-central', 'rome-essential', 'rome-complete']) {
      const stats = getLandingTierStats(tierId)
      expect(stats.audioLabel).toMatch(/^~/)
      expect(stats.routeTimeLabel).toMatch(/^~/)
      expect(stats.routeTimeLabel).toMatch(/–/)
      expect(stats.distanceLabel).toMatch(/km \/ [\d.]+ mi$/)
      expect(stats.line).toContain('·')
    }
  })

  it('estimates tour time as narration plus walking, with a high-end buffer', () => {
    const stats = getLandingTierStats('rome-central')
    const base = stats.audioMinutes + stats.walkMinutes
    expect(stats.routeTimeMinMinutes).toBeLessThanOrEqual(base)
    expect(stats.routeTimeMaxMinutes).toBeGreaterThan(base)
  })

  it('uses product-truth distance for the complete tier', () => {
    const stats = getLandingTierStats('rome-complete')
    expect(stats.distanceKm).toBe(8)
    expect(stats.audioMinutes).toBeGreaterThan(180)
    expect(stats.routeTimeMaxMinutes).toBeGreaterThan(stats.routeTimeMinMinutes)
  })
})
