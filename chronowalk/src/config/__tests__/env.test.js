import { afterEach, describe, expect, it } from 'vitest'
import {
  getDebugStopId,
  getSingleWaypointId,
  getTourId,
  isDebugMap,
  shouldResetTour,
} from '../env'

const setSearch = (search) => {
  window.history.replaceState({}, '', search || '/')
}

describe('env URL params', () => {
  afterEach(() => {
    setSearch('')
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
    setSearch('/?tour=rome-city')
    expect(getTourId()).toBe('rome-city')
  })

  it('reads resetTour and debugStop params', () => {
    setSearch('/?resetTour=true&debugStop=pantheon')
    expect(shouldResetTour()).toBe(true)
    expect(getDebugStopId()).toBe('pantheon')
  })

  it('enables map debug overlays via debugMap or debug params', () => {
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
})
