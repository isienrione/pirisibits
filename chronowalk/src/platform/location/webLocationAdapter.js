/**
 * Web/PWA location adapter — navigator.geolocation only.
 * No Capacitor imports.
 */

import {
  INITIAL_FIX_MAXIMUM_AGE_MS,
  INITIAL_FIX_TIMEOUT_MS,
  LOCATION_FIX_STATUS,
  LOCATION_PERMISSION,
  normalizePermissionState,
} from './locationTypes.js'
import { getCurrentPositionPromise } from './locationTimeout.js'

function mapSample(pos) {
  if (!pos?.coords) return null
  return {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    accuracyM: typeof pos.coords.accuracy === 'number' ? pos.coords.accuracy : undefined,
    timestampMs: typeof pos.timestamp === 'number' ? pos.timestamp : Date.now(),
  }
}

async function queryBrowserPermission() {
  if (typeof navigator === 'undefined' || !navigator.permissions?.query) {
    return LOCATION_PERMISSION.PROMPT
  }
  try {
    const result = await navigator.permissions.query({ name: 'geolocation' })
    return normalizePermissionState(result.state)
  } catch {
    return LOCATION_PERMISSION.PROMPT
  }
}

/**
 * @param {{ timeoutMs?: number }} [options]
 */
export function createWebLocationAdapter(options = {}) {
  const defaultTimeoutMs = options.timeoutMs ?? INITIAL_FIX_TIMEOUT_MS

  return {
    async checkPermission() {
      return queryBrowserPermission()
    },

    /**
     * Request permission. On web, the OS/browser dialog is usually tied to
     * getCurrentPosition — we still must not hang forever.
     *
     * @returns {Promise<{
     *   permission: import('./locationTypes.js').LocationPermissionState,
     *   position: import('./locationTypes.js').LocationSample | null,
     *   fixStatus: import('./locationTypes.js').LocationFixStatus,
     *   timedOut?: boolean,
     * }>}
     */
    async requestPermission({ timeoutMs = defaultTimeoutMs } = {}) {
      const existing = await queryBrowserPermission()
      if (existing === LOCATION_PERMISSION.GRANTED) {
        return {
          permission: LOCATION_PERMISSION.GRANTED,
          position: null,
          fixStatus: LOCATION_FIX_STATUS.SEARCHING,
        }
      }
      if (existing === LOCATION_PERMISSION.DENIED) {
        return {
          permission: LOCATION_PERMISSION.DENIED,
          position: null,
          fixStatus: LOCATION_FIX_STATUS.IDLE,
        }
      }

      if (typeof navigator === 'undefined' || !navigator.geolocation?.getCurrentPosition) {
        return {
          permission: LOCATION_PERMISSION.DENIED,
          position: null,
          fixStatus: LOCATION_FIX_STATUS.UNAVAILABLE,
        }
      }

      try {
        const pos = await getCurrentPositionPromise(
          navigator.geolocation.getCurrentPosition.bind(navigator.geolocation),
          {
            enableHighAccuracy: true,
            maximumAge: INITIAL_FIX_MAXIMUM_AGE_MS,
            timeout: timeoutMs,
          },
          timeoutMs,
        )
        return {
          permission: LOCATION_PERMISSION.GRANTED,
          position: mapSample(pos),
          fixStatus: LOCATION_FIX_STATUS.AVAILABLE,
        }
      } catch (error) {
        const code = error?.code
        if (code === 1) {
          return {
            permission: LOCATION_PERMISSION.DENIED,
            position: null,
            fixStatus: LOCATION_FIX_STATUS.IDLE,
          }
        }

        const after = await queryBrowserPermission()
        if (after === LOCATION_PERMISSION.GRANTED) {
          return {
            permission: LOCATION_PERMISSION.GRANTED,
            position: null,
            fixStatus:
              code === 3 ? LOCATION_FIX_STATUS.SEARCHING : LOCATION_FIX_STATUS.UNAVAILABLE,
            timedOut: code === 3 || error?.name === 'TimeoutError',
          }
        }

        // Timeout with no confirmation of grant — treat as cancelled prompt, not denial spam.
        if (code === 3 || error?.name === 'TimeoutError') {
          return {
            permission: LOCATION_PERMISSION.PROMPT,
            position: null,
            fixStatus: LOCATION_FIX_STATUS.UNAVAILABLE,
            timedOut: true,
          }
        }

        return {
          permission: LOCATION_PERMISSION.PROMPT,
          position: null,
          fixStatus: LOCATION_FIX_STATUS.UNAVAILABLE,
        }
      }
    },

    async getCurrentPosition({ timeoutMs = defaultTimeoutMs } = {}) {
      if (typeof navigator === 'undefined' || !navigator.geolocation?.getCurrentPosition) {
        return null
      }
      try {
        const pos = await getCurrentPositionPromise(
          navigator.geolocation.getCurrentPosition.bind(navigator.geolocation),
          {
            enableHighAccuracy: true,
            maximumAge: INITIAL_FIX_MAXIMUM_AGE_MS,
            timeout: timeoutMs,
          },
          timeoutMs,
        )
        return mapSample(pos)
      } catch {
        return null
      }
    },
  }
}
