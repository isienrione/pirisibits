import { afterEach, describe, expect, it } from 'vitest'
import {
  getDebugStopId,
  getSingleWaypointId,
  getTourId,
  shouldResetTour,
} from '../env'

const setSearch = (search) => {
  window.history.replaceState({}, '', search || '/')
}

describe('env URL params', () => {
  afterEach(() => {
    setSearch('')
  })

  it('defaults to rome-core tour', () => {
    setSearch('/')
    expect(getTourId()).toBe('rome-core')
    expect(getSingleWaypointId()).toBeNull()
  })

  it('does not treat ?waypoint= as single-stop mode', () => {
    setSearch('/?waypoint=pantheon&debugGeo=true')
    expect(getTourId()).toBe('rome-core')
    expect(getSingleWaypointId()).toBeNull()
  })

  it('uses singleWaypoint for single-stop debug', () => {
    setSearch('/?singleWaypoint=pantheon&debugGeo=true')
    expect(getSingleWaypointId()).toBe('pantheon')
    expect(getTourId()).toBe('rome-core')
  })

  it('reads resetTour and debugStop params', () => {
    setSearch('/?resetTour=true&debugStop=pantheon')
    expect(shouldResetTour()).toBe(true)
    expect(getDebugStopId()).toBe('pantheon')
  })
})
