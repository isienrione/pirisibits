export const DEV_GEOFENCES_MODE_KEY = 'cw_dev_geofences_mode'
export const DEV_GEOFENCES_CHANGED = 'cw-dev-geofences-changed'

export function readDevGeofencesMode() {
  if (typeof window === 'undefined') return null
  return window.sessionStorage.getItem(DEV_GEOFENCES_MODE_KEY)
}

function writeDevGeofencesMode(mode) {
  if (typeof window === 'undefined') return
  const next = mode ? String(mode).trim().toLowerCase() : null
  const prev = readDevGeofencesMode()
  if (prev === next) return
  if (next) {
    window.sessionStorage.setItem(DEV_GEOFENCES_MODE_KEY, next)
  } else {
    window.sessionStorage.removeItem(DEV_GEOFENCES_MODE_KEY)
  }
  window.dispatchEvent(new Event(DEV_GEOFENCES_CHANGED))
}

/** Persist ?devGeofences= from the landing URL before SPA navigation strips it. */
export function syncDevGeofencesModeFromUrl() {
  if (typeof window === 'undefined') return null

  const param = new URLSearchParams(window.location.search).get('devGeofences')
  if (param === 'off' || param === '0' || param === 'false') {
    writeDevGeofencesMode(null)
    return null
  }

  if (param) {
    const mode = String(param).trim().toLowerCase()
    writeDevGeofencesMode(mode)
    return mode
  }

  return readDevGeofencesMode()
}

export function clearDevGeofencesMode() {
  writeDevGeofencesMode(null)
}

if (typeof window !== 'undefined') {
  syncDevGeofencesModeFromUrl()
}
