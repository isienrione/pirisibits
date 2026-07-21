import { describe, expect, it, vi } from 'vitest'
import {
  WALKING_COMPANION_MAX_ZOOM,
  WALKING_COMPANION_PITCH,
  applyWalkingCompanionCamera,
  collectWalkingCompanionBoundsPoints,
  expandBoundsMinimumSpan,
  sampleRouteCoordinates,
} from '../walkingCompanionMapCamera'

describe('walkingCompanionMapCamera', () => {
  it('collects user, destination, previous stop, and route coordinates', () => {
    const points = collectWalkingCompanionBoundsPoints({
      userPos: { lat: 41.89, lng: 12.49 },
      destination: { lat: 41.891, lng: 12.492 },
      previousStop: { lat: 41.889, lng: 12.488 },
      routeCoordinates: [
        [12.489, 41.8895],
        [12.491, 41.8905],
      ],
    })

    expect(points).toHaveLength(5)
  })

  it('ignores invalid coordinates', () => {
    const points = collectWalkingCompanionBoundsPoints({
      userPos: { lat: 999, lng: 12.49 },
      destination: { lat: 41.891, lng: 12.492 },
    })

    expect(points).toEqual([[12.492, 41.891]])
  })

  it('omits user position when includeUser is false', () => {
    const points = collectWalkingCompanionBoundsPoints({
      userPos: { lat: 41.89, lng: 12.49 },
      destination: { lat: 41.891, lng: 12.492 },
      includeUser: false,
    })

    expect(points).toEqual([[12.492, 41.891]])
  })

  it('samples the full route path for framing, not only endpoints', () => {
    const routeCoordinates = Array.from({ length: 40 }, (_, i) => [
      12.49 + i * 0.00005,
      41.89 + i * 0.00004,
    ])

    const samples = sampleRouteCoordinates(routeCoordinates, 10)
    expect(samples).toHaveLength(10)
    expect(samples[0]).toEqual(routeCoordinates[0])
    expect(samples[samples.length - 1]).toEqual(routeCoordinates[routeCoordinates.length - 1])

    const points = collectWalkingCompanionBoundsPoints({
      destination: { lat: 41.891, lng: 12.492 },
      routeCoordinates,
    })

    // destination + densely sampled route (capped)
    expect(points.length).toBeGreaterThan(10)
  })

  it('uses fitBounds with pitch for the tilted hero walk camera', () => {
    const fitBounds = vi.fn()
    const map = {
      fitBounds,
      isStyleLoaded: () => true,
      getBearing: () => 12,
    }
    const mapboxgl = {
      LngLatBounds: class {
        constructor() {
          this.points = []
        }
        extend(point) {
          this.points.push(point)
        }
        getNorthEast() {
          return { lat: 41.891, lng: 12.492 }
        }
        getSouthWest() {
          return { lat: 41.89, lng: 12.49 }
        }
        setNorthEast() {}
        setSouthWest() {}
      },
    }

    applyWalkingCompanionCamera(map, mapboxgl, [[12.492, 41.891]], { duration: 700 })

    expect(fitBounds).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        maxZoom: WALKING_COMPANION_MAX_ZOOM,
        pitch: WALKING_COMPANION_PITCH,
        bearing: 12,
        duration: 700,
      }),
    )
  })

  it('expands collapsed bounds to a minimum span', () => {
    const bounds = {
      getNorthEast: () => ({ lat: 41.8905, lng: 12.48835 }),
      getSouthWest: () => ({ lat: 41.8905, lng: 12.48835 }),
      setNorthEast: vi.fn(),
      setSouthWest: vi.fn(),
    }

    expandBoundsMinimumSpan(bounds)

    expect(bounds.setNorthEast).toHaveBeenCalled()
    expect(bounds.setSouthWest).toHaveBeenCalled()
  })
})
