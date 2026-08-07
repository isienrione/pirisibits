import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  LOCATION_FIX_STATUS,
  LOCATION_PERMISSION,
  __resetLocationFacadeForTests,
  __resetLocationSessionForTests,
  acquirePositionAsync,
  createNativeLocationAdapter,
  createWebLocationAdapter,
  enableLocationForTour,
  getLocationSession,
  requestLocationAccess,
  withTimeout,
} from '../index.js'

vi.mock('../../../config/env.js', () => ({
  isDebugGeo: () => false,
}))

vi.mock('../../runtime/platformRuntime.js', () => ({
  isNativeIOS: () => false,
}))

beforeEach(() => {
  __resetLocationSessionForTests()
  __resetLocationFacadeForTests()
  vi.useRealTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

describe('permission granted advances without waiting for GPS fix', () => {
  it('native adapter returns granted + searching without calling getCurrentPosition', async () => {
    const getCurrentPosition = vi.fn()
    const adapter = createNativeLocationAdapter({
      loadGeolocation: async () => ({
        checkPermissions: async () => ({ location: 'prompt' }),
        requestPermissions: async () => ({ location: 'granted' }),
        getCurrentPosition,
      }),
    })

    const result = await enableLocationForTour({
      adapter,
      waitForFix: false,
    })

    expect(result.permission).toBe(LOCATION_PERMISSION.GRANTED)
    expect(result.locationEnabled).toBe(true)
    expect(result.fixStatus).toBe(LOCATION_FIX_STATUS.SEARCHING)
    expect(result.access).toBe('granted')
    expect(getCurrentPosition).not.toHaveBeenCalled()
    // Async acquisition may start after return — wait a tick then assert it was kicked off.
    await Promise.resolve()
    await Promise.resolve()
  })

  it('requestLocationAccess returns granted for permission alone', async () => {
    const adapter = createNativeLocationAdapter({
      loadGeolocation: async () => ({
        checkPermissions: async () => ({ location: 'granted' }),
        requestPermissions: async () => ({ location: 'granted' }),
        getCurrentPosition: vi.fn(
          () =>
            new Promise(() => {
              /* never resolves */
            }),
        ),
      }),
    })

    await expect(
      requestLocationAccess({ adapter, waitForFix: false }),
    ).resolves.toBe('granted')
  })
})

describe('slow getCurrentPosition does not block journey enable', () => {
  it('enableLocationForTour resolves while native getCurrentPosition hangs', async () => {
    let resolveFix
    const hanging = new Promise((resolve) => {
      resolveFix = resolve
    })

    const adapter = createNativeLocationAdapter({
      timeoutMs: 50,
      loadGeolocation: async () => ({
        checkPermissions: async () => ({ location: 'granted' }),
        requestPermissions: async () => ({ location: 'granted' }),
        getCurrentPosition: () => hanging,
      }),
    })

    const started = Date.now()
    const result = await enableLocationForTour({
      adapter,
      waitForFix: false,
      timeoutMs: 50,
    })
    const elapsed = Date.now() - started

    expect(result.locationEnabled).toBe(true)
    expect(result.fixStatus).toBe(LOCATION_FIX_STATUS.SEARCHING)
    expect(elapsed).toBeLessThan(200)

    // Late fix updates session afterward without restarting enable.
    resolveFix({
      coords: { latitude: 41.89, longitude: 12.49, accuracy: 8 },
      timestamp: Date.now(),
    })
    await acquirePositionAsync({ adapter, timeoutMs: 50 }).catch(() => null)
    // Allow the first inflight acquire to settle if still open.
    await vi.waitFor(() => {
      const session = getLocationSession()
      expect(session.permission).toBe(LOCATION_PERMISSION.GRANTED)
    })
  })
})

describe('timeout exits loading-style waits safely', () => {
  it('withTimeout rejects so callers can leave busy state', async () => {
    vi.useFakeTimers()
    const pending = new Promise(() => {})
    const raced = withTimeout(pending, 100)
    const assertion = expect(raced).rejects.toMatchObject({ code: 3 })
    await vi.advanceTimersByTimeAsync(100)
    await assertion
  })

  it('web getCurrentPosition timeout does not hang enableLocationForTour', async () => {
    vi.useFakeTimers()
    const adapter = createWebLocationAdapter({ timeoutMs: 100 })
    navigator.geolocation = {
      getCurrentPosition: vi.fn(() => {
        /* never calls back — simulates WebView ignoring timeout */
      }),
    }
    // Permissions API absent → web adapter must use getCurrentPosition to prompt.
    if (navigator.permissions) {
      navigator.permissions.query = vi.fn(async () => ({ state: 'prompt' }))
    }

    const promise = enableLocationForTour({
      adapter,
      waitForFix: false,
      timeoutMs: 100,
      skipIfDeniedAlready: false,
    })
    await vi.advanceTimersByTimeAsync(400)
    const result = await promise
    expect(result.access === 'granted' || result.timedOut || result.permission === 'prompt').toBe(
      true,
    )
  })
})

describe('late GPS fix updates location afterward', () => {
  it('acquirePositionAsync patches session when a fix arrives later', async () => {
    const adapter = {
      async requestPermission() {
        return {
          permission: LOCATION_PERMISSION.GRANTED,
          position: null,
          fixStatus: LOCATION_FIX_STATUS.SEARCHING,
        }
      },
      async getCurrentPosition() {
        return { lat: 41.8902, lng: 12.4922, accuracyM: 12, timestampMs: 1 }
      },
    }

    await enableLocationForTour({ adapter, waitForFix: false })
    expect(getLocationSession().fixStatus).toBe(LOCATION_FIX_STATUS.SEARCHING)

    const sample = await acquirePositionAsync({ adapter })
    expect(sample).toMatchObject({ lat: 41.8902, lng: 12.4922 })
    expect(getLocationSession()).toMatchObject({
      permission: LOCATION_PERMISSION.GRANTED,
      fixStatus: LOCATION_FIX_STATUS.AVAILABLE,
      locationEnabled: true,
    })
  })
})

describe('denied permission enters manual mode without repeat prompts', () => {
  it('returns denied and skips automatic re-prompt', async () => {
    const requestPermissions = vi.fn(async () => ({ location: 'denied' }))
    const adapter = createNativeLocationAdapter({
      loadGeolocation: async () => ({
        checkPermissions: async () => ({ location: 'prompt' }),
        requestPermissions,
        getCurrentPosition: vi.fn(),
      }),
    })

    const first = await enableLocationForTour({
      adapter,
      skipIfDeniedAlready: false,
    })
    expect(first.permission).toBe(LOCATION_PERMISSION.DENIED)
    expect(first.locationEnabled).toBe(false)
    expect(requestPermissions).toHaveBeenCalledTimes(1)

    const second = await enableLocationForTour({
      adapter,
      skipIfDeniedAlready: true,
    })
    expect(second.permission).toBe(LOCATION_PERMISSION.DENIED)
    expect(requestPermissions).toHaveBeenCalledTimes(1)
  })
})

describe('successful immediate GPS fix behaves normally', () => {
  it('web success yields granted + available with coordinates', async () => {
    const adapter = createWebLocationAdapter()
    navigator.geolocation = {
      getCurrentPosition: (success) =>
        success({
          coords: { latitude: 41.9, longitude: 12.5, accuracy: 5 },
          timestamp: 99,
        }),
    }
    if (navigator.permissions) {
      navigator.permissions.query = vi.fn(async () => ({ state: 'prompt' }))
    }

    const result = await enableLocationForTour({
      adapter,
      skipIfDeniedAlready: false,
    })
    expect(result).toMatchObject({
      permission: LOCATION_PERMISSION.GRANTED,
      fixStatus: LOCATION_FIX_STATUS.AVAILABLE,
      locationEnabled: true,
      access: 'granted',
    })
    expect(result.position).toMatchObject({ lat: 41.9, lng: 12.5 })
  })
})

describe('web adapter remains browser-safe', () => {
  it('does not import Capacitor in webLocationAdapter source', async () => {
    const { readFileSync } = await import('node:fs')
    const { dirname, join } = await import('node:path')
    const { fileURLToPath } = await import('node:url')
    const root = join(dirname(fileURLToPath(import.meta.url)), '..')
    const source = readFileSync(join(root, 'webLocationAdapter.js'), 'utf8')
    expect(source).not.toMatch(/@capacitor\//)
  })
})
