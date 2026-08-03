import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const trackWakeLockAcquired = vi.fn()
const trackWakeLockFailed = vi.fn()
const trackWakeLockReleasedUnexpectedly = vi.fn()

vi.mock('../lib/analytics.ts', () => ({
  trackWakeLockAcquired: (...a) => trackWakeLockAcquired(...a),
  trackWakeLockFailed: (...a) => trackWakeLockFailed(...a),
  trackWakeLockReleasedUnexpectedly: (...a) => trackWakeLockReleasedUnexpectedly(...a),
}))

describe('screenWakeLock', () => {
  beforeEach(async () => {
    vi.resetModules()
    vi.clearAllMocks()
    const { __resetScreenWakeLockForTests } = await import('./screenWakeLock.js')
    __resetScreenWakeLockForTests()
  })

  afterEach(async () => {
    const { __resetScreenWakeLockForTests, releaseScreenWakeLock } = await import(
      './screenWakeLock.js'
    )
    await releaseScreenWakeLock()
    __resetScreenWakeLockForTests()
    delete navigator.wakeLock
  })

  it('tracks acquired and unexpected release', async () => {
    let releaseHandler = null
    const sentinel = {
      released: false,
      addEventListener: vi.fn((type, fn) => {
        if (type === 'release') releaseHandler = fn
      }),
      release: vi.fn(async function release() {
        this.released = true
        releaseHandler?.()
      }),
    }

    navigator.wakeLock = {
      request: vi.fn(async () => sentinel),
    }

    const { acquireScreenWakeLock } = await import('./screenWakeLock.js')
    await acquireScreenWakeLock()
    expect(trackWakeLockAcquired).toHaveBeenCalled()

    releaseHandler?.()
    expect(trackWakeLockReleasedUnexpectedly).toHaveBeenCalled()
  })

  it('tracks wake_lock_failed on request rejection', async () => {
    navigator.wakeLock = {
      request: vi.fn(async () => {
        const err = new Error('denied')
        err.name = 'NotAllowedError'
        throw err
      }),
    }

    const { acquireScreenWakeLock } = await import('./screenWakeLock.js')
    await acquireScreenWakeLock()
    expect(trackWakeLockFailed).toHaveBeenCalledWith({ errorName: 'NotAllowedError' })
  })

  it('does not treat intentional release as unexpected', async () => {
    let releaseHandler = null
    const sentinel = {
      released: false,
      addEventListener: vi.fn((type, fn) => {
        if (type === 'release') releaseHandler = fn
      }),
      release: vi.fn(async function release() {
        this.released = true
        releaseHandler?.()
      }),
    }

    navigator.wakeLock = {
      request: vi.fn(async () => sentinel),
    }

    const { acquireScreenWakeLock, releaseScreenWakeLock } = await import('./screenWakeLock.js')
    await acquireScreenWakeLock()
    trackWakeLockReleasedUnexpectedly.mockClear()
    await releaseScreenWakeLock()
    expect(trackWakeLockReleasedUnexpectedly).not.toHaveBeenCalled()
  })

  it('reports unsupported once when Wake Lock API is missing', async () => {
    delete navigator.wakeLock
    const { acquireScreenWakeLock } = await import('./screenWakeLock.js')
    await acquireScreenWakeLock()
    await acquireScreenWakeLock()
    expect(trackWakeLockFailed).toHaveBeenCalledTimes(1)
    expect(trackWakeLockFailed).toHaveBeenCalledWith({ errorName: 'unsupported' })
  })
})
