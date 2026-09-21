/**
 * Screen Wake Lock for tour narration — keeps the display awake while audio plays.
 * On iOS Capacitor uses @capacitor-community/keep-awake; web uses Screen Wake Lock API.
 * Releases intentionally on pause/teardown; unexpected OS releases are tracked.
 */
import {
  trackWakeLockAcquired,
  trackWakeLockFailed,
  trackWakeLockReleasedUnexpectedly,
} from '../lib/analytics.ts'
import { IS_IOS } from '../lib/platform.js'

/** @type {WakeLockSentinel | null} */
let sentinel = null
/** Generation bumped on intentional release so late `release` events are ignored. */
let lockGeneration = 0
let unsupportedReported = false
let keepAwakeHeld = false

function bindReleaseListener(held, generation) {
  held.addEventListener?.('release', () => {
    if (generation !== lockGeneration) return
    if (sentinel === held) sentinel = null
    trackWakeLockReleasedUnexpectedly()
  })
}

async function acquireKeepAwake() {
  try {
    const { KeepAwake } = await import('@capacitor-community/keep-awake')
    await KeepAwake.keepAwake()
    keepAwakeHeld = true
    trackWakeLockAcquired()
    return true
  } catch (err) {
    const name =
      err && typeof err === 'object' && 'name' in err && err.name
        ? String(err.name)
        : 'Error'
    trackWakeLockFailed({ errorName: name })
    return false
  }
}

async function releaseKeepAwake() {
  if (!keepAwakeHeld) return
  keepAwakeHeld = false
  try {
    const { KeepAwake } = await import('@capacitor-community/keep-awake')
    await KeepAwake.allowSleep()
  } catch {
    /* ignore */
  }
}

/**
 * Request a screen wake lock. Safe to call repeatedly while already held.
 * @returns {Promise<boolean>}
 */
export async function acquireScreenWakeLock() {
  if (typeof navigator === 'undefined' && !IS_IOS) return false

  if (IS_IOS) {
    if (keepAwakeHeld) return true
    return acquireKeepAwake()
  }

  if (sentinel && !sentinel.released) return true

  const wakeLock = navigator.wakeLock
  if (!wakeLock || typeof wakeLock.request !== 'function') {
    if (!unsupportedReported) {
      unsupportedReported = true
      trackWakeLockFailed({ errorName: 'unsupported' })
    }
    return false
  }

  try {
    const generation = lockGeneration
    const next = await wakeLock.request('screen')
    // Another acquire/release may have raced while we awaited.
    if (generation !== lockGeneration) {
      try {
        await next.release?.()
      } catch {
        /* ignore */
      }
      return false
    }
    sentinel = next
    bindReleaseListener(next, generation)
    trackWakeLockAcquired()
    return true
  } catch (err) {
    const name =
      err && typeof err === 'object' && 'name' in err && err.name
        ? String(err.name)
        : 'Error'
    trackWakeLockFailed({ errorName: name })
    return false
  }
}

/** Release the wake lock (intentional — does not fire unexpected-release). */
export async function releaseScreenWakeLock() {
  if (IS_IOS) {
    await releaseKeepAwake()
    return
  }

  if (!sentinel) return
  lockGeneration += 1
  const held = sentinel
  sentinel = null
  try {
    await held.release?.()
  } catch {
    // Already released by the OS.
  }
}

export function isScreenWakeLockHeld() {
  if (IS_IOS) return keepAwakeHeld
  return Boolean(sentinel && !sentinel.released)
}

/** @internal */
export function __resetScreenWakeLockForTests() {
  sentinel = null
  lockGeneration = 0
  unsupportedReported = false
  keepAwakeHeld = false
}
