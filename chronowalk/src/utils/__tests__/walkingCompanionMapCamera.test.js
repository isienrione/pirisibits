import { describe, expect, it, vi } from 'vitest'
import {
  WALKING_COMPANION_MIN_ZOOM,
  applyWalkingCompanionCamera,
  collectWalkingCompanionBoundsPoints,
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

  it('centers on a single point at the minimum walking zoom', () => {
    const jumpTo = vi.fn()
    const map = { jumpTo, fitBounds: vi.fn(), getZoom: () => 14, setZoom: vi.fn() }

    applyWalkingCompanionCamera(map, {}, [[12.492, 41.891]])

    expect(jumpTo).toHaveBeenCalledWith({
      center: [12.492, 41.891],
      zoom: WALKING_COMPANION_MIN_ZOOM,
    })
  })

  it('enforces the minimum zoom after fitBounds', () => {
    const fitBounds = vi.fn()
    const setZoom = vi.fn()
    const map = {
      fitBounds,
      getZoom: () => 13.2,
      setZoom,
      jumpTo: vi.fn(),
    }
    const mapboxgl = {
      LngLatBounds: class {
        constructor() {
          this.empty = false
        }
        extend() {
          return this
        }
        isEmpty() {
          return false
        }
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

    expect(fitBounds).toHaveBeenCalled()
    expect(setZoom).toHaveBeenCalledWith(WALKING_COMPANION_MIN_ZOOM)
  })
})
