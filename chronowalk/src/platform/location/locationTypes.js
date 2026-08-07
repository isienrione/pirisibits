/**
 * Location permission vs GPS-fix state model.
 *
 * PERMISSION GRANTED ≠ CURRENT GPS FIX AVAILABLE
 */

/** @typedef {'prompt' | 'granted' | 'denied'} LocationPermissionState */
/** @typedef {'idle' | 'searching' | 'available' | 'unavailable'} LocationFixStatus */

export const LOCATION_PERMISSION = Object.freeze({
  PROMPT: 'prompt',
  GRANTED: 'granted',
  DENIED: 'denied',
})

export const LOCATION_FIX_STATUS = Object.freeze({
  IDLE: 'idle',
  SEARCHING: 'searching',
  AVAILABLE: 'available',
  UNAVAILABLE: 'unavailable',
})

/** Bounded initial fix wait — never block UI beyond this. */
export const INITIAL_FIX_TIMEOUT_MS = 9000

/** Soft maximumAge for the first walking fix (ms). */
export const INITIAL_FIX_MAXIMUM_AGE_MS = 30_000

/**
 * Simulator QA (Xcode):
 * Features → Location → Custom Location
 * Rome near Colosseum: latitude 41.8902, longitude 12.4922
 *
 * Dev/web: VITE_DEBUG_GEO / rome location simulation may shortcut permission.
 * Production must not rely on simulation.
 */
export const SIMULATOR_ROME_LOCATION = Object.freeze({
  latitude: 41.8902,
  longitude: 12.4922,
  label: 'Rome · Colosseum approach',
})

/**
 * @typedef {Object} LocationSample
 * @property {number} lat
 * @property {number} lng
 * @property {number} [accuracyM]
 * @property {number} [timestampMs]
 */

/**
 * @typedef {Object} LocationEnableResult
 * @property {LocationPermissionState} permission
 * @property {LocationFixStatus} fixStatus
 * @property {boolean} locationEnabled
 * @property {LocationSample | null} position
 * @property {boolean} shouldAdvance
 * @property {'granted' | 'denied'} access
 * @property {boolean} [timedOut]
 */

/**
 * @param {unknown} value
 * @returns {LocationPermissionState}
 */
export function normalizePermissionState(value) {
  if (value === LOCATION_PERMISSION.GRANTED || value === 'authorized') {
    return LOCATION_PERMISSION.GRANTED
  }
  if (
    value === LOCATION_PERMISSION.DENIED ||
    value === 'denied' ||
    value === 'restricted'
  ) {
    return LOCATION_PERMISSION.DENIED
  }
  return LOCATION_PERMISSION.PROMPT
}

/**
 * @param {Partial<LocationEnableResult> & { permission: LocationPermissionState }} partial
 * @returns {LocationEnableResult}
 */
export function buildLocationEnableResult(partial) {
  const permission = normalizePermissionState(partial.permission)
  const locationEnabled = permission === LOCATION_PERMISSION.GRANTED
  const fixStatus =
    partial.fixStatus ??
    (locationEnabled ? LOCATION_FIX_STATUS.SEARCHING : LOCATION_FIX_STATUS.IDLE)

  return {
    permission,
    fixStatus,
    locationEnabled,
    position: partial.position ?? null,
    shouldAdvance: locationEnabled || permission === LOCATION_PERMISSION.DENIED,
    access: locationEnabled ? 'granted' : 'denied',
    timedOut: Boolean(partial.timedOut),
  }
}
