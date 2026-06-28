import { beforeEach, describe, expect, it, vi } from 'vitest'
import { COLOSSEUM_WAYPOINT } from '../../data/colosseum'

const storage = vi.hoisted(() => ({
  records: new Map(),
  cache: new Map(),
}))

const singleStopTour = vi.hoisted(() => ({
  id: 'rome-core',
  title: 'Heart of Ancient Rome',
  stopIds: ['colosseum'],
  mapZoom: 14,
}))

const TOUR_PACKAGE_STATUS = vi.hoisted(() => ({
  DOWNLOADING: 'downloading',
  COMPLETE: 'complete',
  FAILED: 'failed',
}))

vi.mock('../../services/tourRegistry.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    getTourById: vi.fn(() => singleStopTour),
  }
})

vi.mock('../../services/waypointService.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    fetchWaypointById: vi.fn(async (id) => ({
      ...COLOSSEUM_WAYPOINT,
      id,
      title: id,
    })),
  }
})

vi.mock('../offlineStorage.js', () => ({
  TOUR_PACKAGE_STATUS,
  hasCachedAsset: vi.fn(async (cacheKey) => storage.cache.has(cacheKey)),
  putCachedAsset: vi.fn(async (cacheKey, response) => {
    storage.cache.set(cacheKey, response)
  }),
  readTourPackageRecord: vi.fn(async (tourId) => storage.records.get(tourId) ?? null),
  writeTourPackageRecord: vi.fn(async (record) => {
    storage.records.set(record.tourId, record)
    return record
  }),
  deleteTourPackageRecord: vi.fn(async (tourId) => {
    storage.records.delete(tourId)
  }),
  deleteCachedAssets: vi.fn(async (cacheKeys) => {
    cacheKeys.forEach((key) => storage.cache.delete(key))
  }),
}))

import {
  deleteDownloadedTour,
  downloadTourAssets,
  verifyDownloadedTourAssets,
} from '../downloadManager'
import { buildTourCacheManifest } from '../cacheManifest'

describe('downloadManager', () => {
  beforeEach(() => {
    storage.records.clear()
    storage.cache.clear()
    global.fetch = vi.fn(async (url) => ({
      ok: true,
      status: 200,
      clone() {
        return this
      },
      url: String(url),
    }))
  })

  it('downloads tour metadata and assets with progress updates', async () => {
    const progress = []

    const result = await downloadTourAssets('rome-core', {
      onProgress: (payload) => progress.push(payload),
    })

    expect(result.status).toBe(TOUR_PACKAGE_STATUS.COMPLETE)
    expect(global.fetch).toHaveBeenCalled()
    expect(progress.some((entry) => entry.phase === 'metadata')).toBe(true)
    expect(progress.some((entry) => entry.phase === 'assets')).toBe(true)
    expect(progress.at(-1)?.percent).toBe(100)
    expect(storage.records.get('rome-core')?.status).toBe(TOUR_PACKAGE_STATUS.COMPLETE)
  })

  it('verifies downloaded assets against the manifest', async () => {
    const manifest = buildTourCacheManifest({
      tour: singleStopTour,
      waypoints: [COLOSSEUM_WAYPOINT],
    })

    for (const asset of manifest.assets) {
      storage.cache.set(asset.cacheKey, { ok: true })
    }

    const verification = await verifyDownloadedTourAssets(manifest)
    expect(verification.valid).toBe(true)
    expect(verification.missing).toEqual([])
  })

  it('deletes cached assets and metadata for a tour', async () => {
    const manifest = buildTourCacheManifest({
      tour: singleStopTour,
      waypoints: [COLOSSEUM_WAYPOINT],
    })

    manifest.assets.forEach((asset) => storage.cache.set(asset.cacheKey, { ok: true }))
    storage.records.set('rome-core', { tourId: 'rome-core', manifest })

    const result = await deleteDownloadedTour('rome-core')

    expect(result.deletedAssets).toBe(manifest.assets.length)
    expect(storage.records.has('rome-core')).toBe(false)
    expect(storage.cache.size).toBe(0)
  })
})
