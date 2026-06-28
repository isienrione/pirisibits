import { useCallback, useEffect, useState } from 'react'
import { estimateTourDownloadSize } from '../offline/estimateDownloadSize'
import {
  deleteTour,
  downloadTour,
  getTourPackage,
  isTourDownloaded,
} from '../offline/tourPackage'
import { TOUR_PACKAGE_STATUS } from '../offline/offlineStorage'
import { HAPTIC_KIND, triggerHaptic } from '../utils/haptics'

export function formatOfflineUpdatedAt(timestamp) {
  if (!timestamp) return null
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(timestamp))
  } catch {
    return null
  }
}

export function useOfflineDownload(tour) {
  const tourId = tour?.id ?? null
  const [estimate, setEstimate] = useState(null)
  const [packageInfo, setPackageInfo] = useState(null)
  const [isDownloaded, setIsDownloaded] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    if (!tourId) return

    const [pkg, downloaded] = await Promise.all([
      getTourPackage(tourId),
      isTourDownloaded(tourId),
    ])

    setPackageInfo(pkg)
    setIsDownloaded(downloaded)
    setIsDownloading(pkg?.status === TOUR_PACKAGE_STATUS.DOWNLOADING)
  }, [tourId])

  useEffect(() => {
    if (!tour) {
      setEstimate(null)
      return
    }

    setEstimate(estimateTourDownloadSize(tour))
    void refresh()
  }, [tour, refresh])

  const startDownload = useCallback(async () => {
    if (!tourId || isDownloading) return

    setError(null)
    setIsDownloading(true)
    triggerHaptic(HAPTIC_KIND.SELECTION)

    try {
      await downloadTour(tourId, {
        onProgress: setProgress,
      })
      triggerHaptic(HAPTIC_KIND.SOFT_TAP)
      await refresh()
    } catch (downloadError) {
      setError(downloadError?.message ?? 'Download failed. Try again on a stable connection.')
    } finally {
      setIsDownloading(false)
      setProgress(null)
    }
  }, [tourId, isDownloading, refresh])

  const removeDownload = useCallback(async () => {
    if (!tourId) return

    setError(null)
    triggerHaptic(HAPTIC_KIND.SELECTION)

    try {
      await deleteTour(tourId)
      await refresh()
    } catch (deleteError) {
      setError(deleteError?.message ?? 'Could not remove the offline download.')
    }
  }, [tourId, refresh])

  return {
    tourId,
    estimate,
    packageInfo,
    isDownloaded,
    isDownloading,
    progress,
    error,
    lastUpdatedAt: packageInfo?.downloadedAt ?? packageInfo?.verifiedAt ?? null,
    lastUpdatedLabel: formatOfflineUpdatedAt(packageInfo?.downloadedAt ?? packageInfo?.verifiedAt),
    startDownload,
    removeDownload,
    refresh,
  }
}
