import { describe, expect, it } from 'vitest'
import { estimateWalkedDistanceMeters, formatWalkedDistance, estimateWalkMinutes } from '../tourStats'
import { HEART_OF_ANCIENT_ROME_TOUR } from '../../data/heart-of-ancient-rome-tour'

describe('tourStats', () => {
  it('estimates walked distance across completed legs', () => {
    const meters = estimateWalkedDistanceMeters(HEART_OF_ANCIENT_ROME_TOUR, [
      'colosseum',
      'palatine-hill-cluster',
      'capitoline-hill',
    ])
    expect(meters).toBeGreaterThan(0)
    expect(formatWalkedDistance(meters)).toMatch(/m|km/)
  })

  it('estimates walk minutes from distance', () => {
    expect(estimateWalkMinutes(240)).toBe(3)
    expect(estimateWalkMinutes(null)).toBeNull()
  })
})
