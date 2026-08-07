/**
 * Native iOS location adapter — Capacitor Geolocation, lazy-loaded.
 * Never imported by the web/PWA cold path except through the facade after
 * isNativeIOS() is true.
 *
 * CRITICAL: checkPermissions + requestPermissions are BOTH bounded with
 * withTimeout. A hung Capacitor permission Promise must never leave the
 * Enable Location UI stuck on “Requesting access…”.
 */

import {
  CHECK_PERMISSIONS_TIMEOUT_MS,
  INITIAL_FIX_MAXIMUM_AGE_MS,
  INITIAL_FIX_TIMEOUT_MS,
  LOCATION_FIX_STATUS,
  LOCATION_PERMISSION,
  POST_TIMEOUT_CHECK_TIMEOUT_MS,
  REQUEST_PERMISSIONS_TIMEOUT_MS,
  normalizePermissionState,
} from './locationTypes.js'
import { withTimeout } from './locationTimeout.js'

function mapCapacitorPermission(status) {
  // Capacitor returns { location, coarseLocation } with granted|denied|prompt|prompt-with-rationale
  const raw = status?.location ?? status?.coarseLocation ?? status
  return normalizePermissionState(raw)
}

function mapSample(pos) {
  if (!pos?.coords) return null
  return {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    accuracyM: typeof pos.coords.accuracy === 'number' ? pos.coords.accuracy : undefined,
    timestampMs: typeof pos.timestamp === 'number' ? pos.timestamp : Date.now(),
  }
}

function isTimeoutError(error) {
  return (
    error?.name === 'TimeoutError' ||
    error?.code === 3 ||
    (typeof error?.message === 'string' && error.message.toLowerCase().includes('timed out'))
  )
}

/** Dev/local diagnostics only — never log coordinates or personal data. */
function locationNativeLog(message) {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
      console.info(`[Location native] ${message}`)
    }
  } catch {
    // ignore
  }
}

function grantedResult() {
  return {
    permission: LOCATION_PERMISSION.GRANTED,
    position: null,
    fixStatus: LOCATION_FIX_STATUS.SEARCHING,
  }
}

function deniedResult() {
  return {
    permission: LOCATION_PERMISSION.DENIED,
    position: null,
    fixStatus: LOCATION_FIX_STATUS.IDLE,
  }
}

function unavailableResult({ timedOut = true } = {}) {
  return {
    permission: LOCATION_PERMISSION.UNAVAILABLE,
    position: null,
    fixStatus: LOCATION_FIX_STATUS.UNAVAILABLE,
    timedOut,
  }
}

/**
 * @param {{
 *   timeoutMs?: number,
 *   checkTimeoutMs?: number,
 *   requestTimeoutMs?: number,
 *   postTimeoutCheckMs?: number,
 *   loadGeolocation?: () => Promise<any>,
 *   log?: (message: string) => void,
 * }} [options]
 */
export function createNativeLocationAdapter(options = {}) {
  const defaultTimeoutMs = options.timeoutMs ?? INITIAL_FIX_TIMEOUT_MS
  const checkTimeoutMs = options.checkTimeoutMs ?? CHECK_PERMISSIONS_TIMEOUT_MS
  const requestTimeoutMs = options.requestTimeoutMs ?? REQUEST_PERMISSIONS_TIMEOUT_MS
  const postTimeoutCheckMs = options.postTimeoutCheckMs ?? POST_TIMEOUT_CHECK_TIMEOUT_MS
  const log = options.log ?? locationNativeLog
  const loadGeolocation =
    options.loadGeolocation ??
    (async () => {
      const mod = await import('@capacitor/geolocation')
      return mod.Geolocation
    })

  /** @type {Promise<any> | null} */
  let geoPromise = null
  function getGeo() {
    if (!geoPromise) geoPromise = loadGeolocation()
    return geoPromise
  }

  async function checkPermissionsBounded(Geolocation, timeoutMs = checkTimeoutMs) {
    log('checkPermissions start')
    try {
      const status = await withTimeout(
        Geolocation.checkPermissions(),
        timeoutMs,
        () =>
          Object.assign(new Error('checkPermissions timed out'), {
            code: 3,
            name: 'TimeoutError',
          }),
      )
      const permission = mapCapacitorPermission(status)
      log(`checkPermissions resolved: ${permission}`)
      return permission
    } catch (error) {
      if (isTimeoutError(error)) {
        log('checkPermissions timeout')
      } else {
        log('checkPermissions error')
      }
      throw error
    }
  }

  async function requestPermissionsBounded(Geolocation) {
    log('requestPermissions start')
    try {
      const status = await withTimeout(
        Geolocation.requestPermissions(),
        requestTimeoutMs,
        () =>
          Object.assign(new Error('requestPermissions timed out'), {
            code: 3,
            name: 'TimeoutError',
          }),
      )
      const permission = mapCapacitorPermission(status)
      log(`requestPermissions resolved: ${permission}`)
      return permission
    } catch (error) {
      if (isTimeoutError(error)) {
        log('requestPermissions timeout')
      } else {
        log('requestPermissions error')
      }
      throw error
    }
  }

  /**
   * After requestPermissions hangs/times out, iOS may already have granted
   * at the system level. Reconcile with a fresh bounded check — do NOT
   * assume denial.
   */
  async function reconcileAfterRequestTimeout(Geolocation) {
    try {
      const permission = await checkPermissionsBounded(Geolocation, postTimeoutCheckMs)
      log(`post-timeout check result: ${permission}`)
      if (permission === LOCATION_PERMISSION.GRANTED) return grantedResult()
      if (permission === LOCATION_PERMISSION.DENIED) return deniedResult()
      return unavailableResult({ timedOut: true })
    } catch {
      log('post-timeout check result: unavailable')
      return unavailableResult({ timedOut: true })
    }
  }

  return {
    async checkPermission() {
      try {
        const Geolocation = await getGeo()
        return await checkPermissionsBounded(Geolocation)
      } catch {
        return LOCATION_PERMISSION.UNAVAILABLE
      }
    },

    /**
     * Request/check permission WITHOUT waiting for a GPS fix.
     * ALWAYS resolves within a bounded time — never leaves a pending Promise.
     */
    async requestPermission() {
      try {
        const Geolocation = await getGeo()

        let permission
        try {
          permission = await checkPermissionsBounded(Geolocation)
        } catch {
          // Timed-out / failed check — still attempt the system prompt once.
          permission = LOCATION_PERMISSION.PROMPT
        }

        if (permission === LOCATION_PERMISSION.GRANTED) {
          return grantedResult()
        }
        if (permission === LOCATION_PERMISSION.DENIED) {
          return deniedResult()
        }

        try {
          permission = await requestPermissionsBounded(Geolocation)
        } catch (error) {
          if (isTimeoutError(error)) {
            return reconcileAfterRequestTimeout(Geolocation)
          }
          // Non-timeout failure — try a fresh check before giving up.
          return reconcileAfterRequestTimeout(Geolocation)
        }

        if (permission === LOCATION_PERMISSION.GRANTED) {
          return grantedResult()
        }
        if (permission === LOCATION_PERMISSION.DENIED) {
          return deniedResult()
        }

        // Still prompt / unknown after a resolved request — treat as recoverable.
        return unavailableResult({ timedOut: false })
      } catch {
        return unavailableResult({ timedOut: true })
      }
    },

    async getCurrentPosition({ timeoutMs = defaultTimeoutMs } = {}) {
      try {
        const Geolocation = await getGeo()
        const pos = await withTimeout(
          Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: timeoutMs,
            maximumAge: INITIAL_FIX_MAXIMUM_AGE_MS,
          }),
          timeoutMs + 250,
        )
        return mapSample(pos)
      } catch {
        return null
      }
    },
  }
}
