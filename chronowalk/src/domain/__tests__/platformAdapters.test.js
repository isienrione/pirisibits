import { describe, expect, it } from 'vitest'
import {
  DOWNLOAD_MANIFEST_SCHEMA_VERSION,
  isDownloadManifest,
  isDownloadAdapter,
} from '../downloads/index.js'
import {
  isPurchaseAdapter,
  isPurchaseResult,
  isEntitlement,
} from '../commerce/index.js'
import {
  PLATFORM_SERVICE_KEYS,
  isPlatformServices,
  isAudioAdapter,
  isLocationAdapter,
  isStorageAdapter,
  isDeepLinkAdapter,
  isLifecycleAdapter,
} from '../platform/index.js'
import { isRouteProgress, isStopProgress } from '../progress/index.js'

function createMemoryStorage() {
  const store = new Map()
  return {
    async getItem(key) {
      return store.has(key) ? store.get(key) : null
    },
    async setItem(key, value) {
      store.set(key, value)
    },
    async removeItem(key) {
      store.delete(key)
    },
  }
}

function createStubPlatformServices() {
  return {
    purchase: {
      async purchase(productId) {
        return {
          ok: true,
          source: 'paddle',
          entitlement: {
            productId,
            cityId: 'rome',
            source: 'paddle',
            active: true,
          },
        }
      },
      async listEntitlements() {
        return []
      },
      async restore() {
        return { ok: true, source: 'apple' }
      },
    },
    downloads: {
      async enqueue() {},
      async getStatus() {
        return 'pending'
      },
      async getLocalPath() {
        return null
      },
    },
    audio: {
      async load() {},
      async play() {},
      async pause() {},
    },
    location: {
      async requestPermission() {
        return false
      },
      async getCurrentPosition() {
        return null
      },
    },
    storage: createMemoryStorage(),
    deepLink: {
      getInitialUrl() {
        return null
      },
      subscribe() {
        return () => {}
      },
    },
    lifecycle: {
      onForeground() {
        return () => {}
      },
      onBackground() {
        return () => {}
      },
    },
  }
}

describe('platform adapters share a common interface shape', () => {
  it('accepts a PlatformServices bundle that satisfies all adapters', () => {
    const services = createStubPlatformServices()

    expect(PLATFORM_SERVICE_KEYS).toEqual([
      'purchase',
      'downloads',
      'audio',
      'location',
      'storage',
      'deepLink',
      'lifecycle',
    ])

    expect(isPurchaseAdapter(services.purchase)).toBe(true)
    expect(isDownloadAdapter(services.downloads)).toBe(true)
    expect(isAudioAdapter(services.audio)).toBe(true)
    expect(isLocationAdapter(services.location)).toBe(true)
    expect(isStorageAdapter(services.storage)).toBe(true)
    expect(isDeepLinkAdapter(services.deepLink)).toBe(true)
    expect(isLifecycleAdapter(services.lifecycle)).toBe(true)
    expect(isPlatformServices(services)).toBe(true)
  })

  it('normalizes purchases into entitlements regardless of channel label', async () => {
    const services = createStubPlatformServices()
    const paddle = await services.purchase.purchase('rome-eternal')
    expect(isPurchaseResult(paddle)).toBe(true)
    expect(isEntitlement(paddle.entitlement)).toBe(true)
    expect(paddle.entitlement.source).toBe('paddle')

    const appleRestore = await services.purchase.restore()
    expect(appleRestore.ok).toBe(true)
    expect(appleRestore.source).toBe('apple')
  })

  it('versions download manifests independently of city identity', () => {
    const manifest = {
      schemaVersion: DOWNLOAD_MANIFEST_SCHEMA_VERSION,
      cityId: 'florence',
      packageVersion: '1.0.0',
      files: [
        {
          assetId: 'piazza-della-signoria.audio.main',
          url: 'https://cdn.example/florence/signoria.m4a',
          status: 'pending',
        },
      ],
    }

    expect(DOWNLOAD_MANIFEST_SCHEMA_VERSION).toBe(1)
    expect(isDownloadManifest(manifest)).toBe(true)
  })

  it('tracks progress by stopId, not route index', () => {
    const stopProgress = {
      stopId: 'pantheon-exterior',
      visited: true,
      completed: false,
    }
    const routeProgress = {
      routeId: 'rome-eternal-main',
      cityId: 'rome',
      currentStopId: 'pantheon-exterior',
      stops: [stopProgress],
    }

    expect(isStopProgress(stopProgress)).toBe(true)
    expect(isRouteProgress(routeProgress)).toBe(true)
    expect(routeProgress).not.toHaveProperty('waypointIndex')
  })
})
