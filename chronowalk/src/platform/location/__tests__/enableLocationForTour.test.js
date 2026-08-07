import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  LOCATION_FIX_STATUS,
  LOCATION_PERMISSION,
  LOCATION_UI_TIMEOUT_MS,
  __resetLocationFacadeForTests,
  __resetLocationSessionForTests,
  acquirePositionAsync,
  createNativeLocationAdapter,
  createWebLocationAdapter,
  enableLocationForTour,
  enableLocationForTourBounded,
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

describe('native permission call timeouts', () => {
  it('checkPermissions timeout does not hang requestPermission', async () => {
    vi.useFakeTimers()
    const logs = []
    const adapter = createNativeLocationAdapter({
      checkTimeoutMs: 50,
      requestTimeoutMs: 80,
      postTimeoutCheckMs: 40,
      log: (m) => logs.push(m),
      loadGeolocation: async () => ({
        checkPermissions: () => new Promise(() => {}),
        requestPermissions: async () => ({ location: 'granted' }),
        getCurrentPosition: vi.fn(),
      }),
    })

    const promise = adapter.requestPermission()
    await vi.advanceTimersByTimeAsync(60)
    // After check timeout, requestPermissions should be attempted.
    await vi.advanceTimersByTimeAsync(100)
    const result = await promise
    expect(result.permission).toBe(LOCATION_PERMISSION.GRANTED)
    expect(logs.some((l) => l.includes('checkPermissions timeout'))).toBe(true)
  })

  it('requestPermissions timeout does not hang', async () => {
    vi.useFakeTimers()
    const adapter = createNativeLocationAdapter({
      checkTimeoutMs: 50,
      requestTimeoutMs: 80,
      postTimeoutCheckMs: 40,
      loadGeolocation: async () => ({
        checkPermissions: async () => ({ location: 'prompt' }),
        requestPermissions: () => new Promise(() => {}),
        getCurrentPosition: vi.fn(),
      }),
    })

    const promise = adapter.requestPermission()
    await vi.advanceTimersByTimeAsync(200)
    const result = await promise
    expect(result.permission).toBe(LOCATION_PERMISSION.UNAVAILABLE)
    expect(result.timedOut).toBe(true)
  })

  it('permission granted normally returns granted', async () => {
    const adapter = createNativeLocationAdapter({
      loadGeolocation: async () => ({
        checkPermissions: async () => ({ location: 'prompt' }),
        requestPermissions: async () => ({ location: 'granted' }),
        getCurrentPosition: vi.fn(),
      }),
    })
    await expect(adapter.requestPermission()).resolves.toMatchObject({
      permission: LOCATION_PERMISSION.GRANTED,
      fixStatus: LOCATION_FIX_STATUS.SEARCHING,
    })
  })

  it('requestPermissions timeout + post-check granted returns granted', async () => {
    vi.useFakeTimers()
    let checkCalls = 0
    const adapter = createNativeLocationAdapter({
      checkTimeoutMs: 50,
      requestTimeoutMs: 80,
      postTimeoutCheckMs: 40,
      loadGeolocation: async () => ({
        checkPermissions: async () => {
          checkCalls += 1
          // First call: prompt. Post-timeout call: granted (user allowed in system sheet).
          return { location: checkCalls === 1 ? 'prompt' : 'granted' }
        },
        requestPermissions: () => new Promise(() => {}),
        getCurrentPosition: vi.fn(),
      }),
    })

    const promise = adapter.requestPermission()
    await vi.advanceTimersByTimeAsync(200)
    await expect(promise).resolves.toMatchObject({
      permission: LOCATION_PERMISSION.GRANTED,
      fixStatus: LOCATION_FIX_STATUS.SEARCHING,
    })
    expect(checkCalls).toBeGreaterThanOrEqual(2)
  })

  it('timeout + post-check denied returns denied', async () => {
    vi.useFakeTimers()
    let checkCalls = 0
    const adapter = createNativeLocationAdapter({
      checkTimeoutMs: 50,
      requestTimeoutMs: 80,
      postTimeoutCheckMs: 40,
      loadGeolocation: async () => ({
        checkPermissions: async () => {
          checkCalls += 1
          return { location: checkCalls === 1 ? 'prompt' : 'denied' }
        },
        requestPermissions: () => new Promise(() => {}),
        getCurrentPosition: vi.fn(),
      }),
    })

    const promise = adapter.requestPermission()
    await vi.advanceTimersByTimeAsync(200)
    await expect(promise).resolves.toMatchObject({
      permission: LOCATION_PERMISSION.DENIED,
    })
  })

  it('unresolved permission exits as unavailable (not a false denial)', async () => {
    vi.useFakeTimers()
    const adapter = createNativeLocationAdapter({
      checkTimeoutMs: 40,
      requestTimeoutMs: 60,
      postTimeoutCheckMs: 30,
      loadGeolocation: async () => ({
        checkPermissions: () => new Promise(() => {}),
        requestPermissions: () => new Promise(() => {}),
        getCurrentPosition: vi.fn(),
      }),
    })

    const promise = adapter.requestPermission()
    await vi.advanceTimersByTimeAsync(200)
    const result = await promise
    expect(result.permission).toBe(LOCATION_PERMISSION.UNAVAILABLE)
    expect(result.permission).not.toBe(LOCATION_PERMISSION.DENIED)
    expect(result.timedOut).toBe(true)
  })
})

describe('UI-bounded enableLocationForTourBounded', () => {
  it('resolves within the UI timeout even if enable hangs', async () => {
    vi.useFakeTimers()
    const hangingAdapter = {
      async requestPermission() {
        return new Promise(() => {})
      },
      async getCurrentPosition() {
        return null
      },
    }

    const promise = enableLocationForTourBounded({
      adapter: hangingAdapter,
      uiTimeoutMs: 100,
      waitForFix: false,
      skipIfDeniedAlready: false,
    })
    await vi.advanceTimersByTimeAsync(150)
    const result = await promise
    expect(result.timedOut).toBe(true)
    expect(result.permission).toBe(LOCATION_PERMISSION.UNAVAILABLE)
    expect(result.shouldAdvance).toBe(true)
  })

  it('does not wait for GPS fix', async () => {
    const getCurrentPosition = vi.fn(
      () =>
        new Promise(() => {
          /* hang */
        }),
    )
    const adapter = createNativeLocationAdapter({
      loadGeolocation: async () => ({
        checkPermissions: async () => ({ location: 'granted' }),
        requestPermissions: async () => ({ location: 'granted' }),
        getCurrentPosition,
      }),
    })

    const result = await enableLocationForTourBounded({
      adapter,
      waitForFix: false,
      uiTimeoutMs: LOCATION_UI_TIMEOUT_MS,
    })
    expect(result.permission).toBe(LOCATION_PERMISSION.GRANTED)
    expect(result.fixStatus).toBe(LOCATION_FIX_STATUS.SEARCHING)
  })
})

describe('slow getCurrentPosition does not block journey enable', () => {
  it('enableLocationForTour resolves while native getCurrentPosition hangs', async () => {
    const hanging = new Promise(() => {})

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
