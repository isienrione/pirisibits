import { describe, expect, it, vi } from 'vitest'
import {
  ROUTE_GLOW_COLOR,
  ROUTE_LINE_COLOR,
  addGlowingRouteLayers,
  applyWalkingRoutePaint,
} from '../routeLineLayers.js'

describe('routeLineLayers', () => {
  it('uses ChronoWalk orange, not Mapbox blue', () => {
    expect(ROUTE_LINE_COLOR.toLowerCase()).toBe('#e4552e')
    expect(ROUTE_GLOW_COLOR.toLowerCase()).toBe('#e8a13c')
    expect(ROUTE_LINE_COLOR).not.toMatch(/#3b82f6|#4264fb|#1d4ed8/i)
  })

  it('stacks a blurred glow under a crisp dashed line with full emissive strength', () => {
    const layers = []
    const map = {
      getLayer: () => null,
      addLayer: (layer) => {
        layers.push(layer)
      },
    }

    addGlowingRouteLayers(map, {
      sourceId: 'active-leg-route',
      glowLayerId: 'active-leg-route-glow',
      lineLayerId: 'active-leg-route-line',
      slot: 'middle',
    })

    expect(layers).toHaveLength(2)

    const [glow, line] = layers
    expect(glow.id).toBe('active-leg-route-glow')
    expect(glow.slot).toBe('middle')
    expect(glow.layout['line-cap']).toBe('round')
    expect(glow.layout['line-join']).toBe('round')
    expect(glow.paint['line-blur']).toBeGreaterThan(0)
    expect(glow.paint['line-opacity']).toBeLessThan(0.5)
    expect(glow.paint['line-emissive-strength']).toBe(1)
    expect(glow.paint['line-dasharray']).toBeUndefined()

    expect(line.id).toBe('active-leg-route-line')
    expect(line.paint['line-dasharray']).toEqual([1.6, 1.4])
    expect(line.paint['line-emissive-strength']).toBe(1)
    expect(line.paint['line-color']).toBe(ROUTE_LINE_COLOR)
  })

  it('re-applies walking route paint on existing layers', () => {
    const setPaintProperty = vi.fn()
    const map = {
      getLayer: (id) => Boolean(id),
      setPaintProperty,
    }

    applyWalkingRoutePaint(map, {
      glowLayerId: 'active-leg-route-glow',
      lineLayerId: 'active-leg-route-line',
    })

    expect(setPaintProperty).toHaveBeenCalledWith(
      'active-leg-route-glow',
      'line-emissive-strength',
      1,
    )
    expect(setPaintProperty).toHaveBeenCalledWith(
      'active-leg-route-line',
      'line-dasharray',
      [1.6, 1.4],
    )
  })
})
