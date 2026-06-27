import { describe, expect, it } from 'vitest'
import { bearingBetween } from '../mapBearing'

describe('bearingBetween', () => {
  it('returns a bearing between two coordinates', () => {
    const from = { lat: 41.89, lng: 12.49 }
    const to = { lat: 41.9, lng: 12.5 }
    const bearing = bearingBetween(from, to)

    expect(bearing).toBeGreaterThanOrEqual(0)
    expect(bearing).toBeLessThan(360)
  })
})
