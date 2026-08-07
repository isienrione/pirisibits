/**
 * Location enablement facade for ChronoWalk tour startup.
 *
 * Call chain (Enable Location):
 *   BeginFlow / RedesignBeginFlow / PermissionsView / LocationPermissionPage
 *   → enableLocationForTour() / requestLocationAccess()
 *   → native (iOS): Capacitor Geolocation.requestPermissions
 *      then async getCurrentPosition (non-blocking for UI)
 *   → web/PWA: navigator.geolocation (+ Permissions API when available)
 *   → locationSession patch
 *   → UI advances on permission grant (not on GPS fix)
 */

import { isDebugGeo } from '../../config/env.js'
import { isNativeIOS } from '../runtime/platformRuntime.js'
import { createNativeLocationAdapter } from './nativeLocationAdapter.js'
import { createWebLocationAdapter } from './webLocationAdapter.js'
import {
  getLocationSession,
  patchLocationSession,
  subscribeLocationSession,
} from './locationSession.js'
import {
  INITIAL_FIX_TIMEOUT_MS,
  LOCATION_FIX_STATUS,
  LOCATION_PERMISSION,
  SIMULATOR_ROME_LOCATION,
  buildLocationEnableResult,
} from './locationTypes.js'

export {
  LOCATION_PERMISSION,
  LOCATION_FIX_STATUS,
  INITIAL_FIX_TIMEOUT_MS,
  SIMULATOR_ROME_LOCATION,
  buildLocationEnableResult,
} from './locationTypes.js'

export {
  getLocationSession,
  patchLocationSession,
  subscribeLocationSession,
} from './locationSession.js'

/** @type {ReturnType<typeof createNativeLocationAdapter> | ReturnType<typeof createWebLocationAdapter> | null} */
let cachedAdapter = null
/** @type {Promise<import('./locationTypes.js').LocationSample | null> | null} */
let inflightFix = null

/**
 * @param {{
 *   adapter?: ReturnType<typeof createWebLocationAdapter>,
 *   forceNative?: boolean,
 * }} [options]
 */
export function resolveLocationAdapter(options = {}) {
  if (options.adapter) return options.adapter
  if (cachedAdapter) return cachedAdapter

  if (options.forceNative || isNativeIOS()) {
    cachedAdapter = createNativeLocationAdapter()
  } else {
    cachedAdapter = createWebLocationAdapter()
  }
  return cachedAdapter
}

/** @param {import('./locationTypes.js').LocationSample | null} sample */
function applyFix(sample) {
  if (sample?.lat != null && sample?.lng != null) {
    patchLocationSession({
      permission: LOCATION_PERMISSION.GRANTED,
      fixStatus: LOCATION_FIX_STATUS.AVAILABLE,
      position: sample,
    })
    return sample
  }
  const session = getLocationSession()
  if (session.permission === LOCATION_PERMISSION.GRANTED) {
    patchLocationSession({
      fixStatus: LOCATION_FIX_STATUS.UNAVAILABLE,
    })
  }
  return null
}

/**
 * Start / continue GPS acquisition without blocking the caller.
 * Late fixes update locationSession subscribers (journey hooks can listen).
 *
 * @param {{ adapter?: any, timeoutMs?: number }} [options]
 * @returns {Promise<import('./locationTypes.js').LocationSample | null>}
 */
export function acquirePositionAsync(options = {}) {
  const adapter = resolveLocationAdapter(options)
  const timeoutMs = options.timeoutMs ?? INITIAL_FIX_TIMEOUT_MS

  if (inflightFix) return inflightFix

  patchLocationSession({
    permission: LOCATION_PERMISSION.GRANTED,
    fixStatus: LOCATION_FIX_STATUS.SEARCHING,
  })

  inflightFix = Promise.resolve()
    .then(() => adapter.getCurrentPosition({ timeoutMs }))
    .then((sample) => applyFix(sample))
    .catch(() => applyFix(null))
    .finally(() => {
      inflightFix = null
    })

  return inflightFix
}

/**
 * Enable location for tour start.
 * Permission grant advances the UI; GPS fix is asynchronous.
 *
 * @param {{
 *   adapter?: any,
 *   timeoutMs?: number,
 *   waitForFix?: boolean,
 *   skipIfDeniedAlready?: boolean,
 * }} [options]
 * @returns {Promise<import('./locationTypes.js').LocationEnableResult>}
 */
export async function enableLocationForTour(options = {}) {
  const timeoutMs = options.timeoutMs ?? INITIAL_FIX_TIMEOUT_MS
  const waitForFix = options.waitForFix === true
  const skipIfDeniedAlready = options.skipIfDeniedAlready !== false

  if (isDebugGeo()) {
    const result = buildLocationEnableResult({
      permission: LOCATION_PERMISSION.GRANTED,
      fixStatus: LOCATION_FIX_STATUS.AVAILABLE,
      position: {
        lat: SIMULATOR_ROME_LOCATION.latitude,
        lng: SIMULATOR_ROME_LOCATION.longitude,
        accuracyM: 10,
        timestampMs: Date.now(),
      },
    })
    patchLocationSession({
      permission: result.permission,
      fixStatus: result.fixStatus,
      position: result.position,
      hasPrompted: true,
    })
    return result
  }

  const existing = getLocationSession()
  if (
    skipIfDeniedAlready &&
    existing.hasPrompted &&
    existing.permission === LOCATION_PERMISSION.DENIED
  ) {
    return buildLocationEnableResult({
      permission: LOCATION_PERMISSION.DENIED,
      fixStatus: LOCATION_FIX_STATUS.IDLE,
    })
  }

  const adapter = resolveLocationAdapter(options)

  try {
    const response = await adapter.requestPermission({ timeoutMs })
    const permission = response.permission

    patchLocationSession({
      permission,
      fixStatus:
        permission === LOCATION_PERMISSION.GRANTED
          ? response.position
            ? LOCATION_FIX_STATUS.AVAILABLE
            : LOCATION_FIX_STATUS.SEARCHING
          : permission === LOCATION_PERMISSION.UNAVAILABLE
            ? LOCATION_FIX_STATUS.UNAVAILABLE
            : LOCATION_FIX_STATUS.IDLE,
      position: response.position,
      hasPrompted: true,
    })

    if (permission === LOCATION_PERMISSION.GRANTED) {
      if (response.position) {
        return buildLocationEnableResult({
          permission,
          fixStatus: LOCATION_FIX_STATUS.AVAILABLE,
          position: response.position,
          timedOut: response.timedOut,
        })
      }

      // Critical: do not block UI on GPS. Kick off async acquisition.
      const fixPromise = acquirePositionAsync({ adapter, timeoutMs })

      if (waitForFix) {
        const position = await fixPromise
        return buildLocationEnableResult({
          permission,
          fixStatus: position
            ? LOCATION_FIX_STATUS.AVAILABLE
            : LOCATION_FIX_STATUS.UNAVAILABLE,
          position,
          timedOut: !position,
        })
      }

      return buildLocationEnableResult({
        permission,
        fixStatus: LOCATION_FIX_STATUS.SEARCHING,
        position: null,
        timedOut: response.timedOut,
      })
    }

    if (permission === LOCATION_PERMISSION.UNAVAILABLE) {
      return buildLocationEnableResult({
        permission: LOCATION_PERMISSION.UNAVAILABLE,
        fixStatus: LOCATION_FIX_STATUS.UNAVAILABLE,
        timedOut: response.timedOut ?? true,
      })
    }

    return buildLocationEnableResult({
      permission: LOCATION_PERMISSION.DENIED,
      fixStatus: LOCATION_FIX_STATUS.IDLE,
      timedOut: response.timedOut,
    })
  } catch {
    // Do not falsely mark the user denied on unexpected adapter failures.
    patchLocationSession({
      permission: LOCATION_PERMISSION.UNAVAILABLE,
      fixStatus: LOCATION_FIX_STATUS.UNAVAILABLE,
      hasPrompted: true,
    })
    return buildLocationEnableResult({
      permission: LOCATION_PERMISSION.UNAVAILABLE,
      fixStatus: LOCATION_FIX_STATUS.UNAVAILABLE,
      timedOut: true,
    })
  }
}

/**
 * Back-compat string API used by BeginFlow / tests.
 * 'granted' means permission granted — not that a GPS fix arrived.
 * 'unavailable' means permission could not be resolved in time (not a hard denial).
 *
 * @returns {Promise<'granted' | 'denied' | 'unavailable'>}
 */
export async function requestLocationAccess(options = {}) {
  const result = await enableLocationForTour(options)
  return result.access
}

/** Test helper */
export function __resetLocationFacadeForTests() {
  cachedAdapter = null
  inflightFix = null
}
