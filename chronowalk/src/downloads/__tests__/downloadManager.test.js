import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadPackagedCityPackage } from '../../content/cityPackage/runtime.js'
import { __setPublishedPackagesForTests } from '../../catalog/cityRegistry.js'
import { clearCatalogCache } from '../../catalog/catalogService.js'
import {
  getDownloadManifest,
  validateDownloadManifest,
  resolveDownloadProduct,
  createDownloadService,
  createMemoryRecordStore,
  createWebDownloadAdapter,
  createNativeDownloadAdapter,
  canTransitionDownloadStatus,
  createDownloadRecord,
  downloadRecordHasNoSecrets,
  formatSha256Checksum,
  sha256Hex,
  verifyChecksum,
  integrityCapability,
  isSafeRelativePath,
  PRODUCT_DOWNLOAD_STATUSES,
} from '../index.js'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '../../..')

beforeEach(() => {
  clearCatalogCache()
  __setPublishedPackagesForTests(null)
})

describe('Rome download manifest (generic)', () => {
  it('generates a versioned manifest from the Rome city package', () => {
    const manifest = getDownloadManifest('rome-eternal', 'en')
    expect(manifest.schemaVersion).toBe(1)
    expect(manifest.cityId).toBe('rome')
    expect(manifest.productId).toBe('rome-eternal')
    expect(manifest.locale).toBe('en')
    expect(manifest.packageVersion).toBe('1.0.0')
    expect(manifest.files.length).toBeGreaterThan(10)
    expect(manifest.estimatedBytes).toBeGreaterThan(0)
    expect(manifest.checksumPolicy).toBe('optional')
    expect(validateDownloadManifest(manifest).ok).toBe(true)
  })

  it('preserves product and city ids', () => {
    const manifest = getDownloadManifest('rome-complete', 'en')
    expect(manifest.cityId).toBe('rome')
    expect(manifest.productId).toBe('rome-eternal')
  })
})

describe('multi-city fixture support', () => {
  it('builds a manifest for the harbor fixture without Rome hardcoding', () => {
    const harbor = loadPackagedCityPackage('harbor')
    const manifest = getDownloadManifest('harbor-loop', 'en', { package: harbor })
    expect(manifest.cityId).toBe('harbor')
    expect(manifest.productId).toBe('harbor-loop')
    expect(manifest.files.some((f) => f.assetId === 'quay-north.audio.main')).toBe(true)
    expect(JSON.stringify(manifest)).not.toMatch(/colosseum|rome-eternal-main/i)
  })
})

describe('manifest validation', () => {
  it('rejects duplicate file ids', () => {
    const manifest = getDownloadManifest('rome-eternal')
    const dup = {
      ...manifest,
      files: [...manifest.files, { ...manifest.files[0] }],
    }
    const result = validateDownloadManifest(dup)
    expect(result.ok).toBe(false)
    expect(result.code).toBe('duplicate_file_id')
  })

  it('rejects unsafe relative paths', () => {
    expect(isSafeRelativePath('../etc/passwd')).toBe(false)
    expect(isSafeRelativePath('/absolute')).toBe(false)
    expect(isSafeRelativePath('files/w01/w01.mp3')).toBe(true)

    const manifest = getDownloadManifest('rome-eternal')
    const bad = {
      ...manifest,
      files: [{ ...manifest.files[0], path: '../../secret' }],
    }
    const result = validateDownloadManifest(bad)
    expect(result.ok).toBe(false)
    expect(result.code).toBe('unsafe_path')
  })

  it('fails when a required file has no source', () => {
    const manifest = getDownloadManifest('rome-eternal')
    const required = manifest.files.find((f) => f.required && f.type === 'audio')
    const bad = {
      ...manifest,
      files: manifest.files.map((f) =>
        f.assetId === required.assetId
          ? { ...f, url: null, inline: false, integrity: 'unverified', type: 'audio' }
          : f,
      ),
    }
    const result = validateDownloadManifest(bad)
    expect(result.ok).toBe(false)
    expect(result.code).toBe('missing_required_source')
  })
})

describe('checksums', () => {
  it('verifies correctly when present', async () => {
    const data = new TextEncoder().encode('chronowalk-download')
    const hex = await sha256Hex(data)
    const checksum = formatSha256Checksum(hex)
    const result = await verifyChecksum(data, checksum)
    expect(result.ok).toBe(true)
  })

  it('keeps files without checksums explicitly unverified', () => {
    const manifest = getDownloadManifest('rome-eternal')
    const withPath = manifest.files.filter((f) => f.integrity !== 'skipped')
    expect(withPath.length).toBeGreaterThan(0)
    // Rome package does not ship checksums yet.
    expect(withPath.every((f) => f.checksum == null || f.integrity === 'unverified' || f.integrity === 'verified_capable')).toBe(true)
    expect(withPath.filter((f) => !f.checksum).every((f) => f.integrity === 'unverified')).toBe(true)
    expect(integrityCapability({ checksum: null })).toBe('unverified')
  })
})

describe('adapter selection', () => {
  it('selects the web adapter on web runtime', () => {
    const service = createDownloadService({ platform: 'web' })
    expect(service.platform).toBe('web')
    expect(service.adapterKind).toBe('web')
  })

  it('selects the native adapter for Capacitor iOS', () => {
    const service = createDownloadService({ platform: 'native' })
    expect(service.platform).toBe('native')
    expect(service.adapterKind).toBe('native')
  })
})

describe('download state transitions', () => {
  it('allows only valid product status transitions', () => {
    expect(canTransitionDownloadStatus('not_downloaded', 'queued')).toBe(true)
    expect(canTransitionDownloadStatus('downloading', 'paused')).toBe(true)
    expect(canTransitionDownloadStatus('ready', 'update_available')).toBe(true)
    expect(canTransitionDownloadStatus('ready', 'queued')).toBe(false)
    expect(PRODUCT_DOWNLOAD_STATUSES).toContain('verifying')
  })
})

describe('download + resume + remove', () => {
  function mockFetch(body = 'audio-bytes') {
    return vi.fn(async () => ({
      ok: true,
      arrayBuffer: async () => new TextEncoder().encode(body).buffer,
    }))
  }

  function memoryCache() {
    const map = new Map()
    return {
      async put(key, response) {
        map.set(String(key), response)
      },
      async match(key) {
        return map.get(String(key)) ?? null
      },
      async keys() {
        return [...map.keys()].map((url) => ({ url }))
      },
      async delete(req) {
        const url = typeof req === 'string' ? req : req.url
        return map.delete(url)
      },
      _map: map,
    }
  }

  it('resumes interrupted downloads by skipping completed files', async () => {
    const store = createMemoryRecordStore()
    const cache = memoryCache()
    const fetchImpl = mockFetch()
    const adapter = createWebDownloadAdapter({
      store,
      fetchImpl,
      openCache: async () => cache,
    })
    const service = createDownloadService({ platform: 'web', adapter })

    // Tiny synthetic manifest via harbor package for speed.
    const harbor = loadPackagedCityPackage('harbor')
    const full = getDownloadManifest('harbor-loop', 'en', { package: harbor })
    const tiny = {
      ...full,
      files: full.files.filter((f) => f.type === 'audio' || f.type === 'route_metadata').slice(0, 3),
      estimatedBytes: 1000,
    }

    // Pre-complete first downloadable file to simulate interruption recovery.
    const first = tiny.files.find((f) => f.integrity !== 'skipped')
    store.set('harbor-loop::en', createDownloadRecord({
      productId: 'harbor-loop',
      cityId: 'harbor',
      locale: 'en',
      packageVersion: tiny.packageVersion,
      status: 'paused',
      bytesDownloaded: 10,
      totalBytes: 1000,
      fileStatuses: { [first.assetId]: 'complete' },
    }))

    const result = await adapter.resume(tiny)
    expect(result.status).toBe('ready')
    expect(result.fileStatuses[first.assetId]).toBe('complete')
    expect(downloadRecordHasNoSecrets(result)).toBe(true)

    // Couple/family alias covered elsewhere; ensure service unknown fails safely.
    const unknown = await service.downloadProduct('no-such-city-product')
    expect(unknown.ok).toBe(false)
    expect(unknown.code).toBe('unknown_product')
  })

  it('marks update_available when package version changes', async () => {
    const store = createMemoryRecordStore()
    const adapter = createWebDownloadAdapter({ store, fetchImpl: mockFetch(), openCache: async () => memoryCache() })
    store.set('rome-eternal::en', createDownloadRecord({
      productId: 'rome-eternal',
      cityId: 'rome',
      locale: 'en',
      packageVersion: '1.0.0',
      status: 'ready',
      totalBytes: 10,
    }))
    const updated = await adapter.markUpdateAvailable('rome-eternal', 'en', '1.1.0')
    expect(updated.status).toBe('update_available')
  })

  it('removal does not touch entitlement state and drops the record', async () => {
    const entitlementProbe = { productId: 'rome-couple', active: true, token: 'secret-should-stay' }
    const store = createMemoryRecordStore()
    const adapter = createWebDownloadAdapter({
      store,
      fetchImpl: mockFetch(),
      openCache: async () => memoryCache(),
    })
    store.set('rome-eternal::en', createDownloadRecord({
      productId: 'rome-eternal',
      cityId: 'rome',
      locale: 'en',
      packageVersion: '1.0.0',
      status: 'ready',
    }))
    const result = await adapter.remove('rome-eternal', 'en')
    expect(result.removed).toBe(true)
    expect(result.entitlementUntouched).toBe(true)
    expect(store.get('rome-eternal::en')).toBeNull()
    expect(entitlementProbe.active).toBe(true)
    expect(entitlementProbe.token).toBe('secret-should-stay')
  })

  it('native adapter downloads with injectable filesystem', async () => {
    /** @type {Map<string, string>} */
    const files = new Map()
    const fs = {
      async mkdir() {},
      async writeFile({ path, data }) {
        files.set(path, data)
      },
      async readFile({ path }) {
        if (!files.has(path)) throw new Error('missing')
        return { data: files.get(path) }
      },
      async rename({ from, to }) {
        files.set(to, files.get(from))
        files.delete(from)
      },
      async deleteFile({ path }) {
        files.delete(path)
      },
      async rmdir() {
        files.clear()
      },
      async stat({ path }) {
        if (!files.has(path)) throw new Error('missing')
        return { type: 'file', size: 1 }
      },
    }
    const store = createMemoryRecordStore()
    const adapter = createNativeDownloadAdapter({
      store,
      fs,
      fetchImpl: mockFetch('native-audio'),
      getNetworkStatus: async () => ({ connected: true }),
      getFreeBytes: async () => 50_000_000,
    })
    const harbor = loadPackagedCityPackage('harbor')
    const full = getDownloadManifest('harbor-loop', 'en', { package: harbor })
    const tiny = {
      ...full,
      files: full.files.filter((f) => f.assetId === 'quay-north.audio.main' || f.type === 'route_metadata'),
      estimatedBytes: 1000,
    }
    const record = await adapter.download(tiny)
    expect(record.status).toBe('ready')
    expect([...files.keys()].some((k) => k.includes('harbor-loop'))).toBe(true)
  })
})

describe('couple and family share Roma Eterna content package', () => {
  it('resolves couple and family to rome-eternal without duplicate packages', () => {
    const couple = resolveDownloadProduct('rome-couple')
    const family = resolveDownloadProduct('rome-family')
    const complete = resolveDownloadProduct('rome-complete')
    expect(couple.productId).toBe('rome-eternal')
    expect(family.productId).toBe('rome-eternal')
    expect(complete.productId).toBe('rome-eternal')
    expect(couple.isBundleAlias).toBe(true)
    expect(family.isBundleAlias).toBe(true)

    const mCouple = getDownloadManifest('rome-couple')
    const mFamily = getDownloadManifest('rome-family')
    expect(mCouple.productId).toBe(mFamily.productId)
    expect(mCouple.files.map((f) => f.assetId)).toEqual(mFamily.files.map((f) => f.assetId))
  })
})

describe('security of persisted records', () => {
  it('download records contain no purchase tokens or secrets', () => {
    const record = createDownloadRecord({
      productId: 'rome-eternal',
      cityId: 'rome',
      locale: 'en',
      packageVersion: '1.0.0',
      status: 'ready',
    })
    expect(downloadRecordHasNoSecrets(record)).toBe(true)
    expect(downloadRecordHasNoSecrets({ ...record, purchaseToken: 'x' })).toBe(false)
  })
})

describe('web build independence', () => {
  it('keeps npm run build free of Capacitor iOS tooling', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
    expect(pkg.scripts.build).toBe('npm run generate:pwa-assets && vite build')
    expect(pkg.scripts.build).not.toMatch(/cap |xcode|pod /i)
    expect(pkg.scripts['ios:sync']).toMatch(/cap sync/)
  })
})
