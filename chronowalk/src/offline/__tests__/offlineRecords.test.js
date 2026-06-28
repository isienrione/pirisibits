import { describe, expect, it } from 'vitest'
import { COLOSSEUM_WAYPOINT } from '../../data/colosseum'
import { ROME_CORE_TOUR } from '../../data/rome-core-tour'
import { buildTourCacheManifest } from '../cacheManifest'
import {
  buildCompletedWaypointRecords,
  buildOfflineTourRecords,
  buildUserProgressRecord,
} from '../offlineRecords'
import { TOUR_PACKAGE_STATUS } from '../offlineStorage'

describe('offlineRecords', () => {
  it('builds structured records for each offline store', () => {
    const manifest = buildTourCacheManifest({
      tour: ROME_CORE_TOUR,
      waypoints: [COLOSSEUM_WAYPOINT],
    })

    const records = buildOfflineTourRecords({
      tour: ROME_CORE_TOUR,
      waypoints: [COLOSSEUM_WAYPOINT],
      manifest,
      status: TOUR_PACKAGE_STATUS.COMPLETE,
      downloadedAt: 100,
      verifiedAt: 100,
    })

    expect(records.tourRecord.tourId).toBe('rome-core')
    expect(records.waypointRecords).toHaveLength(1)
    expect(records.transitRecords.length).toBe(ROME_CORE_TOUR.stopIds.length - 1)
    expect(records.transcriptRecords[0]?.arrivalHeadline).toContain('Colosseum')
    expect(records.audioAssetRecords.length).toBeGreaterThan(0)
    expect(records.imageAssetRecords.length).toBeGreaterThan(0)
    expect(records.mediaCueRecords.length).toBeGreaterThan(0)
    expect(records.audioAssetRecords.every((asset) => asset.cacheKey)).toBe(true)
  })

  it('builds user progress and completed waypoint records', () => {
    const progress = buildUserProgressRecord('rome-core', {
      targetStopIndex: 2,
      transitLegActive: true,
      startedAtMs: 50,
      arrivedStopIds: ['colosseum', 'pantheon'],
    })

    const completed = buildCompletedWaypointRecords('rome-core', ['colosseum', 'pantheon'])

    expect(progress.tourId).toBe('rome-core')
    expect(progress.targetStopIndex).toBe(2)
    expect(completed).toHaveLength(2)
    expect(completed[0].stopId).toBe('colosseum')
  })
})
