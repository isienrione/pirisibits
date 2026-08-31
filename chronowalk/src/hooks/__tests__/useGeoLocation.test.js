import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { JOURNEY_STATE, LOCATION_STATUS, useGeoLocation } from '../useGeoLocation'

describe('useGeoLocation', () => {
  let successCallback

  beforeEach(() => {
    successCallback = null
    vi.stubGlobal('navigator', {
      geolocation: {
        watchPosition: (onSuccess) => {
          successCallback = onSuccess
          return 1
        },
        clearWatch: () => {},
      },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const emitPosition = (latitude, longitude) => {
    act(() => {
      successCallback?.({ coords: { latitude, longitude, accuracy: 10 } })
    })
  }

  it('does not throw when a live fix arrives with no target (waypoint without geofence)', () => {
    const { result, unmount } = renderHook(() =>
      useGeoLocation({ debugMode: false, target: null, geofenceThresholdM: 40 })
    )

    expect(() => emitPosition(41.9009, 12.4833)).not.toThrow()
    expect(result.current.locationStatus).toBe(LOCATION_STATUS.GRANTED)
    expect(result.current.distance).toBeNull()
    unmount()
  })

  it('reports arrival status once inside the geofence of a real target', () => {
    const target = { lat: 41.9009, lng: 12.4833 }
    const { result, unmount } = renderHook(() =>
      useGeoLocation({ debugMode: false, target, geofenceThresholdM: 40 })
    )

    emitPosition(41.9009, 12.4833)
    expect(result.current.state).toBe(JOURNEY_STATE.ARRIVAL)
    expect(result.current.distance).toBeLessThanOrEqual(40)
    unmount()
  })
})
