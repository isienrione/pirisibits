import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getDebugGeoPlacement,
  getDebugStopId,
  getDevGeofencesMode,
  getSingleWaypointId,
  getTourId,
  isDebugGeo,
  isDebugMap,
  isDevGeofencesSantiago,
  isDevPanelEnabled,
  shouldResetTour,
} from '../env'
import {
  clearDevGeofencesMode,
  DEV_GEOFENCES_MODE_KEY,
  syncDevGeofencesModeFromUrl,
} from '../../content/devGeofenceTools'

const ORIGINAL_HREF = window.location.href

const setSearch = (search) => {
  window.history.replaceState({}, '', search || '/')
}

/** Neutralize local Vite debug leakage for deterministic defaults. */
function stubNeutralDebugEnv() {
  vi.stubEnv('VITE_DEBUG_MAP', '')
  vi.stubEnv('VITE_DEBUG', '')
  vi.stubEnv('VITE_DEBUG_GEO', '')
  vi.stubEnv('VITE_DEBUG_GEO_PLACEMENT', '')
  vi.stubEnv('VITE_SIMULATE_LOCATION', '')
  vi.stubEnv('VITE_SIMULATE_ROME', '')
  vi.stubEnv('VITE_DEV_GEOFENCES', '')
}

describe('env URL params', () => {
  beforeEach(() => {
    stubNeutralDebugEnv()
    setSearch('/')
    clearDevGeofencesMode()
  })

  afterEach(() => {
    setSearch('/')
    window.history.replaceState({}, '', ORIGINAL_HREF)
    clearDevGeofencesMode()
    window.sessionStorage.removeItem(DEV_GEOFENCES_MODE_KEY)
    vi.unstubAllEnvs()
  })

  it('defaults to no tour until selected on the landing screen', () => {
    setSearch('/')
    expect(getTourId()).toBeNull()
    expect(getSingleWaypointId()).toBeNull()
  })

  it('does not treat ?waypoint= as single-stop mode', () => {
    setSearch('/?waypoint=pantheon&debugGeo=true')
    expect(getTourId()).toBeNull()
    expect(getSingleWaypointId()).toBeNull()
  })

  it('uses singleWaypoint for single-stop debug', () => {
    setSearch('/?singleWaypoint=pantheon&debugGeo=true')
    expect(getSingleWaypointId()).toBe('pantheon')
    expect(getTourId()).toBeNull()
  })

  it('reads explicit tour id from URL', () => {
    setSearch('/?tour=heart-of-ancient-rome')
    expect(getTourId()).toBe('heart-of-ancient-rome')
  })

  it('reads resetTour and debugStop params', () => {
    setSearch('/?resetTour=true&debugStop=pantheon')
    expect(shouldResetTour()).toBe(true)
    expect(getDebugStopId()).toBe('pantheon')
  })

  it('enables map debug overlays via debugMap or debug params', () => {
    clearDevGeofencesMode()
    setSearch('/?debugMap=true')
    expect(isDebugMap()).toBe(true)

    setSearch('/?debug=true')
    expect(isDebugMap()).toBe(true)

    setSearch('/')
    expect(isDebugMap()).toBe(false)
  })

  it('enables map debug overlays while debugGeo is active', () => {
    setSearch('/?debugGeo=true')
    expect(isDebugMap()).toBe(true)
  })

  it('accepts geo_debug as an alias for debugGeo', () => {
    setSearch('/?geo_debug=true&debugStop=colosseum')
    expect(isDebugMap()).toBe(true)
  })

  it('enables dev panel via URL param', () => {
    setSearch('/?devPanel=true')
    expect(isDevPanelEnabled()).toBe(true)

    setSearch('/?devPanel=false')
    expect(isDevPanelEnabled()).toBe(false)
  })

  it('persists devGeofences mode across navigation without query params', () => {
    setSearch('/journey?devGeofences=santiago')
    syncDevGeofencesModeFromUrl()
    expect(getDevGeofencesMode()).toBe('santiago')
    expect(isDevGeofencesSantiago()).toBe(true)

    setSearch('/begin')
    expect(getDevGeofencesMode()).toBe('santiago')
    expect(window.sessionStorage.getItem(DEV_GEOFENCES_MODE_KEY)).toBe('santiago')
  })

  it('enables map debug overlays while Santiago dev geofences are active', () => {
    setSearch('/journey?devGeofences=santiago')
    syncDevGeofencesModeFromUrl()
    expect(isDebugMap()).toBe(true)
  })

  it('does not let local Vite debug env contaminate default expectations', () => {
    vi.stubEnv('VITE_DEBUG_MAP', 'true')
    vi.stubEnv('VITE_DEBUG', 'true')
    vi.stubEnv('VITE_DEBUG_GEO', 'true')
    vi.stubEnv('VITE_DEBUG_GEO_PLACEMENT', 'arrived')
    setSearch('/')
    expect(isDebugMap()).toBe(true)
    expect(isDebugGeo()).toBe(true)
    expect(getDebugGeoPlacement()).toBe('arrived')

    // Restore neutral stubs · same as beforeEach · so defaults win again.
    stubNeutralDebugEnv()
    setSearch('/')
    clearDevGeofencesMode()
    expect(isDebugMap()).toBe(false)
    expect(isDebugGeo()).toBe(false)
    expect(getDebugGeoPlacement()).toBeNull()
  })

  it('honors VITE_DEBUG_MAP in development when explicitly enabled', () => {
    vi.stubEnv('PROD', false)
    vi.stubEnv('VITE_DEBUG_MAP', 'true')
    setSearch('/')
    expect(isDebugMap()).toBe(true)
  })
})
