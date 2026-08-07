/**
 * Native iOS location adapter — Capacitor Geolocation, lazy-loaded.
 * Never imported by the web/PWA cold path except through the facade after
 * isNativeIOS() is true.
 */

import {
  INITIAL_FIX_MAXIMUM_AGE_MS,
  INITIAL_FIX_TIMEOUT_MS,
  LOCATION_FIX_STATUS,
  LOCATION_PERMISSION,
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

/**
 * @param {{
 *   timeoutMs?: number,
 *   loadGeolocation?: () => Promise<any>,
 * }} [options]
 */
export function createNativeLocationAdapter(options = {}) {
  const defaultTimeoutMs = options.timeoutMs ?? INITIAL_FIX_TIMEOUT_MS
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

  return {
    async checkPermission() {
      try {
        const Geolocation = await getGeo()
        const status = await Geolocation.checkPermissions()
        return mapCapacitorPermission(status)
      } catch {
        return LOCATION_PERMISSION.PROMPT
      }
    },

    /**
     * Request/check permission WITHOUT waiting for a GPS fix.
     * This is the critical native path that must never hang the Enable Location UI.
     */
    async requestPermission() {
      try {
        const Geolocation = await getGeo()
        let status = await Geolocation.checkPermissions()
        let permission = mapCapacitorPermission(status)

        if (permission === LOCATION_PERMISSION.PROMPT) {
          status = await Geolocation.requestPermissions()
          permission = mapCapacitorPermission(status)
        }

        if (permission === LOCATION_PERMISSION.GRANTED) {
          return {
            permission,
            position: null,
            fixStatus: LOCATION_FIX_STATUS.SEARCHING,
          }
        }

        return {
          permission:
            permission === LOCATION_PERMISSION.DENIED
              ? LOCATION_PERMISSION.DENIED
              : LOCATION_PERMISSION.DENIED,
          position: null,
          fixStatus: LOCATION_FIX_STATUS.IDLE,
        }
      } catch {
        return {
          permission: LOCATION_PERMISSION.DENIED,
          position: null,
          fixStatus: LOCATION_FIX_STATUS.UNAVAILABLE,
        }
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
