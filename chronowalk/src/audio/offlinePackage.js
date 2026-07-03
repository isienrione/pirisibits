import { collectManifestAudioPaths } from '../content/audioPaths.js'
import { mediaUrl } from '../lib/mediaUrl.js'
import { clearCachedAudio, registerCachedAudio } from './audioUrl.js'
import {
  clearRomeMapTiles,
  downloadRomeMapTiles,
  estimateRomeMapTileDownload,
  hydrateRomeMapTileCache,
  isRomeMapReadyOffline,
  verifyRomeMapTiles,
} from '../map/offlineMapTiles.js'
import { env } from '../config/env.js'

export const ROME_OFFLINE_PACKAGE_ID = 'rome'
export const ROME_AUDIO_CACHE = 'chronowalk-rome-audio-v2'
export const ROME_OFFLINE_STATUS_KEY = 'cw_offline_rome_audio_v1'

export const OFFLINE_AUDIO_STATUS = {
  NONE: 'none',
  DOWNLOADING: 'downloading',
  COMPLETE: 'complete',
  FAILED: 'failed',
}

const ESTIMATED_BYTES_PER_FILE = 750_000

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

export function listRomeAudioManifestPaths(manifest) {
  return collectManifestAudioPaths(manifest)
}

export function estimateRomeAudioDownload(manifest) {
  const paths = listRomeAudioManifestPaths(manifest)
  const mapEstimate = estimateRomeMapTileDownload(manifest)
  return {
    fileCount: paths.length,
    bytes: paths.length * ESTIMATED_BYTES_PER_FILE,
    mapTileCount: mapEstimate.tileCount,
    mapBytes: mapEstimate.bytes,
    totalBytes: paths.length * ESTIMATED_BYTES_PER_FILE + mapEstimate.bytes,
  }
}

export function readRomeOfflineStatus() {
  if (typeof window === 'undefined') {
    return {
      status: OFFLINE_AUDIO_STATUS.NONE,
      fileCount: 0,
      mapTileCount: 0,
      downloadedAt: null,
      error: null,
    }
  }

  try {
    const raw = window.localStorage.getItem(ROME_OFFLINE_STATUS_KEY)
    if (!raw) {
      return {
        status: OFFLINE_AUDIO_STATUS.NONE,
        fileCount: 0,
        mapTileCount: 0,
        downloadedAt: null,
        error: null,
      }
    }
    const parsed = JSON.parse(raw)
    return {
      mapTileCount: 0,
      ...parsed,
    }
  } catch {
    return {
      status: OFFLINE_AUDIO_STATUS.NONE,
      fileCount: 0,
      mapTileCount: 0,
      downloadedAt: null,
      error: null,
    }
  }
}

export function writeRomeOfflineStatus(status) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(ROME_OFFLINE_STATUS_KEY, JSON.stringify(status))
}

async function openRomeAudioCache() {
  if (typeof caches === 'undefined') {
    throw new Error('Cache storage is not supported in this browser.')
  }
  return caches.open(ROME_AUDIO_CACHE)
}

export async function hasCachedRomeAudio(manifestPath) {
  const cache = await openRomeAudioCache()
  const match = await cache.match(mediaUrl(manifestPath))
  if (!match?.ok) return false
  const blob = await match.blob()
  return blob.size > 0
}

export async function verifyRomeAudioPackage(manifest) {
  const paths = listRomeAudioManifestPaths(manifest)
  const cache = await openRomeAudioCache()
  const missing = []

  for (const manifestPath of paths) {
    const match = await cache.match(mediaUrl(manifestPath))
    if (!match?.ok) {
      missing.push(manifestPath)
      continue
    }

    const blob = await match.blob()
    if (!blob.size) missing.push(manifestPath)
  }

  return {
    valid: missing.length === 0,
    total: paths.length,
    missing,
  }
}

export async function hydrateRomeAudioCache(manifest) {
  const paths = listRomeAudioManifestPaths(manifest)
  const cache = await openRomeAudioCache()

  for (const manifestPath of paths) {
    const response = await cache.match(mediaUrl(manifestPath))
    if (!response?.ok) continue

    const blob = await response.blob()
    if (!blob.size) continue

    registerCachedAudio(manifestPath, URL.createObjectURL(blob))
  }
}

export async function downloadRomeAudioPackage(manifest, { onProgress, signal } = {}) {
  const paths = listRomeAudioManifestPaths(manifest)
  const mapEstimate = estimateRomeMapTileDownload(manifest)
  const totalSteps = paths.length + mapEstimate.tileCount
  const cache = await openRomeAudioCache()

  writeRomeOfflineStatus({
    status: OFFLINE_AUDIO_STATUS.DOWNLOADING,
    fileCount: paths.length,
    mapTileCount: mapEstimate.tileCount,
    downloadedAt: null,
    error: null,
  })

  try {
    let completed = 0

    const reportProgress = (currentPath) => {
      onProgress?.({
        completed,
        total: totalSteps,
        percent: clampPercent((completed / totalSteps) * 100),
        currentPath,
      })
    }

    for (const manifestPath of paths) {
      if (signal?.aborted) throw new DOMException('Download aborted', 'AbortError')

      const sourceUrl = mediaUrl(manifestPath)
      const existing = await cache.match(sourceUrl)
      if (!existing?.ok) {
        const response = await fetch(sourceUrl)
        if (!response.ok) {
          throw new Error(`Failed to download ${manifestPath} (${response.status})`)
        }

        const blob = await response.blob()
        if (!blob.size) {
          throw new Error(`Downloaded empty file for ${manifestPath}`)
        }

        await cache.put(sourceUrl, new Response(blob, {
          status: 200,
          headers: { 'Content-Type': response.headers.get('Content-Type') ?? 'audio/mpeg' },
        }))
      }

      completed += 1
      reportProgress(manifestPath)
    }

    const audioVerification = await verifyRomeAudioPackage(manifest)
    if (!audioVerification.valid) {
      throw new Error(`Offline verification failed (${audioVerification.missing.length} missing files).`)
    }

    await hydrateRomeAudioCache(manifest)

    if (env.mapboxToken && mapEstimate.tileCount > 0) {
      await downloadRomeMapTiles(manifest, {
        signal,
        token: env.mapboxToken,
        onProgress: ({ completed: mapCompleted, currentPath }) => {
          completed = paths.length + mapCompleted
          reportProgress(currentPath)
        },
      })
    }

    const mapVerification = await verifyRomeMapTiles(manifest, { token: env.mapboxToken })
    if (!mapVerification.valid && !mapVerification.skipped) {
      throw new Error(`Map tile verification failed (${mapVerification.missing.length} missing).`)
    }

    const downloadedAt = Date.now()
    writeRomeOfflineStatus({
      status: OFFLINE_AUDIO_STATUS.COMPLETE,
      fileCount: paths.length,
      mapTileCount: mapVerification.total,
      downloadedAt,
      error: null,
    })

    return {
      status: OFFLINE_AUDIO_STATUS.COMPLETE,
      fileCount: paths.length,
      mapTileCount: mapVerification.total,
      downloadedAt,
      verification: audioVerification,
      mapVerification,
    }
  } catch (error) {
    writeRomeOfflineStatus({
      status: OFFLINE_AUDIO_STATUS.FAILED,
      fileCount: paths.length,
      mapTileCount: mapEstimate.tileCount,
      downloadedAt: null,
      error: error?.message ?? 'Download failed',
    })
    throw error
  }
}

export async function clearRomeAudioPackage(manifest) {
  const paths = listRomeAudioManifestPaths(manifest)
  const cache = await openRomeAudioCache()

  await Promise.all(paths.map((manifestPath) => cache.delete(mediaUrl(manifestPath))))
  clearCachedAudio()
  await clearRomeMapTiles(manifest, { token: env.mapboxToken })

  writeRomeOfflineStatus({
    status: OFFLINE_AUDIO_STATUS.NONE,
    fileCount: 0,
    mapTileCount: 0,
    downloadedAt: null,
    error: null,
  })

  return { deleted: paths.length }
}

export async function isRomeAudioReadyOffline(manifest) {
  const status = readRomeOfflineStatus()
  if (status.status !== OFFLINE_AUDIO_STATUS.COMPLETE) return false
  const verification = await verifyRomeAudioPackage(manifest)
  if (!verification.valid) return false
  return isRomeMapReadyOffline(manifest, { token: env.mapboxToken })
}
