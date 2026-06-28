import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TOUR_PACKAGE_STATUS } from '../offlineStorage'

const manifest = {
  tourId: 'rome-core',
  tour: { id: 'rome-core', title: 'Heart of Ancient Rome', stopIds: ['colosseum'] },
  stopIds: ['colosseum'],
  waypoints: [{ id: 'colosseum', title: 'Colosseum', arrival_transcript: 'Sample transcript' }],
  assets: [{ cacheKey: 'https://example.com/audio.mp3' }],
  assetCount: 1,
}

vi.mock('../downloadManager.js', () => ({
  downloadTourAssets: vi.fn(),
  getActiveDownloadProgress: vi.fn(() => null),
  verifyDownloadedTourAssets: vi.fn(async () => ({ valid: true, total: 1, missing: [] })),
  deleteDownloadedTour: vi.fn(),
}))

vi.mock('../offlineStorage.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    readTourPackageRecord: vi.fn(),
    createBlobObjectUrl: vi.fn(async () => 'blob:offline-audio'),
    getOfflineWaypointRecord: vi.fn(),
    listTourPackageRecords: vi.fn(async () => []),
  }
})

vi.mock('../../services/tourRegistry.js', () => ({
  getTourById: vi.fn((tourId) =>
    tourId === 'rome-core'
      ? { id: 'rome-core', title: 'Heart of Ancient Rome', stopIds: ['colosseum'] }
      : null
  ),
}))

import {
  deleteTour,
  downloadTour,
  getOfflineWaypoint,
  isTourDownloaded,
  resolveOfflineMediaUrl,
  verifyTourPackage,
} from '../tourPackage'
import { readTourPackageRecord, getOfflineWaypointRecord } from '../offlineStorage'
import { verifyDownloadedTourAssets } from '../downloadManager'

describe('tourPackage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reports downloaded tours only when complete and verified', async () => {
    vi.mocked(readTourPackageRecord).mockResolvedValue({
      tourId: 'rome-core',
      status: TOUR_PACKAGE_STATUS.COMPLETE,
      manifest,
    })
    vi.mocked(verifyDownloadedTourAssets).mockResolvedValue({
      valid: true,
      total: 1,
      missing: [],
    })

    await expect(isTourDownloaded('rome-core')).resolves.toBe(true)
  })

  it('rejects incomplete packages during verification', async () => {
    vi.mocked(readTourPackageRecord).mockResolvedValue({
      tourId: 'rome-core',
      status: TOUR_PACKAGE_STATUS.DOWNLOADING,
      manifest,
    })

    const result = await verifyTourPackage('rome-core')
    expect(result.valid).toBe(true)
    expect(result.status).toBe(TOUR_PACKAGE_STATUS.DOWNLOADING)
  })

  it('returns offline waypoint metadata from IndexedDB', async () => {
    vi.mocked(getOfflineWaypointRecord).mockResolvedValue({
      stopId: 'colosseum',
      title: 'Colosseum',
      metadata: { arrival_transcript: 'Sample transcript' },
      geo: null,
    })

    const waypoint = await getOfflineWaypoint('rome-core', 'colosseum')
    expect(waypoint?.arrival_transcript).toBe('Sample transcript')
  })

  it('resolves offline media URLs when the package is verified', async () => {
    vi.mocked(readTourPackageRecord).mockResolvedValue({
      tourId: 'rome-core',
      status: TOUR_PACKAGE_STATUS.COMPLETE,
      manifest,
    })
    vi.mocked(verifyDownloadedTourAssets).mockResolvedValue({
      valid: true,
      total: 1,
      missing: [],
    })

    const url = await resolveOfflineMediaUrl(
      'rome-core',
      'colosseum',
      'arrival_immersive_url',
      'https://example.com/audio.mp3'
    )

    expect(url).toBe('blob:offline-audio')
  })

  it('delegates download and delete operations', async () => {
    const { downloadTourAssets, deleteDownloadedTour } = await import('../downloadManager.js')
    vi.mocked(downloadTourAssets).mockResolvedValue({ tourId: 'rome-core' })
    vi.mocked(deleteDownloadedTour).mockResolvedValue({ tourId: 'rome-core', deletedAssets: 1 })

    await downloadTour('rome-core')
    await deleteTour('rome-core')

    expect(downloadTourAssets).toHaveBeenCalledWith('rome-core', {})
    expect(deleteDownloadedTour).toHaveBeenCalledWith('rome-core')
  })
})
