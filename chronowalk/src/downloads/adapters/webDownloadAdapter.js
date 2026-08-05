/**
 * Web download adapter — Cache Storage compatibility layer.
 *
 * Does NOT replace src/audio/offlinePackage.js. Production Rome UI continues
 * to use that path. This adapter implements the shared download API for the
 * browser using Cache Storage so the service can select web vs native cleanly.
 */

import { createLocalStorageRecordStore, persistTransition } from '../recordStore.js'
import { createDownloadRecord } from '../downloadState.js'
import { downloadRegistryKey } from '../downloadRegistry.js'
import { assessStorageCapacity } from '../storageEstimate.js'
import { verifyChecksum, integrityCapability } from '../checksum.js'

export const WEB_DOWNLOAD_CACHE = 'chronowalk-downloads-v1'

/**
 * @param {object} [options]
 * @param {ReturnType<typeof createLocalStorageRecordStore>} [options.store]
 * @param {typeof fetch} [options.fetchImpl]
 * @param {() => Promise<Cache>} [options.openCache]
 * @param {() => Promise<number | null>} [options.getFreeBytes]
 */
export function createWebDownloadAdapter(options = {}) {
  const store = options.store ?? createLocalStorageRecordStore()
  const fetchImpl = options.fetchImpl ?? globalThis.fetch?.bind(globalThis)
  const openCache =
    options.openCache ??
    (async () => {
      if (typeof caches === 'undefined') {
        throw new Error('Cache Storage unavailable')
      }
      return caches.open(WEB_DOWNLOAD_CACHE)
    })
  const getFreeBytes = options.getFreeBytes ?? (async () => null)

  /** @type {Map<string, AbortController>} */
  const controllers = new Map()

  return {
    kind: /** @type {const} */ ('web'),

    async getStatus(productId, locale = 'en') {
      const key = downloadRegistryKey({ productId, locale })
      return store.get(key)
    },

    async listDownloadedProducts() {
      return store.list().filter((r) => r.status === 'ready' || r.status === 'update_available')
    },

    async estimate(manifest) {
      const freeBytes = await getFreeBytes()
      return {
        estimatedBytes: manifest.estimatedBytes,
        fileCount: manifest.files.filter((f) => f.integrity !== 'skipped').length,
        storage: assessStorageCapacity(manifest.estimatedBytes, freeBytes),
      }
    },

    /**
     * @param {import('../downloadManifest.js').ProductDownloadManifest} manifest
     * @param {{ onProgress?: (p: { bytesDownloaded: number, totalBytes: number, fileId?: string }) => void }} [opts]
     */
    async download(manifest, opts = {}) {
      const key = downloadRegistryKey(manifest)
      let record =
        store.get(key) ??
        createDownloadRecord({
          productId: manifest.productId,
          cityId: manifest.cityId,
          locale: manifest.locale,
          packageVersion: manifest.packageVersion,
          totalBytes: manifest.estimatedBytes,
          status: 'not_downloaded',
        })

      if (record.status === 'not_downloaded' || record.status === 'failed') {
        record = persistTransition(record, record.status === 'failed' ? 'queued' : 'queued', store, {
          totalBytes: manifest.estimatedBytes,
          packageVersion: manifest.packageVersion,
          errorCode: null,
        })
      }
      if (record.status === 'queued' || record.status === 'paused' || record.status === 'update_available') {
        const from = record.status === 'update_available' ? 'update_available' : record.status
        record = persistTransition(
          { ...record, status: from },
          'downloading',
          store,
          { totalBytes: manifest.estimatedBytes, packageVersion: manifest.packageVersion },
        )
      } else if (record.status !== 'downloading') {
        record = persistTransition(record, 'downloading', store, {
          totalBytes: manifest.estimatedBytes,
        })
      }

      const controller = new AbortController()
      controllers.set(key, controller)

      const cache = await openCache()
      let bytesDownloaded = record.bytesDownloaded || 0
      const fileStatuses = { ...(record.fileStatuses || {}) }

      try {
        for (const file of manifest.files) {
          if (controller.signal.aborted) {
            record = persistTransition(store.get(key) ?? record, 'paused', store, {
              bytesDownloaded,
              fileStatuses,
            })
            return store.get(key)
          }

          if (file.integrity === 'skipped' || file.inline) {
            fileStatuses[file.assetId] = 'complete'
            continue
          }

          if (fileStatuses[file.assetId] === 'complete') {
            continue
          }

          if (!file.url) {
            if (file.type === 'route_metadata') {
              const body = JSON.stringify({
                productId: manifest.productId,
                cityId: manifest.cityId,
                packageVersion: manifest.packageVersion,
              })
              await cache.put(
                cacheKey(manifest, file),
                new Response(body, { headers: { 'Content-Type': 'application/json' } }),
              )
              fileStatuses[file.assetId] = 'complete'
              bytesDownloaded += file.bytes || body.length
              opts.onProgress?.({ bytesDownloaded, totalBytes: manifest.estimatedBytes, fileId: file.assetId })
              continue
            }
            throw Object.assign(new Error(`Missing URL for ${file.assetId}`), {
              code: 'missing_source',
            })
          }

          if (!fetchImpl) {
            throw Object.assign(new Error('fetch unavailable'), { code: 'network_error' })
          }

          const response = await fetchImpl(file.url, { signal: controller.signal })
          if (!response.ok) {
            throw Object.assign(new Error(`HTTP ${response.status} for ${file.assetId}`), {
              code: 'network_error',
            })
          }
          const buffer = await response.arrayBuffer()

          if (file.checksum) {
            const check = await verifyChecksum(buffer, file.checksum)
            if (!check.ok) {
              throw Object.assign(new Error(`Checksum failed for ${file.assetId}`), {
                code: 'checksum_mismatch',
              })
            }
          } else if (integrityCapability(file) === 'unverified') {
            // Explicitly allow unverified assets — do not invent checksums.
          }

          await cache.put(cacheKey(manifest, file), new Response(buffer.slice(0)))
          fileStatuses[file.assetId] = 'complete'
          bytesDownloaded += buffer.byteLength
          opts.onProgress?.({ bytesDownloaded, totalBytes: manifest.estimatedBytes, fileId: file.assetId })
          store.set(key, createDownloadRecord({
            ...(store.get(key) ?? record),
            bytesDownloaded,
            fileStatuses,
            status: 'downloading',
          }))
        }

        record = persistTransition(store.get(key) ?? record, 'verifying', store, {
          bytesDownloaded,
          fileStatuses,
        })
        record = persistTransition(record, 'ready', store, {
          bytesDownloaded,
          fileStatuses,
          errorCode: null,
        })
        return record
      } catch (err) {
        if (controller.signal.aborted) {
          return persistTransition(store.get(key) ?? record, 'paused', store, {
            bytesDownloaded,
            fileStatuses,
          })
        }
        return persistTransition(store.get(key) ?? record, 'failed', store, {
          bytesDownloaded,
          fileStatuses,
          errorCode: err?.code || 'download_failed',
        })
      } finally {
        controllers.delete(key)
      }
    },

    async pause(productId, locale = 'en') {
      const key = downloadRegistryKey({ productId, locale })
      controllers.get(key)?.abort()
      const record = store.get(key)
      if (!record) return null
      if (record.status === 'downloading' || record.status === 'queued') {
        return persistTransition(record, 'paused', store)
      }
      return record
    },

    async resume(manifest, opts) {
      const key = downloadRegistryKey(manifest)
      const record = store.get(key)
      if (!record) return this.download(manifest, opts)
      if (record.status === 'paused' || record.status === 'failed' || record.status === 'queued') {
        return this.download(manifest, opts)
      }
      return record
    },

    async remove(productId, locale = 'en') {
      const key = downloadRegistryKey({ productId, locale })
      const record = store.get(key)
      if (!record) return { removed: false, entitlementUntouched: true }
      let current = persistTransition(record, 'removing', store)
      try {
        const cache = await openCache()
        const keys = await cache.keys()
        const prefix = `${productId}::${locale}::`
        await Promise.all(
          keys
            .filter((req) => req.url.includes(prefix) || String(req.url).includes(`/${productId}/`))
            .map((req) => cache.delete(req)),
        )
      } catch {
        /* cache may be unavailable in tests */
      }
      store.delete(key)
      return { removed: true, entitlementUntouched: true, previous: current }
    },

    async verify(manifest) {
      const key = downloadRegistryKey(manifest)
      const record = store.get(key)
      if (!record || (record.status !== 'ready' && record.status !== 'update_available')) {
        return { ok: false, code: 'not_ready' }
      }
      const cache = await openCache()
      for (const file of manifest.files) {
        if (file.integrity === 'skipped' || file.inline) continue
        const hit = await cache.match(cacheKey(manifest, file))
        if (!hit) return { ok: false, code: 'missing_file', fileId: file.assetId }
        if (file.checksum) {
          const buf = await hit.arrayBuffer()
          const check = await verifyChecksum(buf, file.checksum)
          if (!check.ok) return { ok: false, code: 'checksum_mismatch', fileId: file.assetId }
        }
      }
      return { ok: true }
    },

    async markUpdateAvailable(productId, locale, nextVersion) {
      const key = downloadRegistryKey({ productId, locale })
      const record = store.get(key)
      if (!record || record.status !== 'ready') return record
      if (record.packageVersion === nextVersion) return record
      return persistTransition(record, 'update_available', store, {
        // Keep stored version until re-download completes; note the newer target separately.
        errorCode: null,
      })
    },
  }
}

/**
 * @param {{ productId: string, locale: string, packageVersion: string }} manifest
 * @param {{ assetId: string, path: string }} file
 */
function cacheKey(manifest, file) {
  return `download://${manifest.productId}::${manifest.locale}::${manifest.packageVersion}/${file.path}`
}
