import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  buildTransitMapPayload,
  closeTransitMap,
  normalizeFrame,
  normalizeLatLng,
  normalizeRouteGeoJSON,
  openTransitMap,
  shouldUseNativeTransitMap,
  updateTransitMap,
} from '../nativeTransitMap.js'
import { OFFLINE_MAP_ERROR } from '../offlineMapStatus.js'

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

describe('shouldUseNativeTransitMap', () => {
  it('selects native map path on iOS', () => {
    stubCapacitor({ native: true, platform: 'ios' })
    expect(shouldUseNativeTransitMap()).toBe(true)
  })

  it('keeps web on the existing web map path', () => {
    stubCapacitor({ native: false, platform: 'web' })
    expect(shouldUseNativeTransitMap()).toBe(false)
  })
})

describe('transit map data contract', () => {
  const route = {
    type: 'LineString',
    coordinates: [
      [12.49, 41.89],
      [12.492, 41.891],
      [12.495, 41.898],
    ],
  }

  it('passes route geometry unchanged', () => {
    const normalized = normalizeRouteGeoJSON(route)
    expect(normalized).toEqual(route)
    const payload = buildTransitMapPayload({
      cityId: 'rome',
      routeGeoJSON: route,
      frame: { x: 0, y: 0, width: 100, height: 200 },
    })
    expect(payload.routeGeoJSON).toEqual(route)
  })

  it('passes destination coordinates correctly', () => {
    const payload = buildTransitMapPayload({
      destination: { lat: 41.8986, lng: 12.4768 },
      origin: { lat: 41.8902, lng: 12.4922 },
      frame: { x: 10, y: 20, width: 300, height: 400 },
    })
    expect(payload.destination).toEqual({ lat: 41.8986, lng: 12.4768 })
    expect(payload.origin).toEqual({ lat: 41.8902, lng: 12.4922 })
  })

  it('allows missing GPS without inventing a position', () => {
    const payload = buildTransitMapPayload({
      routeGeoJSON: route,
      destination: { lat: 41.9, lng: 12.48 },
      currentPosition: null,
      frame: { x: 0, y: 0, width: 50, height: 50 },
    })
    expect(payload.currentPosition).toBeNull()
    expect(payload.showUserLocation).toBe(false)
    expect(payload.routeGeoJSON).toEqual(route)
  })

  it('still includes route when GPS is denied / absent', () => {
    const payload = buildTransitMapPayload({
      routeGeoJSON: route,
      destination: { lat: 41.9, lng: 12.48 },
      origin: { lat: 41.89, lng: 12.49 },
      currentPosition: undefined,
      frame: { x: 0, y: 0, width: 50, height: 50 },
    })
    expect(payload.routeGeoJSON.coordinates.length).toBe(3)
    expect(payload.currentPosition).toBeNull()
  })

  it('normalizes frames and rejects invalid lat/lng', () => {
    expect(normalizeFrame({ x: 1, y: 2, width: 3, height: 4 })).toEqual({
      x: 1,
      y: 2,
      width: 3,
      height: 4,
    })
    expect(normalizeLatLng({ lat: 99, lng: 12 })).toBeNull()
    expect(normalizeRouteGeoJSON({ type: 'Point', coordinates: [1, 2] })).toBeNull()
  })
})

describe('openTransitMap bridge', () => {
  it('returns unsupported on web without calling plugins', async () => {
    const plugin = { openTransitMap: vi.fn() }
    stubCapacitor({
      native: false,
      platform: 'web',
      plugins: { ChronoWalkOfflineMaps: plugin },
    })
    await expect(
      openTransitMap({
        cityId: 'rome',
        routeGeoJSON: { type: 'LineString', coordinates: [[12.49, 41.89]] },
        frame: { x: 0, y: 0, width: 10, height: 10 },
      }),
    ).resolves.toMatchObject({
      opened: false,
      errorCode: OFFLINE_MAP_ERROR.UNSUPPORTED_PLATFORM,
    })
    expect(plugin.openTransitMap).not.toHaveBeenCalled()
  })

  it('invokes native openTransitMap with unchanged geometry on iOS', async () => {
    const route = {
      type: 'LineString',
      coordinates: [
        [12.4922, 41.8902],
        [12.4768, 41.8986],
      ],
    }
    const plugin = {
      openTransitMap: vi.fn(async (args) => ({
        opened: true,
        supported: true,
        renderer: 'mapbox-maps-ios',
        ...args,
      })),
      updateTransitMap: vi.fn(async () => ({ updated: true })),
      closeTransitMap: vi.fn(async () => ({ closed: true })),
    }
    stubCapacitor({
      native: true,
      platform: 'ios',
      plugins: { ChronoWalkOfflineMaps: plugin },
    })

    const result = await openTransitMap({
      cityId: 'rome',
      routeGeoJSON: route,
      origin: { lat: 41.8902, lng: 12.4922 },
      destination: { lat: 41.8986, lng: 12.4768 },
      currentPosition: null,
      destinationStopId: 'pantheon',
      frame: { x: 12, y: 80, width: 360, height: 280 },
    })

    expect(plugin.openTransitMap).toHaveBeenCalledWith(
      expect.objectContaining({
        cityId: 'rome',
        routeGeoJSON: route,
        destination: { lat: 41.8986, lng: 12.4768 },
        currentPosition: null,
        destinationStopId: 'pantheon',
        frame: { x: 12, y: 80, width: 360, height: 280 },
      }),
    )
    expect(result).toMatchObject({
      opened: true,
      supported: true,
      renderer: 'mapbox-maps-ios',
      routeGeoJSON: route,
    })

    await updateTransitMap({
      cityId: 'rome',
      routeGeoJSON: route,
      destination: { lat: 41.8986, lng: 12.4768 },
      frame: { x: 12, y: 80, width: 360, height: 280 },
    })
    expect(plugin.updateTransitMap).toHaveBeenCalled()
    await closeTransitMap()
    expect(plugin.closeTransitMap).toHaveBeenCalled()
  })

  it('surfaces native failure without inventing map success', async () => {
    const plugin = {
      openTransitMap: vi.fn(async () => {
        const err = new Error('Mapbox public access token missing')
        err.code = 'mapbox_not_configured'
        throw err
      }),
    }
    stubCapacitor({
      native: true,
      platform: 'ios',
      plugins: { ChronoWalkOfflineMaps: plugin },
    })
    await expect(
      openTransitMap({
        cityId: 'rome',
        frame: { x: 0, y: 0, width: 10, height: 10 },
      }),
    ).resolves.toMatchObject({
      opened: false,
      errorCode: OFFLINE_MAP_ERROR.MAPBOX_NOT_CONFIGURED,
      supported: true,
    })
  })

  it('rejects missing frame as invalid_frame instead of download_failed', async () => {
    const plugin = { openTransitMap: vi.fn() }
    stubCapacitor({
      native: true,
      platform: 'ios',
      plugins: { ChronoWalkOfflineMaps: plugin },
    })
    await expect(
      openTransitMap({
        cityId: 'rome',
        routeGeoJSON: { type: 'LineString', coordinates: [[12.49, 41.89]] },
      }),
    ).resolves.toMatchObject({
      opened: false,
      supported: true,
      errorCode: OFFLINE_MAP_ERROR.INVALID_FRAME,
      errorMessage: 'frame is required',
    })
    expect(plugin.openTransitMap).not.toHaveBeenCalled()
  })
})

describe('native transit map path safety', () => {
  it('nativeTransitMap module never imports Mapbox GL JS', async () => {
    const { readFileSync } = await import('node:fs')
    const { dirname, join } = await import('node:path')
    const { fileURLToPath } = await import('node:url')
    const root = join(dirname(fileURLToPath(import.meta.url)), '..')
    const source = readFileSync(join(root, 'nativeTransitMap.js'), 'utf8')
    expect(source).not.toMatch(/mapbox-gl/)
    expect(source).not.toMatch(/TourMap/)
    expect(source).not.toMatch(/OfflineRouteMap/)
  })
})
