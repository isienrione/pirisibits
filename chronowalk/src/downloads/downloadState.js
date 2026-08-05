/**
 * Product-level download status machine.
 * Domain DownloadStatus remains file/adapter-oriented; this models the product job.
 */

/** @typedef {typeof PRODUCT_DOWNLOAD_STATUSES[number]} ProductDownloadStatus */

export const PRODUCT_DOWNLOAD_STATUSES = Object.freeze([
  'not_downloaded',
  'queued',
  'downloading',
  'paused',
  'verifying',
  'ready',
  'update_available',
  'failed',
  'removing',
])

/** @type {Readonly<Record<ProductDownloadStatus, readonly ProductDownloadStatus[]>>} */
export const PRODUCT_DOWNLOAD_TRANSITIONS = Object.freeze({
  not_downloaded: Object.freeze(['queued', 'downloading']),
  queued: Object.freeze(['downloading', 'paused', 'failed', 'removing']),
  downloading: Object.freeze(['paused', 'verifying', 'failed', 'queued', 'removing']),
  paused: Object.freeze(['queued', 'downloading', 'removing', 'failed']),
  verifying: Object.freeze(['ready', 'failed', 'removing']),
  ready: Object.freeze(['update_available', 'removing', 'downloading', 'verifying']),
  update_available: Object.freeze(['queued', 'downloading', 'removing']),
  failed: Object.freeze(['queued', 'downloading', 'removing', 'not_downloaded']),
  removing: Object.freeze(['not_downloaded', 'failed']),
})

/**
 * @param {string} status
 * @returns {status is ProductDownloadStatus}
 */
export function isProductDownloadStatus(status) {
  return PRODUCT_DOWNLOAD_STATUSES.includes(/** @type {ProductDownloadStatus} */ (status))
}

/**
 * @param {ProductDownloadStatus} from
 * @param {ProductDownloadStatus} to
 * @returns {boolean}
 */
export function canTransitionDownloadStatus(from, to) {
  if (!isProductDownloadStatus(from) || !isProductDownloadStatus(to)) return false
  return PRODUCT_DOWNLOAD_TRANSITIONS[from].includes(to)
}

/**
 * @param {ProductDownloadStatus} from
 * @param {ProductDownloadStatus} to
 * @returns {ProductDownloadStatus}
 */
export function assertTransition(from, to) {
  if (!canTransitionDownloadStatus(from, to)) {
    throw new Error(`Invalid download status transition: ${from} → ${to}`)
  }
  return to
}

/**
 * @typedef {Object} DownloadRecord
 * @property {string} productId Package product id (download key).
 * @property {string} cityId
 * @property {string} locale
 * @property {string} packageVersion
 * @property {number} bytesDownloaded
 * @property {number} totalBytes
 * @property {ProductDownloadStatus} status
 * @property {string | null} errorCode
 * @property {string} updatedAt ISO timestamp
 * @property {Record<string, 'pending' | 'complete' | 'failed'>} [fileStatuses]
 */

const SECRET_KEYS = Object.freeze([
  'token',
  'accessToken',
  'refreshToken',
  'purchaseToken',
  'entitlementToken',
  'paddle',
  'secret',
  'authorization',
  'apiKey',
])

/**
 * @param {Partial<DownloadRecord> & Pick<DownloadRecord, 'productId' | 'cityId' | 'locale' | 'packageVersion'>} input
 * @returns {DownloadRecord}
 */
export function createDownloadRecord(input) {
  const now = new Date().toISOString()
  return {
    productId: input.productId,
    cityId: input.cityId,
    locale: input.locale,
    packageVersion: input.packageVersion,
    bytesDownloaded: Number(input.bytesDownloaded) || 0,
    totalBytes: Number(input.totalBytes) || 0,
    status: isProductDownloadStatus(input.status) ? input.status : 'not_downloaded',
    errorCode: input.errorCode ?? null,
    updatedAt: input.updatedAt ?? now,
    fileStatuses: input.fileStatuses ? { ...input.fileStatuses } : {},
  }
}

/**
 * True when a record (or plain object) contains no purchase/secret fields.
 *
 * @param {object} record
 * @returns {boolean}
 */
export function downloadRecordHasNoSecrets(record) {
  if (!record || typeof record !== 'object') return false
  const keys = Object.keys(record)
  for (const key of keys) {
    const lower = key.toLowerCase()
    if (SECRET_KEYS.some((s) => lower.includes(s.toLowerCase()))) return false
  }
  return true
}

/**
 * @param {DownloadRecord} record
 * @param {ProductDownloadStatus} next
 * @param {Partial<DownloadRecord>} [patch]
 * @returns {DownloadRecord}
 */
export function transitionDownloadRecord(record, next, patch = {}) {
  assertTransition(record.status, next)
  return createDownloadRecord({
    ...record,
    ...patch,
    productId: record.productId,
    cityId: record.cityId,
    locale: record.locale,
    packageVersion: patch.packageVersion ?? record.packageVersion,
    status: next,
    updatedAt: new Date().toISOString(),
  })
}
