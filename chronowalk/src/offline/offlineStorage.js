export {
  deleteOfflineTourData,
  deleteTourPackageRecord,
  getOfflineAudioAssets,
  getOfflineCompletedWaypointIds,
  getOfflineImageAssets,
  getOfflineMediaCue,
  getOfflineTour,
  getOfflineTranscript,
  getOfflineTransits,
  getOfflineWaypointRecord,
  getOfflineWaypoints,
  listOfflineTours,
  listTourPackageRecords,
  loadOfflineUserProgress,
  markOfflineWaypointCompleted,
  persistOfflineTourRecords,
  readTourPackageRecord,
  saveOfflineUserProgress,
  syncOfflineCompletedWaypoints,
  updateOfflineTourStatus,
  writeTourPackageRecord,
} from './offlineRepository'

export {
  getOfflineStorageFallbackReason,
  getOfflineStorageMode,
  getOfflineStore,
  isIndexedDbAvailable,
  isUsingMemoryFallback,
  resetOfflineStoreForTests,
} from './idbClient'

export { STORES, OFFLINE_DB_NAME, OFFLINE_DB_VERSION } from './idbSchema'

export const OFFLINE_TOUR_STORE = 'tour-packages'
export const OFFLINE_ASSET_CACHE = 'chronowalk-tour-packages-v1'

export const TOUR_PACKAGE_STATUS = {
  DOWNLOADING: 'downloading',
  COMPLETE: 'complete',
  FAILED: 'failed',
}

export function isOfflineStorageSupported() {
  return typeof caches !== 'undefined'
}

export async function openOfflineDatabase() {
  const { getOfflineStore } = await import('./idbClient')
  return getOfflineStore()
}

export async function openAssetCache() {
  if (typeof caches === 'undefined') {
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
