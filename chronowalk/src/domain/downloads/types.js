/**
 * Download domain contracts — offline package manifests and status.
 */

/**
 * @typedef {'pending' | 'queued' | 'downloading' | 'ready' | 'failed' | 'evicted'} DownloadStatus
 */

/**
 * @typedef {Object} DownloadFile
 * @property {string} assetId Asset identity this file fulfills.
 * @property {string} [url] Remote source URL.
 * @property {string} [path] Local or package-relative path after download.
 * @property {number} [bytes] Expected size when known.
 * @property {string} [checksum] Integrity hash when known.
 * @property {DownloadStatus} [status] Per-file status when tracked.
 */

/**
 * @typedef {Object} DownloadManifest
 * @property {number} schemaVersion Manifest schema version.
 * @property {string} [cityId] City package this manifest belongs to.
 * @property {string} [productId] Product scope when downloads are product-scoped.
 * @property {string} [packageVersion] Content package version string.
 * @property {DownloadFile[]} files Files required for offline use.
 */

/**
 * Adapter that fetches and tracks offline package files.
 *
 * @typedef {Object} DownloadAdapter
 * @property {(manifest: DownloadManifest) => Promise<void>} enqueue
 * @property {(assetId: string) => Promise<DownloadStatus>} getStatus
 * @property {(assetId: string) => Promise<string | null>} getLocalPath
 * @property {(assetId: string) => Promise<void>} [cancel]
 */

/** Method names required on {@link DownloadAdapter}. */
export const DOWNLOAD_ADAPTER_METHODS = Object.freeze([
  'enqueue',
  'getStatus',
  'getLocalPath',
])

/** Allowed {@link DownloadStatus} values. */
export const DOWNLOAD_STATUSES = Object.freeze([
  'pending',
  'queued',
  'downloading',
  'ready',
  'failed',
  'evicted',
])

/**
 * @param {string} status
 * @returns {status is DownloadStatus}
 */
export function isDownloadStatus(status) {
  return DOWNLOAD_STATUSES.includes(status)
}

/**
 * @param {DownloadFile} file
 * @returns {file is DownloadFile}
 */
export function isDownloadFile(file) {
  if (
    !file ||
    typeof file !== 'object' ||
    typeof file.assetId !== 'string' ||
    file.assetId.length === 0
  ) {
    return false
  }
  if (file.status != null && !isDownloadStatus(file.status)) {
    return false
  }
  return true
}

/**
 * @param {DownloadManifest} manifest
 * @returns {manifest is DownloadManifest}
 */
export function isDownloadManifest(manifest) {
  return (
    !!manifest &&
    typeof manifest === 'object' &&
    typeof manifest.schemaVersion === 'number' &&
    Array.isArray(manifest.files) &&
    manifest.files.every(isDownloadFile)
  )
}

/**
 * @param {DownloadAdapter} adapter
 * @returns {adapter is DownloadAdapter}
 */
export function isDownloadAdapter(adapter) {
  return (
    !!adapter &&
    typeof adapter === 'object' &&
    typeof adapter.enqueue === 'function' &&
    typeof adapter.getStatus === 'function' &&
    typeof adapter.getLocalPath === 'function'
  )
}
