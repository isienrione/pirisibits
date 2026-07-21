import { describe, expect, it, vi } from 'vitest'
import {
  ROUTE_CORE_COLOR,
  ROUTE_GLOW_COLOR,
  ROUTE_LINE_COLOR,
  addGlowingRouteLayers,
  applyWalkingRoutePaint,
} from '../routeLineLayers.js'

describe('routeLineLayers', () => {
  it('uses ChronoWalk orange / ember, not Mapbox blue', () => {
    expect(ROUTE_LINE_COLOR.toLowerCase()).toBe('#e4552e')
    expect(ROUTE_GLOW_COLOR.toLowerCase()).toBe('#e8a13c')
    expect(ROUTE_CORE_COLOR.toLowerCase()).toBe('#ffc078')
    expect(ROUTE_LINE_COLOR).not.toMatch(/#3b82f6|#4264fb|#1d4ed8/i)
  })

  it('stacks outer bloom + casing + bright solid core with full emissive strength', () => {
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
      casingLayerId: 'active-leg-route-casing',
      lineLayerId: 'active-leg-route-line',
      slot: 'top',
    })

    expect(layers).toHaveLength(3)

    const [glow, casing, line] = layers
    expect(glow.id).toBe('active-leg-route-glow')
    expect(glow.slot).toBe('top')
    expect(glow.layout['line-cap']).toBe('round')
    expect(glow.layout['line-join']).toBe('round')
    expect(glow.paint['line-blur']).toBeGreaterThan(0)
    expect(glow.paint['line-opacity']).toBeGreaterThan(0.5)
    expect(glow.paint['line-emissive-strength']).toBe(1)
    expect(glow.paint['line-dasharray']).toBeUndefined()

    expect(casing.id).toBe('active-leg-route-casing')
    expect(casing.paint['line-color']).toBe(ROUTE_LINE_COLOR)
    expect(casing.paint['line-opacity']).toBeGreaterThan(0.4)
    expect(casing.paint['line-emissive-strength']).toBe(1)

    expect(line.id).toBe('active-leg-route-line')
    expect(line.paint['line-color']).toBe(ROUTE_CORE_COLOR)
    expect(line.paint['line-dasharray']).toBeUndefined()
    expect(line.paint['line-emissive-strength']).toBe(1)
    expect(line.paint['line-opacity']).toBe(1)
  })

  it('re-applies walking route paint on existing layers', () => {
    const setPaintProperty = vi.fn()
    const map = {
      getLayer: (id) => Boolean(id),
      setPaintProperty,
    }

    applyWalkingRoutePaint(map, {
      glowLayerId: 'active-leg-route-glow',
      casingLayerId: 'active-leg-route-casing',
      lineLayerId: 'active-leg-route-line',
      dashed: false,
    })

    expect(setPaintProperty).toHaveBeenCalledWith(
      'active-leg-route-glow',
      'line-emissive-strength',
      1,
    )
    expect(setPaintProperty).toHaveBeenCalledWith(
      'active-leg-route-casing',
      'line-color',
      ROUTE_LINE_COLOR,
    )
    expect(setPaintProperty).toHaveBeenCalledWith(
      'active-leg-route-line',
      'line-color',
      ROUTE_CORE_COLOR,
    )
  })
})
