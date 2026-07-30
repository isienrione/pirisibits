import { useCallback, useEffect, useState } from 'react'
import { loadRomeManifest } from '../content/manifest.js'
import {
  clearRomeAudioPackage,
  downloadRomeAudioPackage,
  estimateRomeAudioDownload,
  isRomeAudioReadyOffline,
  OFFLINE_AUDIO_STATUS,
  readRomeOfflineStatus,
} from '../audio/offlinePackage.js'
import { formatDownloadSize } from '../offline/estimateDownloadSize.js'

export function useOfflineAudio() {
  const [manifest, setManifest] = useState(null)
  const [status, setStatus] = useState(() => readRomeOfflineStatus())
  const [isReady, setIsReady] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    setManifest(loadRomeManifest())
  }, [])

  const refresh = useCallback(async () => {
    const nextStatus = readRomeOfflineStatus()
    setStatus(nextStatus)

    if (!manifest) {
      setIsReady(false)
      return
    }

    const ready = await isRomeAudioReadyOffline(manifest)
    setIsReady(ready)
    setIsDownloading(nextStatus.status === OFFLINE_AUDIO_STATUS.DOWNLOADING)
  }, [manifest])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const estimate = manifest ? estimateRomeAudioDownload(manifest) : null

  const startDownload = useCallback(async () => {
    if (!manifest || isDownloading) return

    setError(null)
    setIsDownloading(true)
    setIsReady(false)
    setProgress({ completed: 0, total: 1, percent: 1, currentPath: 'starting' })

    try {
      await downloadRomeAudioPackage(manifest, { onProgress: setProgress })
      setProgress({ completed: 1, total: 1, percent: 100, currentPath: 'complete' })
      setError(null)
      await refresh()
    } catch (downloadError) {
      const message = downloadError?.message ?? 'Download failed'
      // Missing CDN files are not a "bad signal" problem · say so clearly.
      const friendly =
        /essential story files missing|HTML|verification failed/i.test(message)
          ? 'Some story files could not be saved. Tap to retry.'
          : 'Download paused · tap to retry.'
      setError(friendly)
      await refresh()
    } finally {
      setIsDownloading(false)
    }
  }, [isDownloading, manifest, refresh])

  const removeDownload = useCallback(async () => {
    if (!manifest) return

    setError(null)
    try {
      await clearRomeAudioPackage(manifest)
      await refresh()
    } catch (deleteError) {
      setError(deleteError?.message ?? 'Could not clear the offline download.')
    }
  }, [manifest, refresh])

  return {
    manifest,
    estimate,
    estimateLabel: estimate ? formatDownloadSize(estimate.totalBytes ?? estimate.bytes) : '-',
    status,
    isReady,
    isDownloading,
    progress,
    error,
    startDownload,
    removeDownload,
    refresh,
  }
}
