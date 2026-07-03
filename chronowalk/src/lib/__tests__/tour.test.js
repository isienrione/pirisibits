import { describe, expect, it } from 'vitest'
import manifest from '../../../public/tours/rome/manifest.json'
import { getWaypoint, orderedWaypointIds } from '../../lib/tour'

describe('rome tour manifest', () => {
  it('loads 22 waypoints and 21 transits', () => {
    expect(manifest.waypoints).toHaveLength(22)
    expect(manifest.transits).toHaveLength(21)
  })

  it('maps day plans to waypoint ids', () => {
    const day1 = manifest.days.find((day) => day.day === 1)
    const day2 = manifest.days.find((day) => day.day === 2)
    expect(day1.waypoints).toHaveLength(14)
    expect(day2.waypoints).toHaveLength(8)
    expect(day1.waypoints[0]).toBe('w01')
    expect(day2.waypoints[0]).toBe('w15')
  })

  it('resolves waypoint by id', () => {
    const colosseum = getWaypoint(manifest, 'w01')
    expect(colosseum?.name).toBe('The Colosseum')
    expect(colosseum?.coords.lat).toBeCloseTo(41.8902, 4)
  })

  it('orders waypoint ids in chapter sequence', () => {
    expect(orderedWaypointIds(manifest)[0]).toBe('w01')
    expect(orderedWaypointIds(manifest)[21]).toBe('w22')
  })
})
