import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it, beforeEach } from 'vitest'
import { loadRomeManifest } from '../../content/manifest.js'
import { loadCityPackage } from '../../content/cityPackage/node.js'
import {
  clearCatalogCache,
  getPublishedCities,
  getProductsForCity,
  getRoutesForProduct,
  getRouteById,
  getStopsForRoute,
  getStopById,
  getRomeRuntimeManifest,
  getRomePreviewAudio,
  getRomePreviewStopId,
  getRomeOptionalStopIds,
  ROME_PACKAGE_PRODUCT_ID,
  resolveLegacyProgressStopRef,
} from '../index.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const runtimeManifestPath = join(__dirname, '../../content/rome/manifest.json')

beforeEach(() => {
  clearCatalogCache()
})

describe('runtime manifest parity', () => {
  it('keeps package SSOT identical to the runtime Rome manifest file', () => {
    const pkg = loadCityPackage('rome')
    const runtimeFile = JSON.parse(readFileSync(runtimeManifestPath, 'utf8'))
    const adapterManifest = getRomeRuntimeManifest()

    expect(adapterManifest).toEqual(pkg.manifest)
    expect(adapterManifest).toEqual(runtimeFile)
  })

  it('matches loadRomeManifest city / product / journey identity', () => {
    const live = loadRomeManifest()
    const adapter = getRomeRuntimeManifest()

    expect(adapter.city).toBe(live.city)
    expect(adapter.id).toBe(live.id)
    expect(adapter.name).toBe(live.name)
    expect(adapter.product).toEqual(live.product)
    expect(adapter.journey.sequences.a).toEqual(live.journey.sequences.a)
    expect(adapter.journey.sequences.b).toEqual(live.journey.sequences.b)
    expect(adapter.journey.optional_waypoints).toEqual(live.journey.optional_waypoints)
    expect(adapter.system.preview).toBe(live.system.preview)
  })
})

describe('route ordering parity', () => {
  it('preserves Path A and Path B stop order vs package routes and live sequences', () => {
    const live = loadRomeManifest()
    const main = getRouteById('rome-eternal-main')
    const pathB = getRouteById('rome-eternal-path-b')

    const liveStopsA = live.journey.sequences.a.filter((id) => live.waypointsById[id])
    const liveStopsB = live.journey.sequences.b.filter((id) => live.waypointsById[id])

    expect(main.stops.map((s) => s.stopId)).toEqual(liveStopsA)
    expect(pathB.stops.map((s) => s.stopId)).toEqual(liveStopsB)
    expect(main.sequence).toEqual(live.journey.sequences.a)
    expect(pathB.sequence).toEqual(live.journey.sequences.b)

    const ordered = getStopsForRoute('rome-eternal-main').map((s) => s.stopId)
    expect(ordered).toEqual(liveStopsA)
  })
})

describe('coordinate / media / audio parity', () => {
  it('matches stop coordinates and live waypoint geofences', () => {
    const live = loadRomeManifest()
    for (const stopId of Object.keys(live.waypointsById)) {
      const stop = getStopById(stopId, 'rome')
      expect(stop, stopId).toBeTruthy()
      expect(stop.geofence).toEqual(live.waypointsById[stopId].geofence)
      expect(stop.location).toEqual({
        lat: live.waypointsById[stopId].geofence.lat,
        lng: live.waypointsById[stopId].geofence.lng,
      })
    }
  })

  it('preserves audio and media references on the runtime manifest bridge', () => {
    const live = loadRomeManifest()
    const adapter = getRomeRuntimeManifest()
    expect(adapter.waypoints.w01.chapters).toEqual(live.waypointsById.w01.chapters)
    expect(adapter.waypoints.w17.photo).toBe(live.waypointsById.w17.photo)
    expect(adapter.waypoints.w17.reconstruction).toEqual(
      live.waypointsById.w17.reconstruction,
    )
    expect(adapter.system).toEqual(live.system)
    expect(adapter.beds).toEqual(live.beds)
  })
})

describe('preview parity', () => {
  it('exposes the free Pantheon preview audio and stop', () => {
    const live = loadRomeManifest()
    expect(getRomePreviewAudio()).toBe(live.system.preview)
    expect(getRomePreviewAudio()).toBe('w17_ch1.mp3')
    expect(getRomePreviewStopId()).toBe('w17')
    expect(getStopById('w17')?.name).toMatch(/Pantheon/i)
  })
})

describe('optional stop parity', () => {
  it('matches journey.optional_waypoints for path A and B', () => {
    const live = loadRomeManifest()
    expect(getRomeOptionalStopIds('a')).toEqual(live.journey.optional_waypoints?.a ?? [])
    expect(getRomeOptionalStopIds('a')).toEqual(['w04'])
    expect(getRomeOptionalStopIds('b')).toEqual(live.journey.optional_waypoints?.b ?? [])
  })

  it('marks w04 optionalOnPath in the stop registry', () => {
    expect(getStopById('w04')?.optionalOnPath).toBe('a')
  })
})

describe('adapter parity with catalog surface', () => {
  it('aligns published catalog entities with the Rome package', () => {
    const pkg = loadCityPackage('rome')
    expect(getPublishedCities()[0].cityId).toBe(pkg.cityId)
    expect(getProductsForCity('rome').map((p) => p.productId)).toEqual(
      pkg.products.map((p) => p.productId),
    )
    expect(getRoutesForProduct(ROME_PACKAGE_PRODUCT_ID).map((r) => r.routeId).sort()).toEqual(
      pkg.routes.map((r) => r.routeId).sort(),
    )
  })

  it('bridges progress stop refs without remapping Rome ids', () => {
    expect(resolveLegacyProgressStopRef('w17')).toBe('w17')
    expect(resolveLegacyProgressStopRef('pantheon')).toBe('w17')
    expect(resolveLegacyProgressStopRef('unknown')).toBeNull()
  })
})
