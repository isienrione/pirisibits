import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../runtime/platformRuntime.js', () => ({
  isNativeIOS: vi.fn(),
}))

vi.mock('../nativeOfflineMaps.js', () => ({
  getRegionStatus: vi.fn(),
  downloadRegion: vi.fn(),
  deleteRegion: vi.fn(),
  subscribeOfflineMapProgress: vi.fn(() => () => {}),
}))

import { isNativeIOS } from '../../runtime/platformRuntime.js'
import {
  deleteRegion,
  downloadRegion,
  getRegionStatus,
} from '../nativeOfflineMaps.js'
import {
  clearNativeRomeMapRegion,
  ensureNativeRomeMapRegion,
  isNativePackageMapReady,
} from '../nativeMapPackageDownload.js'
import { OFFLINE_MAP_STATUS } from '../offlineMapStatus.js'

describe('ensureNativeRomeMapRegion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not invoke downloadRegion on web', async () => {
    vi.mocked(isNativeIOS).mockReturnValue(false)
    const result = await ensureNativeRomeMapRegion()
    expect(result).toMatchObject({
      invokedDownloadRegion: false,
      skipped: true,
      platform: 'web',
    })
    expect(downloadRegion).not.toHaveBeenCalled()
    expect(getRegionStatus).not.toHaveBeenCalled()
  })

  it('invokes downloadRegion({ cityId: rome }) on native iOS when missing', async () => {
    vi.mocked(isNativeIOS).mockReturnValue(true)
    vi.mocked(getRegionStatus).mockResolvedValue({
      status: OFFLINE_MAP_STATUS.NOT_DOWNLOADED,
    })
    vi.mocked(downloadRegion).mockResolvedValue({
      status: OFFLINE_MAP_STATUS.DOWNLOADED,
      completedResourceCount: 10,
      requiredResourceCount: 10,
    })

    const progress = vi.fn()
    const result = await ensureNativeRomeMapRegion({ onProgress: progress })

    expect(downloadRegion).toHaveBeenCalledWith({ cityId: 'rome' })
    expect(result).toMatchObject({
      invokedDownloadRegion: true,
      alreadyPresent: false,
      downloaded: true,
      platform: 'ios',
    })
    expect(progress).toHaveBeenCalled()
  })

  it('recognizes an already-downloaded TileStore region without redownload', async () => {
    vi.mocked(isNativeIOS).mockReturnValue(true)
    vi.mocked(getRegionStatus).mockResolvedValue({
      status: OFFLINE_MAP_STATUS.DOWNLOADED,
      completedResourceCount: 8,
      requiredResourceCount: 8,
    })

    const result = await ensureNativeRomeMapRegion()
    expect(downloadRegion).not.toHaveBeenCalled()
    expect(result).toMatchObject({
      invokedDownloadRegion: false,
      alreadyPresent: true,
      downloaded: true,
    })
  })

  it('surfaces controlled failure when downloadRegion does not reach downloaded', async () => {
    vi.mocked(isNativeIOS).mockReturnValue(true)
    vi.mocked(getRegionStatus).mockResolvedValue({
      status: OFFLINE_MAP_STATUS.NOT_DOWNLOADED,
    })
    vi.mocked(downloadRegion).mockResolvedValue({
      status: OFFLINE_MAP_STATUS.FAILED,
      errorCode: 'network_unavailable',
    })

    await expect(ensureNativeRomeMapRegion()).rejects.toMatchObject({
      code: 'network_unavailable',
    })
  })

  it('clearNativeRomeMapRegion deletes only on iOS', async () => {
    vi.mocked(isNativeIOS).mockReturnValue(false)
    await expect(clearNativeRomeMapRegion()).resolves.toMatchObject({ skipped: true })
    expect(deleteRegion).not.toHaveBeenCalled()

    vi.mocked(isNativeIOS).mockReturnValue(true)
    vi.mocked(deleteRegion).mockResolvedValue({ status: 'not_downloaded' })
    await expect(clearNativeRomeMapRegion()).resolves.toMatchObject({ deleted: true })
    expect(deleteRegion).toHaveBeenCalledWith({ cityId: 'rome' })
  })

  it('isNativePackageMapReady is true off iOS and mirrors TileStore on iOS', async () => {
    vi.mocked(isNativeIOS).mockReturnValue(false)
    await expect(isNativePackageMapReady()).resolves.toBe(true)

    vi.mocked(isNativeIOS).mockReturnValue(true)
    vi.mocked(getRegionStatus).mockResolvedValue({
      status: OFFLINE_MAP_STATUS.DOWNLOADED,
    })
    await expect(isNativePackageMapReady()).resolves.toBe(true)

    vi.mocked(getRegionStatus).mockResolvedValue({
      status: OFFLINE_MAP_STATUS.NOT_DOWNLOADED,
    })
    await expect(isNativePackageMapReady()).resolves.toBe(false)
  })
})
