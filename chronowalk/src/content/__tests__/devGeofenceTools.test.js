import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  clearDevGeofencesMode,
  DEV_GEOFENCES_CHANGED,
  DEV_GEOFENCES_MODE_KEY,
  syncDevGeofencesModeFromUrl,
} from '../devGeofenceTools.js'
import { clearRomeManifestCache, loadRomeManifest } from '../manifest.js'

const setSearch = (search) => {
  window.history.replaceState({}, '', search || '/')
}

describe('devGeofenceTools', () => {
  afterEach(() => {
    setSearch('/')
    clearDevGeofencesMode()
  })

  it('does not dispatch change events when the mode is unchanged', () => {
    const handler = vi.fn()
    window.addEventListener(DEV_GEOFENCES_CHANGED, handler)

    setSearch('/journey?devGeofences=santiago')
    syncDevGeofencesModeFromUrl()
    syncDevGeofencesModeFromUrl()
    syncDevGeofencesModeFromUrl()

    expect(handler).toHaveBeenCalledTimes(1)
    window.removeEventListener(DEV_GEOFENCES_CHANGED, handler)
  })

  it('allows repeated manifest loads without a reload loop', () => {
    setSearch('/journey?devGeofences=santiago')
    syncDevGeofencesModeFromUrl()

    const handler = vi.fn()
    window.addEventListener(DEV_GEOFENCES_CHANGED, handler)

    clearRomeManifestCache()
    for (let i = 0; i < 5; i += 1) {
      const manifest = loadRomeManifest()
      expect(manifest._devGeofenceOverrides?.mode).toBe('santiago')
    }

    expect(handler).toHaveBeenCalledTimes(0)
    window.removeEventListener(DEV_GEOFENCES_CHANGED, handler)
    expect(window.sessionStorage.getItem(DEV_GEOFENCES_MODE_KEY)).toBe('santiago')
  })
})
