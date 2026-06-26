import { describe, expect, it } from 'vitest'
import { estimateWalkedDistanceMeters, formatWalkedDistance, estimateWalkMinutes } from '../tourStats'
import { ROME_CORE_TOUR } from '../../data/rome-core-tour'

describe('tourStats', () => {
  it('estimates walked distance across completed legs', () => {
    const meters = estimateWalkedDistanceMeters(ROME_CORE_TOUR, [
      'colosseum',
      'capitoline-hill',
      'pantheon',
    ])
    expect(meters).toBeGreaterThan(0)
    expect(formatWalkedDistance(meters)).toMatch(/m|km/)
  })

  it('estimates walk minutes from distance', () => {
    expect(estimateWalkMinutes(240)).toBe(3)
    expect(estimateWalkMinutes(null)).toBeNull()
  })
})
