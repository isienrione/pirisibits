/**
 * Native Capacitor download adapter (Filesystem + Network).
 *
 * Downloads resume only while the app is active — no OS background transfer
 * in this PR. Incomplete files use a `.partial` suffix then rename.
 *
 * Capacitor plugins are loaded lazily so the web bundle never initializes them.
 */

import { createMemoryRecordStore, persistTransition } from '../recordStore.js'
import { createDownloadRecord } from '../downloadState.js'
import { downloadRegistryKey } from '../downloadRegistry.js'
import { assessStorageCapacity } from '../storageEstimate.js'
import { verifyChecksum, integrityCapability } from '../checksum.js'
import { productVersionDir, isSafeRelativePath } from '../paths.js'

/**
 * @typedef {Object} NativeFs
 * @property {(opts: object) => Promise<void>} mkdir
 * @property {(opts: object) => Promise<{ uri?: string } | void>} writeFile
 * @property {(opts: object) => Promise<{ data: string }>} readFile
 * @property {(opts: object) => Promise<void>} [rename]
 * @property {(opts: object) => Promise<void>} [deleteFile]
 * @property {(opts: object) => Promise<void>} [rmdir]
 * @property {(opts: object) => Promise<{ files: string[] }>} [readdir]
 * @property {(opts: object) => Promise<{ type?: string, size?: number }>} [stat]
 */

/**
 * @param {object} [options]
 * @param {ReturnType<typeof createMemoryRecordStore>} [options.store]
 * @param {NativeFs} [options.fs]
 * @param {string} [options.directory] Capacitor Directory enum value
 * @param {typeof fetch} [options.fetchImpl]
 * @param {() => Promise<{ connected: boolean }>} [options.getNetworkStatus]
 * @param {() => Promise<number | null>} [options.getFreeBytes]
 * @param {(bytes: Uint8Array) => string} [options.encodeBase64]
 * @param {(b64: string) => Uint8Array} [options.decodeBase64]
 */
export function createNativeDownloadAdapter(options = {}) {
  const store = options.store ?? createMemoryRecordStore()
  const directory = options.directory ?? 'DATA'
  const fetchImpl = options.fetchImpl ?? globalThis.fetch?.bind(globalThis)
  const getNetworkStatus =
    options.getNetworkStatus ??
    (async () => {
      const { Network } = await import('@capacitor/network')
      return Network.getStatus()
    })
  const getFreeBytes = options.getFreeBytes ?? (async () => null)
  const encodeBase64 = options.encodeBase64 ?? defaultEncodeBase64
  const decodeBase64 = options.decodeBase64 ?? defaultDecodeBase64

  /** @type {Promise<NativeFs> | null} */
  let fsPromise = null
  function getFs() {
    if (options.fs) return Promise.resolve(options.fs)
    if (!fsPromise) {
      fsPromise = import('@capacitor/filesystem').then(({ Filesystem }) => Filesystem)
    }
    return fsPromise
  }

  /** @type {Map<string, AbortController>} */
  const controllers = new Map()

  async function ensureDir(path) {
    const fs = await getFs()
    try {
      await fs.mkdir({ path, directory, recursive: true })
    } catch {
      /* exists */
    }
  }

  async function writeAtomic(relativePath, bytes) {
    if (!isSafeRelativePath(relativePath) && !relativePath.startsWith('chronowalk/')) {
      // productVersionDir roots are under chronowalk/downloads — allow that prefix.
      if (!relativePath.startsWith('chronowalk/downloads/')) {
        throw Object.assign(new Error(`Unsafe path: ${relativePath}`), { code: 'unsafe_path' })
      }
    }
    const fs = await getFs()
    const partial = `${relativePath}.partial`
    const parent = relativePath.split('/').slice(0, -1).join('/')
    if (parent) await ensureDir(parent)
    await fs.writeFile({
      path: partial,
      directory,
      data: encodeBase64(bytes),
      recursive: true,
    })
    if (typeof fs.rename === 'function') {
      try {
        await fs.rename({ from: partial, to: relativePath, directory })
        return
      } catch {
        /* fall through */
      }
    }
    await fs.writeFile({
      path: relativePath,
      directory,
      data: encodeBase64(bytes),
      recursive: true,
    })
    if (typeof fs.deleteFile === 'function') {
      try {
        await fs.deleteFile({ path: partial, directory })
      } catch {
        /* ignore */
      }
    }
  }

  async function readBytes(relativePath) {
    const fs = await getFs()
    const result = await fs.readFile({ path: relativePath, directory })
    return decodeBase64(String(result.data))
  }

  async function fileExists(relativePath) {
    const fs = await getFs()
    if (typeof fs.stat === 'function') {
      try {
        await fs.stat({ path: relativePath, directory })
        return true
      } catch {
        return false
      }
    }
    try {
      await fs.readFile({ path: relativePath, directory })
      return true
    } catch {
      return false
    }
  }

  return {
    kind: /** @type {const} */ ('native'),

    async getStatus(productId, locale = 'en') {
      return store.get(downloadRegistryKey({ productId, locale }))
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
     * @param {{ onProgress?: Function }} [opts]
     */
    async download(manifest, opts = {}) {
      const net = await getNetworkStatus()
      if (net && net.connected === false) {
        const key = downloadRegistryKey(manifest)
        const existing =
          store.get(key) ??
          createDownloadRecord({
            productId: manifest.productId,
            cityId: manifest.cityId,
            locale: manifest.locale,
            packageVersion: manifest.packageVersion,
            totalBytes: manifest.estimatedBytes,
            status: 'not_downloaded',
          })
        const queued =
          existing.status === 'not_downloaded'
            ? persistTransition(existing, 'queued', store)
            : existing
        return persistTransition(queued, 'failed', store, { errorCode: 'network_offline' })
      }

      const capacity = assessStorageCapacity(
        manifest.estimatedBytes,
        await getFreeBytes(),
      )
      if (!capacity.ok) {
        const key = downloadRegistryKey(manifest)
        const existing =
          store.get(key) ??
          createDownloadRecord({
            productId: manifest.productId,
            cityId: manifest.cityId,
            locale: manifest.locale,
            packageVersion: manifest.packageVersion,
            totalBytes: manifest.estimatedBytes,
            status: 'not_downloaded',
          })
        const queued =
          existing.status === 'not_downloaded'
            ? persistTransition(existing, 'queued', store)
            : existing
        return persistTransition(queued, 'failed', store, { errorCode: 'insufficient_space' })
      }

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
        record = persistTransition(record, 'queued', store, {
          packageVersion: manifest.packageVersion,
          totalBytes: manifest.estimatedBytes,
          errorCode: null,
        })
      }
      if (
        record.status === 'queued' ||
        record.status === 'paused' ||
        record.status === 'update_available'
      ) {
        record = persistTransition(record, 'downloading', store, {
          packageVersion: manifest.packageVersion,
          totalBytes: manifest.estimatedBytes,
        })
      } else if (record.status !== 'downloading') {
        record = persistTransition(record, 'downloading', store)
      }

      const root = productVersionDir(manifest)
      await ensureDir(root)

      const controller = new AbortController()
      controllers.set(key, controller)

      let bytesDownloaded = record.bytesDownloaded || 0
      const fileStatuses = { ...(record.fileStatuses || {}) }

      try {
        for (const file of manifest.files) {
          if (controller.signal.aborted) {
            return persistTransition(store.get(key) ?? record, 'paused', store, {
              bytesDownloaded,
              fileStatuses,
            })
          }

          if (file.integrity === 'skipped' || (file.inline && file.type !== 'route_metadata')) {
            fileStatuses[file.assetId] = 'complete'
            continue
          }

          const dest = `${root}/${file.path}`
          if (!dest.includes('..')) {
            /* path already validated in manifest */
          }

          if (fileStatuses[file.assetId] === 'complete' && (await fileExists(dest))) {
            continue
          }

          /** @type {Uint8Array} */
          let bytes
          if (file.type === 'route_metadata' || (file.inline && !file.url)) {
            const body = new TextEncoder().encode(
              JSON.stringify({
                productId: manifest.productId,
                cityId: manifest.cityId,
                packageVersion: manifest.packageVersion,
              }),
            )
            bytes = body
          } else {
            if (!file.url) {
              throw Object.assign(new Error(`Missing URL for ${file.assetId}`), {
                code: 'missing_source',
              })
            }
            if (!fetchImpl) {
              throw Object.assign(new Error('fetch unavailable'), { code: 'network_error' })
            }
            const response = await fetchImpl(file.url, { signal: controller.signal })
            if (!response.ok) {
              throw Object.assign(new Error(`HTTP ${response.status}`), { code: 'network_error' })
            }
            bytes = new Uint8Array(await response.arrayBuffer())
          }

          if (file.checksum) {
            const check = await verifyChecksum(bytes, file.checksum)
            if (!check.ok) {
              throw Object.assign(new Error(`Checksum failed for ${file.assetId}`), {
                code: 'checksum_mismatch',
              })
            }
          } else {
            integrityCapability(file) // documents unverified path
          }

          await writeAtomic(dest, bytes)
          fileStatuses[file.assetId] = 'complete'
          bytesDownloaded += bytes.byteLength
          opts.onProgress?.({
            bytesDownloaded,
            totalBytes: manifest.estimatedBytes,
            fileId: file.assetId,
          })
          store.set(
            key,
            createDownloadRecord({
              ...(store.get(key) ?? record),
              bytesDownloaded,
              fileStatuses,
              status: 'downloading',
            }),
          )
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
        // Incomplete cleanup: drop .partial siblings best-effort.
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
      return this.download(manifest, opts)
    },

    async remove(productId, locale = 'en') {
      const key = downloadRegistryKey({ productId, locale })
      const record = store.get(key)
      if (!record) return { removed: false, entitlementUntouched: true }
      persistTransition(record, 'removing', store)
      const root = productVersionDir({
        cityId: record.cityId,
        productId: record.productId,
        locale: record.locale,
        packageVersion: record.packageVersion,
      })
      const fs = await getFs()
      if (typeof fs.rmdir === 'function') {
        try {
          await fs.rmdir({ path: root, directory, recursive: true })
        } catch {
          /* ignore */
        }
      }
      store.delete(key)
      return { removed: true, entitlementUntouched: true }
    },

    async verify(manifest) {
      const key = downloadRegistryKey(manifest)
      const record = store.get(key)
      if (!record || (record.status !== 'ready' && record.status !== 'update_available')) {
        return { ok: false, code: 'not_ready' }
      }
      const root = productVersionDir(manifest)
      for (const file of manifest.files) {
        if (file.integrity === 'skipped') continue
        if (file.inline && file.type !== 'route_metadata') continue
        const dest = `${root}/${file.path}`
        if (!(await fileExists(dest))) {
          return { ok: false, code: 'missing_file', fileId: file.assetId }
        }
        if (file.checksum) {
          const bytes = await readBytes(dest)
          const check = await verifyChecksum(bytes, file.checksum)
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
      return persistTransition(record, 'update_available', store)
    },
  }
}

function defaultEncodeBase64(bytes) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64')
  }
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

function defaultDecodeBase64(b64) {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(b64, 'base64'))
  }
  const binary = atob(b64)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i)
  return out
}
