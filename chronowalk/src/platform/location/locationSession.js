/**
 * In-memory location session — permission and GPS fix are separate.
 * Survives WebView route changes within the SPA; not localStorage proof of GPS.
 */

import {
  LOCATION_FIX_STATUS,
  LOCATION_PERMISSION,
  normalizePermissionState,
} from './locationTypes.js'

/** @type {import('./locationTypes.js').LocationPermissionState} */
let permission = LOCATION_PERMISSION.PROMPT
/** @type {import('./locationTypes.js').LocationFixStatus} */
let fixStatus = LOCATION_FIX_STATUS.IDLE
/** @type {import('./locationTypes.js').LocationSample | null} */
let position = null
let hasPrompted = false
/** @type {Set<(snapshot: ReturnType<typeof getLocationSession>) => void>} */
const listeners = new Set()

function emit() {
  const snapshot = getLocationSession()
  for (const listener of listeners) {
    try {
      listener(snapshot)
    } catch {
      // ignore subscriber errors
    }
  }
}

export function getLocationSession() {
  return {
    permission,
    fixStatus,
    position,
    locationEnabled: permission === LOCATION_PERMISSION.GRANTED,
    hasPrompted,
  }
}

/**
 * @param {{
 *   permission?: import('./locationTypes.js').LocationPermissionState,
 *   fixStatus?: import('./locationTypes.js').LocationFixStatus,
 *   position?: import('./locationTypes.js').LocationSample | null,
 *   hasPrompted?: boolean,
 * }} patch
 */
export function patchLocationSession(patch = {}) {
  if (patch.permission != null) {
    permission = normalizePermissionState(patch.permission)
  }
  if (patch.fixStatus != null) {
    fixStatus = patch.fixStatus
  }
  if ('position' in patch) {
    position = patch.position ?? null
  }
  if (typeof patch.hasPrompted === 'boolean') {
    hasPrompted = patch.hasPrompted
  }
  emit()
  return getLocationSession()
}

/** @param {(snapshot: ReturnType<typeof getLocationSession>) => void} listener */
export function subscribeLocationSession(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Test helper */
export function __resetLocationSessionForTests() {
  permission = LOCATION_PERMISSION.PROMPT
  fixStatus = LOCATION_FIX_STATUS.IDLE
  position = null
  hasPrompted = false
  listeners.clear()
}
