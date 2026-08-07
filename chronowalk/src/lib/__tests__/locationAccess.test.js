import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  enableLocationForTour,
  requestLocationAccess,
  LOCATION_PERMISSION,
  LOCATION_FIX_STATUS,
  __resetLocationFacadeForTests,
  __resetLocationSessionForTests,
} from '../locationAccess'

vi.mock('../../config/env', () => ({
  isDebugGeo: () => false,
}))

vi.mock('../platform/runtime/platformRuntime.js', () => ({
  isNativeIOS: () => false,
}))

describe('requestLocationAccess', () => {
  beforeEach(() => {
    __resetLocationSessionForTests()
    __resetLocationFacadeForTests()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('resolves granted when geolocation succeeds', async () => {
    navigator.geolocation = {
      getCurrentPosition: (success) =>
        success({
          coords: { latitude: 41.9, longitude: 12.5, accuracy: 5 },
          timestamp: 1,
        }),
    }

    await expect(requestLocationAccess({ skipIfDeniedAlready: false })).resolves.toBe(
      'granted',
    )
  })

  it('resolves denied when geolocation permission fails', async () => {
    navigator.geolocation = {
      getCurrentPosition: (_success, error) => error({ code: 1 }),
    }

    await expect(requestLocationAccess({ skipIfDeniedAlready: false })).resolves.toBe(
      'denied',
    )
  })

  it('treats permission grant without a fix as granted', async () => {
    const adapter = {
      async requestPermission() {
        return {
          permission: LOCATION_PERMISSION.GRANTED,
          position: null,
          fixStatus: LOCATION_FIX_STATUS.SEARCHING,
        }
      },
      async getCurrentPosition() {
        return new Promise(() => {})
      },
    }

    const result = await enableLocationForTour({
      adapter,
      waitForFix: false,
      skipIfDeniedAlready: false,
    })
    expect(result.access).toBe('granted')
    expect(result.fixStatus).toBe(LOCATION_FIX_STATUS.SEARCHING)
  })
})
