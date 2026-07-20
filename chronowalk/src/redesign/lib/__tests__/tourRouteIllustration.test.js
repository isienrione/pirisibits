import { describe, expect, it } from 'vitest'
import {
  buildIllustratedRouteLayout,
  shortStopLabel,
} from '../tourRouteIllustration.js'

describe('tourRouteIllustration', () => {
  it('lays out stops on a winding vertical path', () => {
    const stops = Array.from({ length: 6 }, (_, i) => ({
      id: `w0${i}`,
      title: `Stop ${i + 1}`,
    }))
    const { points, height, pathD } = buildIllustratedRouteLayout(stops)

    expect(points).toHaveLength(6)
    expect(points[0].y).toBeLessThan(points[5].y)
    expect(height).toBeGreaterThan(200)
    expect(pathD).toMatch(/^M /)
  })

  it('truncates long stop labels', () => {
    expect(shortStopLabel('The Temple of Venus and Rome')).toMatch(/…$/)
    expect(shortStopLabel('Colosseum')).toBe('Colosseum')
  })
})
