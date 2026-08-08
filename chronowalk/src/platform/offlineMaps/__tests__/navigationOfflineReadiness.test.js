import { describe, expect, it } from 'vitest'
import {
  NAVIGATION_OFFLINE_READINESS,
  resolveNavigationOfflineReadiness,
} from '../navigationOfflineReadiness.js'
import { OFFLINE_MAP_STATUS } from '../offlineMapStatus.js'

describe('resolveNavigationOfflineReadiness', () => {
  it('returns READY only when package + map + route legs are prepared', () => {
    expect(
      resolveNavigationOfflineReadiness({
        packageStatus: 'ready',
        mapRegionDownloaded: true,
        routeLegsPrepared: true,
      }),
    ).toMatchObject({
      readiness: NAVIGATION_OFFLINE_READINESS.READY,
      canOpenPreparedMap: true,
    })
  })

  it('returns DOWNLOADING while package or map is in flight', () => {
    expect(
      resolveNavigationOfflineReadiness({
        packageStatus: 'downloading',
        mapRegionDownloaded: false,
        routeLegsPrepared: true,
      }).readiness,
    ).toBe(NAVIGATION_OFFLINE_READINESS.DOWNLOADING)

    expect(
      resolveNavigationOfflineReadiness({
        packageStatus: 'ready',
        mapRegionStatus: OFFLINE_MAP_STATUS.DOWNLOADING,
        routeLegsPrepared: true,
      }).readiness,
    ).toBe(NAVIGATION_OFFLINE_READINESS.DOWNLOADING)
  })

  it('returns INCOMPLETE for partial packages (no Ready offline claim)', () => {
    expect(
      resolveNavigationOfflineReadiness({
        packageStatus: 'ready',
        mapRegionDownloaded: false,
        routeLegsPrepared: true,
      }),
    ).toMatchObject({
      readiness: NAVIGATION_OFFLINE_READINESS.INCOMPLETE,
      reason: 'map_region_not_downloaded',
      canRetry: true,
    })
  })

  it('returns FAILED with retry when download failed', () => {
    expect(
      resolveNavigationOfflineReadiness({
        packageStatus: 'failed',
        mapRegionDownloaded: false,
        routeLegsPrepared: true,
      }),
    ).toMatchObject({
      readiness: NAVIGATION_OFFLINE_READINESS.FAILED,
      canRetry: true,
    })
  })

  it('returns INCOMPLETE when map is ready but route package is straight-line-only', () => {
    expect(
      resolveNavigationOfflineReadiness({
        packageStatus: 'ready',
        mapRegionDownloaded: true,
        routeLegsPrepared: false,
      }),
    ).toMatchObject({
      readiness: NAVIGATION_OFFLINE_READINESS.INCOMPLETE,
      reason: 'route_legs_not_prepared',
      routeLegsReady: false,
    })
  })

  it('defaults routeLegsPrepared from packaged completeness (currently incomplete)', () => {
    expect(
      resolveNavigationOfflineReadiness({
        packageStatus: 'ready',
        mapRegionDownloaded: true,
      }),
    ).toMatchObject({
      readiness: NAVIGATION_OFFLINE_READINESS.INCOMPLETE,
      routeLegsReady: false,
      reason: 'route_legs_not_prepared',
    })
  })

  it('returns NOT_PREPARED when nothing is ready', () => {
    expect(
      resolveNavigationOfflineReadiness({
        packageStatus: 'not_downloaded',
        mapRegionDownloaded: false,
        routeLegsPrepared: true,
      }).readiness,
    ).toBe(NAVIGATION_OFFLINE_READINESS.NOT_PREPARED)
  })
})
