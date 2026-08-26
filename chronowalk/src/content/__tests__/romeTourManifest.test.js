import { describe, expect, it, beforeEach } from 'vitest'
import { COLOSSEUM_WAYPOINT } from '../../data/colosseum'
import {
  MANIFEST_STOP_FIELDS,
  assertManifestStopShape,
  deriveShortTitle,
  normalizeManifestStop,
} from '../manifest.schema'
import { buildStopFromLegacy } from '../legacyStopAdapter'
import {
  clearRomeTourManifestCache,
  getCurrentStop,
  getFirstStop,
  getStopById,
  getStopByIndex,
  loadRomeTourManifest,
} from '../romeTourManifest'

describe('manifest.schema', () => {
  it('derives short titles from legacy headings', () => {
    expect(deriveShortTitle('The Colosseum')).toBe('Colosseum')
    expect(deriveShortTitle('Pantheon')).toBe('Pantheon')
  })

  it('fills placeholder media when values are missing', () => {
    const stop = normalizeManifestStop({
      id: 'test-stop',
      number: 1,
      title: 'Test Stop',
      coords: { lat: 1, lng: 2 },
    })

    assertManifestStopShape(stop)
    expect(stop.heroImage).toBe('/waypoints/colosseum/exterior/modern-poster.jpg')
    expect(stop.transcript).toBe('/waypoints/colosseum/exterior/transcript.txt')
  })
})

describe('legacyStopAdapter', () => {
  it('maps colosseum legacy seed into manifest contract', () => {
    const stop = buildStopFromLegacy('colosseum', 0, 'palatine-hill-cluster')

    expect(stop.id).toBe('colosseum')
    expect(stop.number).toBe(1)
    expect(stop.title).toBe(COLOSSEUM_WAYPOINT.title)
    expect(stop.heroImage).toBe(COLOSSEUM_WAYPOINT.modern_poster_url)
    expect(stop.audio).toBe(COLOSSEUM_WAYPOINT.arrival_immersive_url)
    expect(stop.reconstructionThen).toBe(COLOSSEUM_WAYPOINT.ancient_video_url)
    // The reveal loop is the "then" layer, so it must prefer the ancient clip.
    expect(stop.reconstructionLoop).toBe(COLOSSEUM_WAYPOINT.ancient_video_url)
    expect(stop.nextStopId).toBe('palatine-hill-cluster')
    expect(stop.coords.lat).toBeCloseTo(41.8902, 3)
  })
})

describe('loadRomeTourManifest', () => {
  beforeEach(() => {
    clearRomeTourManifestCache()
  })

  it('loads heart-of-ancient-rome route order from one place', () => {
    const manifest = loadRomeTourManifest()

    expect(manifest.id).toBe('rome-launch')
    expect(manifest.stopOrder[0]).toBe('colosseum')
    expect(manifest.stops).toHaveLength(12)
    expect(manifest.stopsById.colosseum.number).toBe(1)
  })

  it('returns cached manifest on subsequent loads', () => {
    const first = loadRomeTourManifest()
    const second = loadRomeTourManifest()
    expect(second).toBe(first)
  })

  it('includes every required stop field', () => {
    const manifest = loadRomeTourManifest()

    for (const stop of manifest.stops) {
      for (const field of MANIFEST_STOP_FIELDS) {
        expect(stop).toHaveProperty(field)
      }
      assertManifestStopShape(stop)
    }
  })

  it('resolves current stop from journey context', () => {
    const manifest = loadRomeTourManifest()

    expect(getStopById(manifest, 'pantheon')?.title).toMatch(/Pantheon/i)
    expect(getStopByIndex(manifest, 0)?.id).toBe('colosseum')
    expect(getCurrentStop(manifest, { currentStopId: 'pantheon' })?.id).toBe('pantheon')
    expect(getCurrentStop(manifest, { currentStopIndex: 4 })?.id).toBe('pantheon')
    expect(getFirstStop(manifest)?.id).toBe('colosseum')
  })
})
