import { describe, expect, it, vi } from 'vitest'
import {
  WALKING_COMPANION_MAX_ZOOM,
  applyWalkingCompanionCamera,
  collectWalkingCompanionBoundsPoints,
  expandBoundsMinimumSpan,
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

    expect(points).toHaveLength(6)
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

  it('samples only route endpoints instead of every coordinate', () => {
    const points = collectWalkingCompanionBoundsPoints({
      destination: { lat: 41.891, lng: 12.492 },
      routeCoordinates: [
        [12.49, 41.89],
        [12.4905, 41.8905],
        [12.491, 41.891],
        [12.4915, 41.8915],
        [12.492, 41.892],
      ],
    })

    expect(points).toHaveLength(4)
  })

  it('uses fitBounds for any valid point set', () => {
    const fitBounds = vi.fn()
    const map = {
      fitBounds,
      isStyleLoaded: () => true,
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

    applyWalkingCompanionCamera(map, mapboxgl, [[12.492, 41.891]])

    expect(fitBounds).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        maxZoom: WALKING_COMPANION_MAX_ZOOM,
        duration: 0,
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
