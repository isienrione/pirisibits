import { describe, expect, it } from 'vitest'
import { COLOSSEUM_WAYPOINT } from '../../data/colosseum'
import { ROME_CORE_TOUR } from '../../data/rome-core-tour'
import {
  buildTourCacheManifest,
  canonicalAssetUrl,
  collectWaypointAssetEntries,
  dedupeAssetEntries,
  inferMediaKind,
  listRequiredCacheKeys,
} from '../cacheManifest'

describe('cacheManifest', () => {
  it('collects media assets for a waypoint', () => {
    const entries = collectWaypointAssetEntries(COLOSSEUM_WAYPOINT)

    expect(entries.length).toBeGreaterThan(5)
    expect(entries.some((entry) => entry.field === 'modern_video_url')).toBe(true)
    expect(entries.every((entry) => entry.cacheKey.startsWith('http'))).toBe(true)
  })

  it('dedupes assets that resolve to the same cache key', () => {
    const deduped = dedupeAssetEntries([
      {
        id: 'a:transit_narrative_url',
        stopId: 'a',
        field: 'transit_narrative_url',
        sourceUrl: 'https://example.com/audio.mp3?v=1',
        cacheKey: 'https://example.com/audio.mp3',
        mediaKind: 'audio',
      },
      {
        id: 'a:arrival_immersive_url',
        stopId: 'a',
        field: 'arrival_immersive_url',
        sourceUrl: 'https://example.com/audio.mp3?v=2',
        cacheKey: 'https://example.com/audio.mp3',
        mediaKind: 'audio',
      },
    ])

    expect(deduped).toHaveLength(1)
  })

  it('builds a tour manifest with route metadata and assets', () => {
    const manifest = buildTourCacheManifest({
      tour: ROME_CORE_TOUR,
      waypoints: [COLOSSEUM_WAYPOINT],
    })

    expect(manifest.tourId).toBe('rome-core')
    expect(manifest.stopIds).toEqual(ROME_CORE_TOUR.stopIds)
    expect(manifest.legs.length).toBe(ROME_CORE_TOUR.stopIds.length - 1)
    expect(manifest.bounds?.center).toBeTruthy()
    expect(manifest.geoByStopId.colosseum?.title).toBeTruthy()
    expect(manifest.waypoints[0]?.arrival_headline).toBeTruthy()
    expect(manifest.assets.length).toBeGreaterThan(0)
    expect(listRequiredCacheKeys(manifest)).toHaveLength(manifest.assets.length)
  })

  it('normalizes cache keys and infers media kinds', () => {
    expect(canonicalAssetUrl('https://example.com/a.jpg?cwv=colosseum-1')).toBe(
      'https://example.com/a.jpg'
    )
    expect(inferMediaKind('https://example.com/story.mp3')).toBe('audio')
    expect(inferMediaKind('https://example.com/reveal.mp4')).toBe('video')
    expect(inferMediaKind('https://example.com/frame.jpg')).toBe('image')
  })
})
