import { afterEach, describe, expect, it } from 'vitest'
import {
  getDebugStopId,
  getDevGeofencesMode,
  getSingleWaypointId,
  getTourId,
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

const setSearch = (search) => {
  window.history.replaceState({}, '', search || '/')
}

describe('env URL params', () => {
  afterEach(() => {
    setSearch('')
    clearDevGeofencesMode()
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
})
