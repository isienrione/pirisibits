/**
 * Screen Wake Lock for tour narration — keeps the display awake while audio plays.
 * Releases intentionally on pause/teardown; unexpected OS releases are tracked.
 */
import {
  trackWakeLockAcquired,
  trackWakeLockFailed,
  trackWakeLockReleasedUnexpectedly,
} from '../lib/analytics.ts'

/** @type {WakeLockSentinel | null} */
let sentinel = null
/** Generation bumped on intentional release so late `release` events are ignored. */
let lockGeneration = 0
let unsupportedReported = false

function bindReleaseListener(held, generation) {
  held.addEventListener?.('release', () => {
    if (generation !== lockGeneration) return
    if (sentinel === held) sentinel = null
    trackWakeLockReleasedUnexpectedly()
  })
}

/**
 * Request a screen wake lock. Safe to call repeatedly while already held.
 * @returns {Promise<boolean>}
 */
export async function acquireScreenWakeLock() {
  if (typeof navigator === 'undefined') return false

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
  return Boolean(sentinel && !sentinel.released)
}

/** @internal */
export function __resetScreenWakeLockForTests() {
  sentinel = null
  lockGeneration = 0
  unsupportedReported = false
}
