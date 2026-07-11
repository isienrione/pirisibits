import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useWalkingDirections, loadTourLegDirections } from '../useWalkingDirections.js'

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

import { fetchWalkingDirections } from '../../services/fetchWalkingRoute.js'
import { getLegWalkingSteps } from '../../utils/routeGeometryCache.js'

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
  })

  it('falls back to tour-leg directions when GPS routing fails', async () => {
    fetchWalkingDirections.mockImplementation(async (from, to) => {
      if (from.lat === 41.889 && to.lat === 41.8905) return null
      if (from.lat === 41.8886 && to.lat === 41.8905) {
        return {
          steps: legSteps,
          geometry: { type: 'LineString', coordinates: [[12.4872, 41.8886], [12.48835, 41.8905]] },
          distanceM: 232,
          durationSec: 180,
        }
      }
      return null
    })

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

    expect(result.current.error).toBeNull()
    expect(result.current.directions?.steps?.[0]?.instruction).toBe('Head down the Clivus Palatinus')
  })

  it('uses cached leg steps without calling Mapbox again', async () => {
    getLegWalkingSteps.mockReturnValue(legSteps)
    fetchWalkingDirections.mockResolvedValue(null)

    const cached = await loadTourLegDirections(legFallback, 'pk.test-token')

    expect(cached?.steps).toEqual(legSteps)
    expect(fetchWalkingDirections).not.toHaveBeenCalled()
  })
})
