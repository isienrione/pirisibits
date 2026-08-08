import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  isNativeMapRegionDownloaded,
  mergeOfflineReadyWithMapRegion,
  resolveOfflineReadyStatus,
} from '../nativeOfflineReady.js'
import { OFFLINE_MAP_STATUS } from '../offlineMapStatus.js'

vi.mock('../nativeOfflineMaps.js', () => ({
  getRegionStatus: vi.fn(),
}))

vi.mock('../../runtime/platformRuntime.js', () => ({
  isNativeIOS: vi.fn(),
}))

import { getRegionStatus } from '../nativeOfflineMaps.js'
import { isNativeIOS } from '../../runtime/platformRuntime.js'

describe('mergeOfflineReadyWithMapRegion', () => {
  it('does not show Ready offline unless native map region is downloaded', () => {
    expect(
      mergeOfflineReadyWithMapRegion({ status: 'ready', productId: 'rome-complete' }, false),
    ).toMatchObject({
      status: 'not_downloaded',
      mapRegionReady: false,
      routeLegsReady: false,
      reason: 'map_region_not_downloaded',
    })
  })

  it('does not show Ready offline when route package is straight-line-only', () => {
    expect(
      mergeOfflineReadyWithMapRegion({ status: 'ready' }, true),
    ).toMatchObject({
      status: 'not_downloaded',
      mapRegionReady: true,
      routeLegsReady: false,
      reason: 'route_legs_not_prepared',
    })
  })

  it('leaves non-ready package status unchanged aside from readiness fields', () => {
    expect(
      mergeOfflineReadyWithMapRegion({ status: 'downloading' }, false),
    ).toMatchObject({
      status: 'downloading',
      mapRegionReady: false,
      routeLegsReady: false,
    })
  })
})

describe('resolveOfflineReadyStatus', () => {
  beforeEach(() => {
    vi.mocked(isNativeIOS).mockReset()
    vi.mocked(getRegionStatus).mockReset()
  })

  it('requires native region downloaded on iOS', async () => {
    vi.mocked(isNativeIOS).mockReturnValue(true)
    vi.mocked(getRegionStatus).mockResolvedValue({
      status: OFFLINE_MAP_STATUS.NOT_DOWNLOADED,
    })
    await expect(
      resolveOfflineReadyStatus({ status: 'ready' }, { cityId: 'rome' }),
    ).resolves.toMatchObject({
      status: 'not_downloaded',
      mapRegionReady: false,
    })
    expect(getRegionStatus).toHaveBeenCalledWith({ cityId: 'rome' })
  })

  it('does not mark ready when TileStore is downloaded but walking routes are incomplete', async () => {
    vi.mocked(isNativeIOS).mockReturnValue(true)
    vi.mocked(getRegionStatus).mockResolvedValue({
      status: OFFLINE_MAP_STATUS.DOWNLOADED,
    })
    await expect(
      resolveOfflineReadyStatus({ status: 'ready' }),
    ).resolves.toMatchObject({
      status: 'not_downloaded',
      mapRegionReady: true,
      routeLegsReady: false,
      reason: 'route_legs_not_prepared',
    })
  })

  it('does not query TileStore on web', async () => {
    vi.mocked(isNativeIOS).mockReturnValue(false)
    await expect(
      resolveOfflineReadyStatus({ status: 'ready' }),
    ).resolves.toMatchObject({
      status: 'ready',
      mapRegionReady: false,
      routeLegsReady: false,
    })
    expect(getRegionStatus).not.toHaveBeenCalled()
  })

  it('isNativeMapRegionDownloaded is false off iOS', async () => {
    vi.mocked(isNativeIOS).mockReturnValue(false)
    await expect(isNativeMapRegionDownloaded('rome')).resolves.toBe(false)
  })
})
