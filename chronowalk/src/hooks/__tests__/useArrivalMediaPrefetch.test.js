import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useArrivalMediaPrefetch } from '../useArrivalMediaPrefetch'
import { prefetchArrivalSliderMedia } from '../../utils/sliderMedia'

vi.mock('../../utils/sliderMedia', async () => {
  const actual = await vi.importActual('../../utils/sliderMedia')
  return {
    ...actual,
    prefetchArrivalSliderMedia: vi.fn(),
  }
})

const waypoint = {
  id: 'colosseum',
  media_cache_version: 1,
  modern_poster_url: '/waypoints/colosseum/exterior/modern-poster.jpg',
  ancient_poster_url: '/waypoints/colosseum/exterior/ancient-poster.jpg',
  modern_video_url: '/waypoints/colosseum/exterior/modern.mp4',
  ancient_video_url: '/waypoints/colosseum/exterior/ancient-reconstruction.mp4',
}

describe('useArrivalMediaPrefetch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('prefetches slider media when the visitor is within the approach radius', () => {
    renderHook(() =>
      useArrivalMediaPrefetch({
        enabled: true,
        distance: 180,
        waypoint,
        prefetchRadiusM: 200,
      })
    )

    expect(prefetchArrivalSliderMedia).toHaveBeenCalledWith(waypoint)
  })

  it('does not prefetch when still far away', () => {
    renderHook(() =>
      useArrivalMediaPrefetch({
        enabled: true,
        distance: 450,
        waypoint,
        prefetchRadiusM: 200,
      })
    )

    expect(prefetchArrivalSliderMedia).not.toHaveBeenCalled()
  })

  it('does not prefetch when disabled or distance is unknown', () => {
    renderHook(() =>
      useArrivalMediaPrefetch({
        enabled: false,
        distance: 50,
        waypoint,
        prefetchRadiusM: 200,
      })
    )

    renderHook(() =>
      useArrivalMediaPrefetch({
        enabled: true,
        distance: null,
        waypoint,
        prefetchRadiusM: 200,
      })
    )

    expect(prefetchArrivalSliderMedia).not.toHaveBeenCalled()
  })
})
