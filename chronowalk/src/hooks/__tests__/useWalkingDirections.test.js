import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import {
  useWalkingDirections,
  loadTourLegDirections,
  ROUTE_UNAVAILABLE_COPY,
} from '../useWalkingDirections.js'

vi.mock('../../config/env.js', () => ({
  env: { mapboxToken: 'pk.test-token' },
}))

vi.mock('../../services/fetchWalkingRoute.js', () => ({
  fetchWalkingDirections: vi.fn(),
}))

vi.mock('../../utils/routeGeometryCache.js', () => ({
  getAdhocWalkingDirections: vi.fn(() => null),
  cacheAdhocWalkingDirections: vi.fn(),
  getLegWalkingSteps: vi.fn(() => null),
  getLegRouteCoordinates: vi.fn(() => null),
  cacheLegDirections: vi.fn(),
  cacheLegRoute: vi.fn(),
}))

vi.mock('../../navigation/canonicalWalkingLegs.js', () => ({
  CANONICAL_LEG_MISSING_COPY: 'Offline route for this leg isn’t prepared yet.',
  getCanonicalWalkingLeg: vi.fn(() => null),
}))

import { env } from '../../config/env.js'
import { fetchWalkingDirections } from '../../services/fetchWalkingRoute.js'
import {
  getAdhocWalkingDirections,
  getLegWalkingSteps,
  getLegRouteCoordinates,
} from '../../utils/routeGeometryCache.js'
import { getCanonicalWalkingLeg } from '../../navigation/canonicalWalkingLegs.js'

const legSteps = [
  { instruction: 'Head down the Clivus Palatinus', distanceM: 180, type: 'depart' },
  { instruction: 'Arrive at the Arch of Titus', distanceM: 52, type: 'arrive' },
]

const legFallback = {
  tourId: 'rome',
  fromId: 'w04',
  toId: 'w03',
  from: { lat: 41.8886, lng: 12.4872 },
  to: { lat: 41.8905, lng: 12.48835 },
}

describe('useWalkingDirections', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    env.mapboxToken = 'pk.test-token'
    getLegWalkingSteps.mockReturnValue(null)
    getLegRouteCoordinates.mockReturnValue(null)
    getAdhocWalkingDirections.mockReturnValue(null)
    getCanonicalWalkingLeg.mockReturnValue(null)
  })

  it('falls back to tour-leg directions when GPS routing fails', async () => {
    const legResult = {
      steps: legSteps,
      geometry: { type: 'LineString', coordinates: [[12.4872, 41.8886], [12.48835, 41.8905]] },
      distanceM: 232,
      durationSec: 180,
    }

    fetchWalkingDirections.mockImplementation(async (from, to) => {
      if (from.lat === 41.889 && to.lat === 41.8905) return null
      if (from.lat === 41.8886 && to.lat === 41.8905) return legResult
      return null
    })

    const { result } = renderHook(() =>
      useWalkingDirections({
        origin: { lat: 41.889, lng: 12.4878 },
        destination: { lat: 41.8905, lng: 12.48835 },
        legFallback,
        destinationName: 'Arch of Titus',
      }),
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBeNull()
    expect(result.current.directions?.steps?.[0]?.instruction).toBe('Head down the Clivus Palatinus')
  })

  it('uses cached leg steps without calling Mapbox again', async () => {
    getLegWalkingSteps.mockReturnValue(legSteps)
    fetchWalkingDirections.mockResolvedValue(null)

    const cached = await loadTourLegDirections(legFallback, 'pk.test-token', {
      destinationName: 'Arch of Titus',
    })

    expect(cached?.steps).toEqual(legSteps)
    expect(fetchWalkingDirections).not.toHaveBeenCalled()
    expect(getCanonicalWalkingLeg).not.toHaveBeenCalled()
  })

  it('prefers packaged canonical legs before Mapbox for stop→stop', async () => {
    getCanonicalWalkingLeg.mockReturnValue({
      fromId: 'w04',
      toId: 'w03',
      steps: legSteps,
      geometry: { type: 'LineString', coordinates: [[12.4872, 41.8886], [12.48835, 41.8905]] },
      distanceM: 232,
      durationSec: 180,
      source: 'canonical-leg',
      version: 'rome-canonical-legs-v1',
    })

    const result = await loadTourLegDirections(legFallback, 'pk.test-token')
    expect(result?.source).toBe('canonical-leg')
    expect(fetchWalkingDirections).not.toHaveBeenCalled()
  })

  it('serves cached tour-leg directions when Vite Mapbox token is missing', async () => {
    env.mapboxToken = ''
    getLegWalkingSteps.mockReturnValue(legSteps)
    getLegRouteCoordinates.mockReturnValue([
      [12.4872, 41.8886],
      [12.48835, 41.8905],
    ])

    const { result } = renderHook(() =>
      useWalkingDirections({
        origin: { lat: 41.889, lng: 12.4878 },
        destination: { lat: 41.8905, lng: 12.48835 },
        legFallback,
        destinationName: 'Arch of Titus',
      }),
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(fetchWalkingDirections).not.toHaveBeenCalled()
    expect(result.current.error).toBeNull()
    expect(result.current.directions?.source).toBe('leg-cache')
    expect(result.current.directions?.steps?.[0]?.instruction).toBe(
      'Head down the Clivus Palatinus',
    )
  })

  it('serves packaged canonical legs offline without a Vite token', async () => {
    env.mapboxToken = ''
    getCanonicalWalkingLeg.mockReturnValue({
      fromId: 'w04',
      toId: 'w03',
      steps: legSteps,
      geometry: { type: 'LineString', coordinates: [[12.4872, 41.8886], [12.48835, 41.8905]] },
      distanceM: 232,
      durationSec: 180,
      source: 'canonical-leg',
      version: 'rome-canonical-legs-v1',
    })

    const { result } = renderHook(() =>
      useWalkingDirections({
        origin: null,
        destination: { lat: 41.8905, lng: 12.48835 },
        legFallback,
      }),
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(fetchWalkingDirections).not.toHaveBeenCalled()
    expect(result.current.error).toBeNull()
    expect(result.current.directions?.source).toBe('canonical-leg')
  })

  it('errors cleanly when token, cache, and canonical leg are all missing', async () => {
    env.mapboxToken = ''

    const { result } = renderHook(() =>
      useWalkingDirections({
        origin: { lat: 41.889, lng: 12.4878 },
        destination: { lat: 41.8905, lng: 12.48835 },
        legFallback,
      }),
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(fetchWalkingDirections).not.toHaveBeenCalled()
    expect(result.current.directions).toBeNull()
    expect(result.current.error).toMatch(/isn’t prepared yet|unavailable right now/)
  })

  it('exposes continuation-oriented unavailable copy', () => {
    expect(ROUTE_UNAVAILABLE_COPY).toMatch(/still open the stop/i)
  })
})
