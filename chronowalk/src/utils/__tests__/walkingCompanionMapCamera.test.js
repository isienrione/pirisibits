import { describe, expect, it, vi } from 'vitest'
import {
  WALKING_COMPANION_MIN_ZOOM,
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

  it('centers on a single point at the minimum walking zoom', () => {
    const jumpTo = vi.fn()
    const resize = vi.fn()
    const map = {
      jumpTo,
      isStyleLoaded: () => true,
      resize,
      cameraForBounds: vi.fn(),
    }

    applyWalkingCompanionCamera(map, { LngLatBounds: class {} }, [[12.492, 41.891]])

    expect(jumpTo).toHaveBeenCalledWith({
      center: [12.492, 41.891],
      zoom: WALKING_COMPANION_MIN_ZOOM,
    })
  })

  it('uses cameraForBounds and clamps zoom for multi-point routes', () => {
    const jumpTo = vi.fn()
    const map = {
      jumpTo,
      easeTo: vi.fn(),
      isStyleLoaded: () => true,
      resize: vi.fn(),
      cameraForBounds: vi.fn(() => ({
        center: { lng: 12.491, lat: 41.8905 },
        zoom: 13.4,
      })),
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

    applyWalkingCompanionCamera(
      map,
      mapboxgl,
      [
        [12.49, 41.89],
        [12.492, 41.891],
      ],
    )

    expect(map.cameraForBounds).toHaveBeenCalled()
    expect(jumpTo).toHaveBeenCalledWith({
      center: [12.491, 41.8905],
      zoom: WALKING_COMPANION_MIN_ZOOM,
    })
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
