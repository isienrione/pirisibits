import { getTourById } from '../services/tourRegistry'
import {
  createBlobObjectUrl,
  getOfflineWaypointRecord,
  readTourPackageRecord,
  TOUR_PACKAGE_STATUS,
} from './offlineStorage'
import {
  deleteDownloadedTour,
  downloadTourAssets,
  getActiveDownloadProgress,
  verifyDownloadedTourAssets,
} from './downloadManager'
import { canonicalAssetUrl } from './cacheManifest'

export { TOUR_PACKAGE_STATUS } from './offlineStorage'

export async function isTourDownloaded(tourId) {
  const record = await readTourPackageRecord(tourId)
  if (!record || record.status !== TOUR_PACKAGE_STATUS.COMPLETE || !record.manifest) {
    return false
  }

  const verification = await verifyDownloadedTourAssets(record.manifest)
  return verification.valid
}

export async function getTourPackage(tourId) {
  const record = await readTourPackageRecord(tourId)
  if (!record) return null

  return {
    tourId: record.tourId,
    status: record.status,
    manifest: record.manifest,
    downloadedAt: record.downloadedAt ?? null,
    verifiedAt: record.verifiedAt ?? null,
    error: record.error ?? null,
  }
}

export async function downloadTour(tourId, options = {}) {
  if (!getTourById(tourId)) {
    throw new Error(`Tour not found: ${tourId}`)
  }

  return downloadTourAssets(tourId, options)
}

export function getTourDownloadProgress(tourId) {
  return getActiveDownloadProgress(tourId)
}

export async function deleteTour(tourId) {
  return deleteDownloadedTour(tourId)
}

export async function verifyTourPackage(tourId) {
  const record = await readTourPackageRecord(tourId)
  if (!record?.manifest) {
    return {
      valid: false,
      total: 0,
      missing: [],
      reason: 'missing-manifest',
    }
  }

  const verification = await verifyDownloadedTourAssets(record.manifest)
  return {
    ...verification,
    status: record.status,
    reason: verification.valid ? null : 'missing-assets',
  }
}

export async function getOfflineWaypoint(tourId, stopId) {
  const record = await getOfflineWaypointRecord(tourId, stopId)
  if (!record) return null

  return {
    id: record.stopId,
    title: record.title,
    ...record.metadata,
    geo: record.geo,
  }
}

/** Resolve a waypoint media field to an offline blob URL when the tour package is verified. */
export async function resolveOfflineMediaUrl(tourId, waypointId, field, originalUrl) {
  const downloaded = await isTourDownloaded(tourId)
  if (!downloaded || !originalUrl) return null

  const cacheKey = canonicalAssetUrl(originalUrl)
  return createBlobObjectUrl(cacheKey)
}

export async function listDownloadedTours() {
  const { listTourPackageRecords } = await import('./offlineStorage')
  const records = await listTourPackageRecords()
  return records
    .filter((record) => record.status === TOUR_PACKAGE_STATUS.COMPLETE)
    .map((record) => ({
      tourId: record.tourId,
      title: record.manifest?.tour?.title ?? record.tourId,
      downloadedAt: record.downloadedAt ?? null,
      assetCount: record.manifest?.assetCount ?? 0,
      stopCount: record.manifest?.stopIds?.length ?? 0,
    }))
}
