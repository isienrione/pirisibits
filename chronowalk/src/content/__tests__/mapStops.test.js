import { describe, expect, it } from 'vitest'
import { loadRomeManifest } from '../manifest.js'
import {
  buildManifestTour,
  buildMapStopsFromManifest,
  getManifestTourBounds,
  resolveActiveMapLeg,
} from '../mapStops.js'

describe('mapStops', () => {
  const manifest = loadRomeManifest()

  it('builds a manifest tour with waypoint stop ids', () => {
    const tour = buildManifestTour(manifest, 'a')
    expect(tour.id).toBe('rome')
    expect(tour.stopIds[0]).toBe('w01')
    expect(tour.stopIds).toContain('w03')
    expect(tour.bounds?.center?.lat).toBeGreaterThan(41)
  })

  it('marks the current target stop on the map', () => {
    const stops = buildMapStopsFromManifest(manifest, {
      path: 'a',
      sequenceIndex: 0,
      completedWaypointIds: [],
    })

    expect(stops.find((stop) => stop.id === 'w01')?.status).toBe('current')
    expect(stops.find((stop) => stop.id === 'w02')?.status).toBe('locked')
  })

  it('reflects completed waypoints', () => {
    const stops = buildMapStopsFromManifest(manifest, {
      path: 'a',
      sequenceIndex: 2,
      completedWaypointIds: ['w01', 'w02'],
    })

    expect(stops.find((stop) => stop.id === 'w01')?.status).toBe('completed')
    expect(stops.find((stop) => stop.id === 'w02')?.status).toBe('completed')
  })

  it('resolves active leg during transit', () => {
    const leg = resolveActiveMapLeg(manifest, 'a', 2)
    expect(leg.activeTargetId).toBe('w03')
    expect(leg.activeLeg).toEqual({ fromId: 'w02', toId: 'w03' })
    expect(leg.transitLegActive).toBe(true)
  })

  it('computes bounds from manifest geofences', () => {
    const stopIds = buildManifestTour(manifest, 'a').stopIds
    const bounds = getManifestTourBounds(manifest, stopIds)
    expect(bounds?.minLat).toBeLessThan(bounds?.maxLat)
    expect(bounds?.minLng).toBeLessThan(bounds?.maxLng)
  })
})
