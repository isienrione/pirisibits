import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { LOCATION_STATUS } from '../useGeoLocation.js'
import { COMPANION_MODES, OBSERVATION_STATIONARY_MS } from '../../content/companionGuidance.js'
import { useWalkingCompanion } from '../useWalkingCompanion.js'

describe('useWalkingCompanion', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('enters observation after remaining still', () => {
    const { result, rerender } = renderHook(
      (props) => useWalkingCompanion(props),
      {
        initialProps: {
          position: { lat: 41.89, lng: 12.49 },
          distance: 180,
          geofenceRadiusM: 40,
          locationStatus: LOCATION_STATUS.GRANTED,
          enabled: true,
        },
      }
    )

    expect(result.current.mode).toBe(COMPANION_MODES.NORMAL)

    act(() => {
      vi.advanceTimersByTime(OBSERVATION_STATIONARY_MS + 1000)
    })
    rerender({
      position: { lat: 41.89, lng: 12.49 },
      distance: 180,
      geofenceRadiusM: 40,
      locationStatus: LOCATION_STATUS.GRANTED,
      enabled: true,
    })

    expect(result.current.mode).toBe(COMPANION_MODES.OBSERVING)
  })
})
