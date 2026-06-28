import { beforeEach, describe, expect, it } from 'vitest'
import { COLOSSEUM_WAYPOINT } from '../../data/colosseum'
import { buildTourCacheManifest } from '../cacheManifest'
import { buildOfflineTourRecords } from '../offlineRecords'
import {
  deleteOfflineTourData,
  getOfflineAudioAssets,
  getOfflineCompletedWaypointIds,
  getOfflineTour,
  getOfflineWaypointRecord,
  loadOfflineUserProgress,
  persistOfflineTourRecords,
  saveOfflineUserProgress,
} from '../offlineRepository'
import { getOfflineStorageMode, getOfflineStore, resetOfflineStoreForTests } from '../idbClient'
import { TOUR_PACKAGE_STATUS } from '../offlineStorage'

const singleStopTour = {
  id: 'rome-core',
  title: 'Heart of Ancient Rome',
  stopIds: ['colosseum'],
  mapZoom: 14,
}

describe('offlineRepository', () => {
  beforeEach(async () => {
    await resetOfflineStoreForTests()
  })

  it('uses memory fallback when IndexedDB is unavailable', async () => {
    const original = global.indexedDB
    // @ts-expect-error test override
    global.indexedDB = undefined

    await getOfflineStore()
    expect(getOfflineStorageMode()).toBe('memory')

    global.indexedDB = original
    await resetOfflineStoreForTests()
  })

  it('persists and reads structured tour content', async () => {
    const manifest = buildTourCacheManifest({
      tour: singleStopTour,
      waypoints: [COLOSSEUM_WAYPOINT],
    })

    const records = buildOfflineTourRecords({
      tour: singleStopTour,
      waypoints: [COLOSSEUM_WAYPOINT],
      manifest,
      status: TOUR_PACKAGE_STATUS.COMPLETE,
      downloadedAt: Date.now(),
      verifiedAt: Date.now(),
    })

    await persistOfflineTourRecords(records, {
      tourId: 'rome-core',
      status: TOUR_PACKAGE_STATUS.COMPLETE,
      manifest,
    })

    const tour = await getOfflineTour('rome-core')
    const waypoint = await getOfflineWaypointRecord('rome-core', 'colosseum')
    const audioAssets = await getOfflineAudioAssets('rome-core')

    expect(tour?.status).toBe(TOUR_PACKAGE_STATUS.COMPLETE)
    expect(waypoint?.metadata?.arrival_headline).toContain('Colosseum')
    expect(audioAssets.length).toBeGreaterThan(0)
  })

  it('stores user progress and completed waypoint ids', async () => {
    await saveOfflineUserProgress('rome-core', {
      targetStopIndex: 1,
      transitLegActive: false,
      arrivedStopIds: ['colosseum'],
      startedAtMs: 123,
    })

    const progress = await loadOfflineUserProgress('rome-core')
    const completed = await getOfflineCompletedWaypointIds('rome-core')

    expect(progress?.targetStopIndex).toBe(1)
    expect(progress?.startedAtMs).toBe(123)
    expect(completed).toEqual(['colosseum'])
  })

  it('deletes all tour-scoped records', async () => {
    const manifest = buildTourCacheManifest({
      tour: singleStopTour,
      waypoints: [COLOSSEUM_WAYPOINT],
    })

    const records = buildOfflineTourRecords({
      tour: singleStopTour,
      waypoints: [COLOSSEUM_WAYPOINT],
      manifest,
      status: TOUR_PACKAGE_STATUS.COMPLETE,
    })

    await persistOfflineTourRecords(records)
    await saveOfflineUserProgress('rome-core', {
      targetStopIndex: 0,
      arrivedStopIds: ['colosseum'],
      transitLegActive: false,
    })

    await deleteOfflineTourData('rome-core')

    expect(await getOfflineTour('rome-core')).toBeNull()
    expect(await loadOfflineUserProgress('rome-core')).toBeNull()
  })
})
