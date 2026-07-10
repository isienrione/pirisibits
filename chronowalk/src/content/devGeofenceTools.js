export const DEV_GEOFENCES_MODE_KEY = 'cw_dev_geofences_mode'
export const DEV_GEOFENCES_CHANGED = 'cw-dev-geofences-changed'

/** Persist ?devGeofences= from the landing URL before SPA navigation strips it. */
export function syncDevGeofencesModeFromUrl() {
  if (typeof window === 'undefined') return null

  const param = new URLSearchParams(window.location.search).get('devGeofences')
  if (param === 'off' || param === '0' || param === 'false') {
    window.sessionStorage.removeItem(DEV_GEOFENCES_MODE_KEY)
    window.dispatchEvent(new Event(DEV_GEOFENCES_CHANGED))
    return null
  }

  if (param) {
    const mode = String(param).trim().toLowerCase()
    window.sessionStorage.setItem(DEV_GEOFENCES_MODE_KEY, mode)
    window.dispatchEvent(new Event(DEV_GEOFENCES_CHANGED))
    return mode
  }

  return readDevGeofencesMode()
}

export function readDevGeofencesMode() {
  if (typeof window === 'undefined') return null
  return window.sessionStorage.getItem(DEV_GEOFENCES_MODE_KEY)
}

export function clearDevGeofencesMode() {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(DEV_GEOFENCES_MODE_KEY)
  window.dispatchEvent(new Event(DEV_GEOFENCES_CHANGED))
}

if (typeof window !== 'undefined') {
  syncDevGeofencesModeFromUrl()
}
