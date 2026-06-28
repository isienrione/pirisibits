export const OFFLINE_DB_NAME = 'chronowalk-offline'
export const OFFLINE_DB_VERSION = 1
export const OFFLINE_TOUR_STORE = 'tour-packages'
export const OFFLINE_ASSET_CACHE = 'chronowalk-tour-packages-v1'

export const TOUR_PACKAGE_STATUS = {
  DOWNLOADING: 'downloading',
  COMPLETE: 'complete',
  FAILED: 'failed',
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'))
  })
}

function waitForTransaction(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed'))
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted'))
  })
}

export function isOfflineStorageSupported() {
  return typeof indexedDB !== 'undefined' && typeof caches !== 'undefined'
}

export async function openOfflineDatabase() {
  if (!isOfflineStorageSupported()) {
    throw new Error('Offline storage is not supported in this environment.')
  }

  const request = indexedDB.open(OFFLINE_DB_NAME, OFFLINE_DB_VERSION)

  request.onupgradeneeded = () => {
    const db = request.result
    if (!db.objectStoreNames.contains(OFFLINE_TOUR_STORE)) {
      db.createObjectStore(OFFLINE_TOUR_STORE, { keyPath: 'tourId' })
    }
  }

  return requestToPromise(request)
}

export async function readTourPackageRecord(tourId) {
  const db = await openOfflineDatabase()
  const transaction = db.transaction(OFFLINE_TOUR_STORE, 'readonly')
  const record = await requestToPromise(transaction.objectStore(OFFLINE_TOUR_STORE).get(tourId))
  db.close()
  return record ?? null
}

export async function writeTourPackageRecord(record) {
  const db = await openOfflineDatabase()
  const transaction = db.transaction(OFFLINE_TOUR_STORE, 'readwrite')
  transaction.objectStore(OFFLINE_TOUR_STORE).put(record)
  await waitForTransaction(transaction)
  db.close()
  return record
}

export async function deleteTourPackageRecord(tourId) {
  const db = await openOfflineDatabase()
  const transaction = db.transaction(OFFLINE_TOUR_STORE, 'readwrite')
  transaction.objectStore(OFFLINE_TOUR_STORE).delete(tourId)
  await waitForTransaction(transaction)
  db.close()
}

export async function listTourPackageRecords() {
  const db = await openOfflineDatabase()
  const transaction = db.transaction(OFFLINE_TOUR_STORE, 'readonly')
  const records = await requestToPromise(transaction.objectStore(OFFLINE_TOUR_STORE).getAll())
  db.close()
  return records
}

export async function openAssetCache() {
  if (!isOfflineStorageSupported()) {
    throw new Error('Cache storage is not supported in this environment.')
  }
  return caches.open(OFFLINE_ASSET_CACHE)
}

export async function putCachedAsset(cacheKey, response) {
  const cache = await openAssetCache()
  await cache.put(cacheKey, response)
}

export async function hasCachedAsset(cacheKey) {
  const cache = await openAssetCache()
  const match = await cache.match(cacheKey)
  return Boolean(match?.ok)
}

export async function getCachedAssetResponse(cacheKey) {
  const cache = await openAssetCache()
  return cache.match(cacheKey)
}

export async function deleteCachedAssets(cacheKeys) {
  if (!cacheKeys?.length) return
  const cache = await openAssetCache()
  await Promise.all(cacheKeys.map((cacheKey) => cache.delete(cacheKey)))
}

export async function createBlobObjectUrl(cacheKey) {
  const response = await getCachedAssetResponse(cacheKey)
  if (!response?.ok) return null
  const blob = await response.blob()
  return URL.createObjectURL(blob)
}
