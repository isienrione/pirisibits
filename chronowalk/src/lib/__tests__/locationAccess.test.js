import { beforeEach, describe, expect, it, vi } from 'vitest'
import { requestLocationAccess, getLocationFix, LOCATION_STATUS, normalizeGeoPosition } from '../locationAccess.js'

vi.mock('../../config/env', () => ({
  isDebugGeo: () => false,
}))

const capacitor = vi.hoisted(() => ({
  native: false,
  getCurrentPosition: vi.fn(),
  checkPermissions: vi.fn(),
  requestPermissions: vi.fn(),
}))

vi.mock('../platform.js', () => ({
  isNativeApp: () => capacitor.native,
  isNativeIOS: () => capacitor.native,
  isWebPlatform: () => !capacitor.native,
  getNativePlatform: () => (capacitor.native ? 'ios' : 'web'),
}))

vi.mock('@capacitor/geolocation', () => ({
  Geolocation: {
    getCurrentPosition: (...args) => capacitor.getCurrentPosition(...args),
    checkPermissions: (...args) => capacitor.checkPermissions(...args),
    requestPermissions: (...args) => capacitor.requestPermissions(...args),
  },
}))

describe('requestLocationAccess', () => {
  beforeEach(() => {
    capacitor.native = false
    capacitor.getCurrentPosition.mockReset()
    capacitor.checkPermissions.mockReset()
    capacitor.requestPermissions.mockReset()
  })

  it('resolves granted when geolocation succeeds', async () => {
    navigator.geolocation = {
      getCurrentPosition: (success) =>
        success({ coords: { latitude: 41.9, longitude: 12.5, accuracy: 8 }, timestamp: 1 }),
    }

    await expect(requestLocationAccess()).resolves.toBe('granted')
  })

  it('resolves denied when geolocation fails', async () => {
    navigator.geolocation = {
      getCurrentPosition: (_success, error) => error({ code: 1 }),
    }

    await expect(requestLocationAccess()).resolves.toBe('denied')
  })

  it('does not hang when the browser never replies', async () => {
    vi.useFakeTimers()
    navigator.geolocation = {
      getCurrentPosition: () => {},
    }
    const pending = requestLocationAccess({ timeoutMs: 40 })
    await vi.advanceTimersByTimeAsync(50)
    await expect(pending).resolves.toBe('timeout')
    vi.useRealTimers()
  })

  it('does not hang when native permission never returns', async () => {
    vi.useFakeTimers()
    capacitor.native = true
    capacitor.checkPermissions.mockReturnValue(new Promise(() => {}))
    const pending = getLocationFix({ timeoutMs: 40 })
    await vi.advanceTimersByTimeAsync(50)
    await expect(pending).resolves.toEqual({ status: LOCATION_STATUS.TIMEOUT, position: null })
    vi.useRealTimers()
  })

  it('returns denied on native without hanging on a missing dialog', async () => {
    capacitor.native = true
    capacitor.checkPermissions.mockResolvedValue({ location: 'denied' })
    await expect(requestLocationAccess({ timeoutMs: 200 })).resolves.toBe('denied')
    expect(capacitor.getCurrentPosition).not.toHaveBeenCalled()
  })

  it('normalizes native coords into lat/lng', () => {
    expect(
      normalizeGeoPosition({
        coords: { latitude: 41.89885, longitude: 12.47687, accuracy: 12 },
        timestamp: 99,
      }),
    ).toEqual({ lat: 41.89885, lng: 12.47687, accuracy: 12, timestamp: 99 })
  })
})
