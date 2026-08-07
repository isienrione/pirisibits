import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  deleteRegion,
  downloadRegion,
  getOfflineMapConfig,
  getRegionStatus,
  isSupported,
  openTestMap,
  normalizeDownloadProgress,
  normalizeOfflineMapErrorCode,
  normalizeOfflineMapStatus,
  normalizeRegionStatus,
  OFFLINE_MAP_ERROR,
  OFFLINE_MAP_STATUS,
  resolveNativeOfflineMapsPlugin,
  ROME_OFFLINE_MAP_BOUNDS,
  ROME_OFFLINE_MAP_CONFIG,
  ROME_OFFLINE_MAP_ZOOM,
  subscribeOfflineMapProgress,
} from '../index.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '../../../..')
const SWIFT_CONFIG = join(
  ROOT,
  'plugins/chronowalk-offline-maps/ios/Sources/ChronoWalkOfflineMapsPlugin/OfflineMapRegionConfig.swift',
)

function stubCapacitor({ native = false, platform = 'web', plugins = {} } = {}) {
  const capacitor = {
    isNativePlatform: () => native,
    getPlatform: () => platform,
    isNative: native,
    Plugins: plugins,
  }
  if (typeof window !== 'undefined') {
    window.Capacitor = capacitor
  } else {
    vi.stubGlobal('window', { Capacitor: capacitor })
  }
  return capacitor
}

beforeEach(() => {
  vi.unstubAllGlobals()
  if (typeof window !== 'undefined') {
    delete window.Capacitor
  }
})

describe('web does not invoke native plugin', () => {
  it('returns supported:false without touching Plugins', async () => {
    const isSupportedFn = vi.fn()
    stubCapacitor({
      native: false,
      platform: 'web',
      plugins: {
        ChronoWalkOfflineMaps: { isSupported: isSupportedFn },
      },
    })

    const result = await isSupported()
    expect(result).toEqual({ supported: false, platform: 'web' })
    expect(isSupportedFn).not.toHaveBeenCalled()
    expect(resolveNativeOfflineMapsPlugin()).toBeNull()
  })

  it('get/download/delete/openTestMap fail safely on web', async () => {
    const plugin = {
      getRegionStatus: vi.fn(),
      downloadRegion: vi.fn(),
      deleteRegion: vi.fn(),
      openTestMap: vi.fn(),
    }
    stubCapacitor({ native: false, platform: 'web', plugins: { ChronoWalkOfflineMaps: plugin } })

    await expect(getRegionStatus({ cityId: 'rome' })).resolves.toMatchObject({
      supported: false,
      status: OFFLINE_MAP_STATUS.NOT_DOWNLOADED,
      errorCode: OFFLINE_MAP_ERROR.UNSUPPORTED_PLATFORM,
    })
    await expect(downloadRegion({ cityId: 'rome' })).resolves.toMatchObject({
      supported: false,
      errorCode: OFFLINE_MAP_ERROR.UNSUPPORTED_PLATFORM,
    })
    await expect(deleteRegion('rome')).resolves.toMatchObject({
      supported: false,
      errorCode: OFFLINE_MAP_ERROR.UNSUPPORTED_PLATFORM,
    })
    await expect(openTestMap({ cityId: 'rome' })).resolves.toMatchObject({
      opened: false,
      supported: false,
      errorCode: OFFLINE_MAP_ERROR.UNSUPPORTED_PLATFORM,
    })
    expect(plugin.getRegionStatus).not.toHaveBeenCalled()
    expect(plugin.downloadRegion).not.toHaveBeenCalled()
    expect(plugin.deleteRegion).not.toHaveBeenCalled()
    expect(plugin.openTestMap).not.toHaveBeenCalled()
  })
})

describe('iOS bridge selects native plugin', () => {
  it('resolves ChronoWalkOfflineMaps on native iOS', async () => {
    const plugin = {
      isSupported: vi.fn(async () => ({ supported: true, platform: 'ios' })),
      getRegionStatus: vi.fn(async () => ({
        cityId: 'rome',
        status: 'downloaded',
        progress: 1,
        completedResourceCount: 10,
        requiredResourceCount: 10,
        supported: true,
      })),
      downloadRegion: vi.fn(async () => ({
        cityId: 'rome',
        status: 'downloaded',
        progress: 1,
        completedResourceCount: 4,
        requiredResourceCount: 4,
        supported: true,
      })),
      deleteRegion: vi.fn(async () => ({
        cityId: 'rome',
        status: 'not_downloaded',
        supported: true,
      })),
      openTestMap: vi.fn(async () => ({
        opened: true,
        cityId: 'rome',
        supported: true,
        renderer: 'mapbox-maps-ios',
        styleURI: 'mapbox://styles/mapbox/standard',
      })),
      addListener: vi.fn(async () => ({ remove: vi.fn() })),
    }
    stubCapacitor({ native: true, platform: 'ios', plugins: { ChronoWalkOfflineMaps: plugin } })

    expect(resolveNativeOfflineMapsPlugin()).toBe(plugin)
    await expect(isSupported()).resolves.toEqual({ supported: true, platform: 'ios' })
    await expect(getRegionStatus({ cityId: 'rome' })).resolves.toMatchObject({
      cityId: 'rome',
      status: 'downloaded',
      progress: 1,
      completedResourceCount: 10,
      requiredResourceCount: 10,
      supported: true,
    })
    await expect(downloadRegion({ cityId: 'Rome' })).resolves.toMatchObject({
      status: 'downloaded',
      supported: true,
    })
    expect(plugin.downloadRegion).toHaveBeenCalledWith({ cityId: 'rome' })
    await expect(deleteRegion({ cityId: 'rome' })).resolves.toMatchObject({
      status: 'not_downloaded',
      supported: true,
    })
    expect(plugin.deleteRegion).toHaveBeenCalledWith({ cityId: 'rome' })
    await expect(openTestMap({ cityId: 'rome' })).resolves.toMatchObject({
      opened: true,
      cityId: 'rome',
      supported: true,
      renderer: 'mapbox-maps-ios',
    })
    expect(plugin.openTestMap).toHaveBeenCalledWith({ cityId: 'rome' })

    const listener = vi.fn()
    const unsubscribe = subscribeOfflineMapProgress(listener)
    expect(plugin.addListener).toHaveBeenCalled()
    unsubscribe()
  })

  it('openTestMap returns mapbox_not_configured without crashing', async () => {
    const plugin = {
      openTestMap: vi.fn(async () => {
        const err = new Error('Mapbox public access token missing')
        err.code = 'mapbox_not_configured'
        throw err
      }),
    }
    stubCapacitor({ native: true, platform: 'ios', plugins: { ChronoWalkOfflineMaps: plugin } })
    await expect(openTestMap({ cityId: 'rome' })).resolves.toMatchObject({
      opened: false,
      supported: true,
      errorCode: OFFLINE_MAP_ERROR.MAPBOX_NOT_CONFIGURED,
    })
  })

  it('does not select native plugin on Android', async () => {
    const plugin = { isSupported: vi.fn(async () => ({ supported: true })) }
    stubCapacitor({ native: true, platform: 'android', plugins: { ChronoWalkOfflineMaps: plugin } })
    expect(resolveNativeOfflineMapsPlugin()).toBeNull()
    await expect(isSupported()).resolves.toEqual({ supported: false, platform: 'web' })
    expect(plugin.isSupported).not.toHaveBeenCalled()
  })
})

describe('Rome config is centralized', () => {
  it('exposes prototype bounds and walking zoom range', () => {
    expect(ROME_OFFLINE_MAP_BOUNDS).toEqual({
      west: 12.44,
      south: 41.86,
      east: 12.53,
      north: 41.93,
    })
    expect(ROME_OFFLINE_MAP_ZOOM).toEqual({ minZoom: 11, maxZoom: 16 })
    expect(ROME_OFFLINE_MAP_CONFIG.tileRegionId).toBe('chronowalk-rome')
    expect(ROME_OFFLINE_MAP_CONFIG.styleURI).toBe('mapbox://styles/mapbox/standard')
    expect(ROME_OFFLINE_MAP_CONFIG.initialZoom).toBe(13.5)
    expect(ROME_OFFLINE_MAP_CONFIG.center).toEqual({
      latitude: 41.895,
      longitude: 12.485,
    })
    expect(getOfflineMapConfig('rome')).toBe(ROME_OFFLINE_MAP_CONFIG)
    expect(getOfflineMapConfig('athens')).toBeNull()
  })

  it('keeps Swift OfflineMapRegionConfig in sync with JS values', () => {
    const swift = readFileSync(SWIFT_CONFIG, 'utf8')
    expect(swift).toContain('static let cityId = "rome"')
    expect(swift).toContain('static let west = 12.44')
    expect(swift).toContain('static let south = 41.86')
    expect(swift).toContain('static let east = 12.53')
    expect(swift).toContain('static let north = 41.93')
    expect(swift).toContain('static let minZoom: UInt8 = 11')
    expect(swift).toContain('static let maxZoom: UInt8 = 16')
    expect(swift).toContain('static let initialZoom: Double = 13.5')
    expect(swift).toContain('mapbox://styles/mapbox/standard')
    expect(swift).toContain('chronowalk-\\(cityId)')
  })
})

describe('status and progress normalization', () => {
  it('normalizes known statuses only', () => {
    expect(normalizeOfflineMapStatus('downloaded')).toBe('downloaded')
    expect(normalizeOfflineMapStatus('downloading')).toBe('downloading')
    expect(normalizeOfflineMapStatus('weird')).toBe('not_downloaded')
    expect(normalizeOfflineMapStatus(null)).toBe('not_downloaded')
  })

  it('normalizes controlled error codes', () => {
    expect(normalizeOfflineMapErrorCode('network_unavailable')).toBe(
      OFFLINE_MAP_ERROR.NETWORK_UNAVAILABLE,
    )
    expect(normalizeOfflineMapErrorCode('DiskFull')).toBe(OFFLINE_MAP_ERROR.DISK_FULL)
    expect(normalizeOfflineMapErrorCode('tile limit exceeded')).toBe(
      OFFLINE_MAP_ERROR.TILE_LIMIT_EXCEEDED,
    )
    expect(normalizeOfflineMapErrorCode('Missing access token')).toBe(
      OFFLINE_MAP_ERROR.MAPBOX_NOT_CONFIGURED,
    )
    expect(normalizeOfflineMapErrorCode('something else')).toBe(OFFLINE_MAP_ERROR.DOWNLOAD_FAILED)
  })

  it('normalizes download progress from resource counts without inventing bytes', () => {
    expect(
      normalizeDownloadProgress({
        completedResourceCount: 3,
        requiredResourceCount: 10,
      }),
    ).toEqual({
      progress: 0.3,
      completedResourceCount: 3,
      requiredResourceCount: 10,
    })
    expect(normalizeDownloadProgress({})).toEqual({
      progress: null,
      completedResourceCount: null,
      requiredResourceCount: null,
    })
    expect(
      normalizeRegionStatus({
        cityId: 'rome',
        status: 'downloading',
        completedResourceCount: 2,
        requiredResourceCount: 8,
        supported: true,
      }),
    ).toMatchObject({
      status: 'downloading',
      progress: 0.25,
      completedResourceCount: 2,
      requiredResourceCount: 8,
    })
  })
})

describe('delete behavior and unsupported platform safety', () => {
  it('maps deleteRegion("rome") to native plugin cityId', async () => {
    const plugin = {
      deleteRegion: vi.fn(async () => ({
        cityId: 'rome',
        status: 'not_downloaded',
        progress: null,
        completedResourceCount: null,
        requiredResourceCount: null,
        supported: true,
      })),
    }
    stubCapacitor({ native: true, platform: 'ios', plugins: { ChronoWalkOfflineMaps: plugin } })
    const result = await deleteRegion('rome')
    expect(plugin.deleteRegion).toHaveBeenCalledTimes(1)
    expect(plugin.deleteRegion).toHaveBeenCalledWith({ cityId: 'rome' })
    expect(result.status).toBe('not_downloaded')
    expect(result.supported).toBe(true)
  })

  it('fails safely when native plugin is missing on iOS', async () => {
    stubCapacitor({ native: true, platform: 'ios', plugins: {} })
    await expect(downloadRegion({ cityId: 'rome' })).resolves.toMatchObject({
      supported: false,
      errorCode: OFFLINE_MAP_ERROR.UNSUPPORTED_PLATFORM,
    })
  })

  it('surfaces normalized plugin reject codes', async () => {
    const plugin = {
      downloadRegion: vi.fn(async () => {
        const err = new Error('Device storage is full')
        err.code = 'disk_full'
        throw err
      }),
    }
    stubCapacitor({ native: true, platform: 'ios', plugins: { ChronoWalkOfflineMaps: plugin } })
    await expect(downloadRegion({ cityId: 'rome' })).resolves.toMatchObject({
      status: 'failed',
      errorCode: OFFLINE_MAP_ERROR.DISK_FULL,
      supported: true,
    })
  })
})

describe('browser bundle safety', () => {
  it('nativeOfflineMaps module has no Node or native imports', () => {
    const source = readFileSync(
      join(ROOT, 'src/platform/offlineMaps/nativeOfflineMaps.js'),
      'utf8',
    )
    expect(source).not.toMatch(/from ['"]node:/)
    expect(source).not.toMatch(/require\(['"]fs['"]\)/)
    expect(source).not.toMatch(/@capacitor\//)
    expect(source).not.toMatch(/@chronowalk\/offline-maps/)
    expect(source).not.toMatch(/mapbox-gl/)
  })

  it('DEV Offline Map Test panel is gated and not wired into production journey map', () => {
    const panel = readFileSync(
      join(ROOT, 'src/components/dev/OfflineMapTestPanel.jsx'),
      'utf8',
    )
    const router = readFileSync(join(ROOT, 'src/routes/LaunchRouter.jsx'), 'utf8')
    const tourMap = readFileSync(join(ROOT, 'src/components/TourMap.jsx'), 'utf8')

    expect(panel).toContain('shouldRenderOfflineMapTestPanel')
    expect(panel).toContain('openTestMap')
    expect(panel).not.toMatch(/from ['"].*TourMap/)
    expect(panel).not.toContain('RedesignMapPage')
    expect(panel).not.toContain('mapbox-gl')
    expect(router).toContain('OfflineMapTestPanel')
    expect(router).toMatch(/import\.meta\.env\.DEV \? <OfflineMapTestPanel/)
    expect(tourMap).not.toContain('openTestMap')
    expect(tourMap).not.toContain('OfflineMapTestPanel')
  })

  it('native openTestMap presenter exists and uses Mapbox MapView', () => {
    const presenter = readFileSync(
      join(
        ROOT,
        'plugins/chronowalk-offline-maps/ios/Sources/ChronoWalkOfflineMapsPlugin/ChronoWalkOfflineMapViewController.swift',
      ),
      'utf8',
    )
    const plugin = readFileSync(
      join(
        ROOT,
        'plugins/chronowalk-offline-maps/ios/Sources/ChronoWalkOfflineMapsPlugin/ChronoWalkOfflineMapsPlugin.swift',
      ),
      'utf8',
    )
    expect(presenter).toContain('MapView')
    expect(presenter).toContain('prepareMapboxMapsForOfflinePresentation')
    expect(plugin).toContain('openTestMap')
    expect(plugin).toContain('ChronoWalkOfflineMapViewController')
  })
})
