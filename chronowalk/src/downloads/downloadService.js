/**
 * Shared download service — selects web or native adapter via platform runtime.
 */

import { isNativePlatform } from '../platform/runtime/index.js'
import { getDownloadManifest } from './downloadManifest.js'
import { resolveDownloadProduct, downloadRegistryKey } from './downloadRegistry.js'
import { createWebDownloadAdapter } from './adapters/webDownloadAdapter.js'
import { createNativeDownloadAdapter } from './adapters/nativeDownloadAdapter.js'
import { createDownloadRecord, downloadRecordHasNoSecrets } from './downloadState.js'
import { estimateManifestBytes } from './storageEstimate.js'

/**
 * @typedef {ReturnType<typeof createWebDownloadAdapter> | ReturnType<typeof createNativeDownloadAdapter>} DownloadPlatformAdapter
 */

/**
 * @param {object} [options]
 * @param {DownloadPlatformAdapter} [options.adapter]
 * @param {'web' | 'native' | 'auto'} [options.platform]
 * @param {object} [options.webAdapterOptions]
 * @param {object} [options.nativeAdapterOptions]
 */
export function createDownloadService(options = {}) {
  const platform =
    options.platform === 'web' || options.platform === 'native'
      ? options.platform
      : isNativePlatform()
        ? 'native'
        : 'web'

  const adapter =
    options.adapter ??
    (platform === 'native'
      ? createNativeDownloadAdapter(options.nativeAdapterOptions)
      : createWebDownloadAdapter(options.webAdapterOptions))

  return {
    platform,
    adapterKind: adapter.kind,

    /**
     * @param {string} productId
     * @param {string} [locale]
     */
    getDownloadManifest(productId, locale = 'en') {
      return getDownloadManifest(productId, locale)
    },

    /**
     * @param {string} productId
     * @param {string} [locale]
     */
    async getDownloadStatus(productId, locale = 'en') {
      const resolved = resolveDownloadProduct(productId)
      if (!resolved) {
        return createDownloadRecord({
          productId: productId || 'unknown',
          cityId: 'unknown',
          locale,
          packageVersion: '0',
          status: 'not_downloaded',
          errorCode: 'unknown_product',
        })
      }
      const existing = await adapter.getStatus(resolved.productId, locale)
      if (existing) return existing
      return createDownloadRecord({
        productId: resolved.productId,
        cityId: resolved.cityId,
        locale,
        packageVersion: '0',
        status: 'not_downloaded',
      })
    },

    /**
     * @param {string} productId
     * @param {string} [locale]
     */
    async estimateDownload(productId, locale = 'en') {
      const resolved = resolveDownloadProduct(productId)
      if (!resolved) {
        return {
          ok: false,
          code: 'unknown_product',
          estimatedBytes: 0,
          fileCount: 0,
        }
      }
      const manifest = getDownloadManifest(resolved.productId, locale)
      const estimate = await adapter.estimate(manifest)
      return { ok: true, productId: resolved.productId, cityId: resolved.cityId, ...estimate }
    },

    /**
     * @param {string} productId
     * @param {{ locale?: string, onProgress?: Function }} [opts]
     */
    async downloadProduct(productId, opts = {}) {
      const resolved = resolveDownloadProduct(productId)
      if (!resolved) {
        return {
          ok: false,
          code: 'unknown_product',
          record: null,
        }
      }
      const manifest = getDownloadManifest(resolved.productId, opts.locale || 'en')
      const record = await adapter.download(manifest, { onProgress: opts.onProgress })
      return {
        ok: record?.status === 'ready',
        code: record?.errorCode ?? null,
        record,
        contentProductId: resolved.contentProductId,
        packageProductId: resolved.productId,
        isBundleAlias: resolved.isBundleAlias,
      }
    },

    async pauseDownload(productId, locale = 'en') {
      const resolved = resolveDownloadProduct(productId)
      if (!resolved) return { ok: false, code: 'unknown_product' }
      const record = await adapter.pause(resolved.productId, locale)
      return { ok: true, record }
    },

    async resumeDownload(productId, opts = {}) {
      const resolved = resolveDownloadProduct(productId)
      if (!resolved) return { ok: false, code: 'unknown_product' }
      const manifest = getDownloadManifest(resolved.productId, opts.locale || 'en')
      const record = await adapter.resume(manifest, { onProgress: opts.onProgress })
      return { ok: record?.status === 'ready' || record?.status === 'downloading' || record?.status === 'paused', record }
    },

    async removeDownload(productId, locale = 'en') {
      const resolved = resolveDownloadProduct(productId)
      if (!resolved) return { ok: false, code: 'unknown_product', entitlementUntouched: true }
      const result = await adapter.remove(resolved.productId, locale)
      return {
        ok: true,
        ...result,
        entitlementUntouched: true,
      }
    },

    async verifyDownload(productId, locale = 'en') {
      const resolved = resolveDownloadProduct(productId)
      if (!resolved) return { ok: false, code: 'unknown_product' }
      const manifest = getDownloadManifest(resolved.productId, locale)
      return adapter.verify(manifest)
    },

    async listDownloadedProducts() {
      return adapter.listDownloadedProducts()
    },

    async getStoredVersion(productId, locale = 'en') {
      const status = await this.getDownloadStatus(productId, locale)
      if (!status || status.status === 'not_downloaded') return null
      return status.packageVersion
    },

    async isUpdateAvailable(productId, locale = 'en') {
      const resolved = resolveDownloadProduct(productId)
      if (!resolved) return false
      const status = await adapter.getStatus(resolved.productId, locale)
      if (!status) return false
      if (status.status === 'update_available') return true
      if (status.status !== 'ready') return false
      const manifest = getDownloadManifest(resolved.productId, locale)
      if (status.packageVersion !== manifest.packageVersion) {
        await adapter.markUpdateAvailable?.(
          resolved.productId,
          locale,
          manifest.packageVersion,
        )
        return true
      }
      return false
    },

    /** Domain DownloadAdapter-compatible surface for PlatformServices. */
    asDomainAdapter() {
      return {
        async enqueue(manifest) {
          await adapter.download(manifest)
        },
        async getStatus(assetId) {
          const records = await adapter.listDownloadedProducts()
          for (const record of records) {
            if (record.fileStatuses?.[assetId] === 'complete') return 'ready'
            if (record.status === 'downloading') return 'downloading'
            if (record.status === 'failed') return 'failed'
            if (record.status === 'queued') return 'queued'
          }
          return 'pending'
        },
        async getLocalPath(assetId) {
          return assetId ? `local://${assetId}` : null
        },
      }
    },
  }
}

/** Singleton for app use; tests should prefer createDownloadService(). */
let defaultService = null

export function getDownloadService() {
  if (!defaultService) defaultService = createDownloadService()
  return defaultService
}

/** @internal */
export function __resetDownloadServiceForTests() {
  defaultService = null
}

export {
  getDownloadManifest,
  resolveDownloadProduct,
  downloadRegistryKey,
  estimateManifestBytes,
  downloadRecordHasNoSecrets,
}
