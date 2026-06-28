import { fetchWaypointById } from '../services/waypointService'
import { getTourById } from '../services/tourRegistry'
import { buildTourCacheManifest, listRequiredCacheKeys } from './cacheManifest'
import {
  deleteCachedAssets,
  deleteTourPackageRecord,
  hasCachedAsset,
  putCachedAsset,
  readTourPackageRecord,
  TOUR_PACKAGE_STATUS,
  writeTourPackageRecord,
} from './offlineStorage'

const activeDownloads = new Map()

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function createProgressPayload(tourId, phase, completed, total, extra = {}) {
  const percent = total > 0 ? clampPercent((completed / total) * 100) : 0
  return {
    tourId,
    phase,
    completed,
    total,
    percent,
    ...extra,
  }
}

async function fetchAssetResponse(sourceUrl) {
  const response = await fetch(sourceUrl, { credentials: 'same-origin' })
  if (!response.ok) {
    throw new Error(`Failed to download asset (${response.status}): ${sourceUrl}`)
  }
  return response
}

export function getActiveDownloadProgress(tourId) {
  return activeDownloads.get(tourId) ?? null
}

export async function downloadTourAssets(tourId, options = {}) {
  const { onProgress, signal } = options
  const existing = activeDownloads.get(tourId)
  if (existing?.promise) {
    return existing.promise
  }

  const tour = getTourById(tourId)
  if (!tour) {
    throw new Error(`Tour not found: ${tourId}`)
  }

  const controller = new AbortController()
  const abortSignal = signal ?? controller.signal

  const downloadPromise = (async () => {
    let manifest = null

    try {
      onProgress?.(
        createProgressPayload(tourId, 'preparing', 0, tour.stopIds.length, { label: 'Preparing tour' })
      )

      const waypoints = []
      for (let index = 0; index < tour.stopIds.length; index += 1) {
        if (abortSignal.aborted) throw new DOMException('Download aborted', 'AbortError')
        const stopId = tour.stopIds[index]
        waypoints.push(await fetchWaypointById(stopId))
        onProgress?.(
          createProgressPayload(tourId, 'metadata', index + 1, tour.stopIds.length, {
            label: `Loaded ${stopId}`,
          })
        )
      }

      manifest = buildTourCacheManifest({ tour, waypoints })

      await writeTourPackageRecord({
        tourId,
        status: TOUR_PACKAGE_STATUS.DOWNLOADING,
        manifest,
        downloadedAt: null,
        verifiedAt: null,
        error: null,
      })

      const assets = manifest.assets
      let completedAssets = 0

      for (const asset of assets) {
        if (abortSignal.aborted) throw new DOMException('Download aborted', 'AbortError')

        const alreadyCached = await hasCachedAsset(asset.cacheKey)
        if (!alreadyCached) {
          const response = await fetchAssetResponse(asset.sourceUrl)
          await putCachedAsset(asset.cacheKey, response.clone())
        }

        completedAssets += 1
        onProgress?.(
          createProgressPayload(tourId, 'assets', completedAssets, assets.length, {
            label: asset.stopId,
            currentAsset: asset.field,
          })
        )
      }

      const verification = await verifyDownloadedTourAssets(manifest)

      if (!verification.valid) {
        throw new Error(
          `Offline verification failed. Missing ${verification.missing.length} of ${verification.total} assets.`
        )
      }

      const completedAt = Date.now()
      await writeTourPackageRecord({
        tourId,
        status: TOUR_PACKAGE_STATUS.COMPLETE,
        manifest,
        downloadedAt: completedAt,
        verifiedAt: completedAt,
        error: null,
      })

      onProgress?.(
        createProgressPayload(tourId, 'complete', assets.length, assets.length, {
          label: 'Download complete',
        })
      )

      return {
        tourId,
        status: TOUR_PACKAGE_STATUS.COMPLETE,
        manifest,
        verification,
      }
    } catch (error) {
      await writeTourPackageRecord({
        tourId,
        status: TOUR_PACKAGE_STATUS.FAILED,
        manifest,
        downloadedAt: null,
        verifiedAt: null,
        error: error?.message ?? 'Tour download failed',
      })
      throw error
    } finally {
      activeDownloads.delete(tourId)
    }
  })()

  activeDownloads.set(tourId, {
    promise: downloadPromise,
    abort: () => controller.abort(),
  })

  return downloadPromise
}

export async function verifyDownloadedTourAssets(manifest) {
  const cacheKeys = listRequiredCacheKeys(manifest)
  const missing = []

  for (const cacheKey of cacheKeys) {
    const cached = await hasCachedAsset(cacheKey)
    if (!cached) missing.push(cacheKey)
  }

  return {
    valid: missing.length === 0,
    total: cacheKeys.length,
    missing,
  }
}

export async function deleteDownloadedTour(tourId) {
  const record = await readTourPackageRecord(tourId)
  const cacheKeys = listRequiredCacheKeys(record?.manifest)

  await deleteCachedAssets(cacheKeys)
  await deleteTourPackageRecord(tourId)
  activeDownloads.delete(tourId)

  return {
    tourId,
    deletedAssets: cacheKeys.length,
  }
}
