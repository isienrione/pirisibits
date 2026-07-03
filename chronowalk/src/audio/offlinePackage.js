import { collectManifestAudioPaths } from '../content/audioPaths.js'
import { collectManifestMediaPaths } from '../content/mediaPaths.js'
import { findDurationMismatches } from '../content/durationVerification.js'
import { registerCachedMedia, clearCachedMedia, cacheUrlForManifestPath } from '../lib/mediaUrl.js'
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
const ESTIMATED_BYTES_PER_IMAGE = 400_000
const ESTIMATED_BYTES_PER_VIDEO = 3_000_000

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function mediaContentType(manifestPath) {
  if (manifestPath.endsWith('.avif')) return 'image/avif'
  if (manifestPath.endsWith('.webp')) return 'image/webp'
  if (manifestPath.endsWith('.mp4')) return 'video/mp4'
  if (/\.jpe?g$/i.test(manifestPath)) return 'image/jpeg'
  return 'application/octet-stream'
}

function estimateMediaBytes(manifestPath) {
  if (manifestPath.includes('/video/') || manifestPath.endsWith('.mp4')) {
    return ESTIMATED_BYTES_PER_VIDEO
  }
  return ESTIMATED_BYTES_PER_IMAGE
}

export function listRomeAudioManifestPaths(manifest) {
  return collectManifestAudioPaths(manifest)
}

export function listRomeMediaManifestPaths(manifest) {
  return collectManifestMediaPaths(manifest)
}

export function estimateRomeAudioDownload(manifest) {
  const audioPaths = listRomeAudioManifestPaths(manifest)
  const mediaPaths = listRomeMediaManifestPaths(manifest)
  const mapEstimate = estimateRomeMapTileDownload(manifest)
  const audioBytes = audioPaths.length * ESTIMATED_BYTES_PER_FILE
  const mediaBytes = mediaPaths.reduce((sum, path) => sum + estimateMediaBytes(path), 0)

  return {
    fileCount: audioPaths.length,
    mediaFileCount: mediaPaths.length,
    bytes: audioBytes,
    mediaBytes,
    mapTileCount: mapEstimate.tileCount,
    mapBytes: mapEstimate.bytes,
    totalBytes: audioBytes + mediaBytes + mapEstimate.bytes,
  }
}

export function readRomeOfflineStatus() {
  if (typeof window === 'undefined') {
    return {
      status: OFFLINE_AUDIO_STATUS.NONE,
      fileCount: 0,
      mediaFileCount: 0,
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
        mediaFileCount: 0,
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
      mediaFileCount: 0,
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
  const match = await cache.match(cacheUrlForManifestPath(manifestPath))
  if (!match?.ok) return false
  const blob = await match.blob()
  return blob.size > 0
}

async function verifyCachedManifestPaths(paths, { durationChecks = false, manifest } = {}) {
  const cache = await openRomeAudioCache()
  const missing = []
  const durationCheckInputs = []

  for (const manifestPath of paths) {
    const match = await cache.match(cacheUrlForManifestPath(manifestPath))
    if (!match?.ok) {
      missing.push(manifestPath)
      continue
    }

    const blob = await match.blob()
    if (!blob.size) {
      missing.push(manifestPath)
      continue
    }

    if (durationChecks) {
      durationCheckInputs.push({ path: manifestPath, blobSize: blob.size })
    }
  }

  const durationMismatches = durationChecks
    ? findDurationMismatches(manifest, durationCheckInputs)
    : []

  return {
    valid: missing.length === 0 && durationMismatches.length === 0,
    total: paths.length,
    missing,
    durationMismatches,
  }
}

export async function verifyRomeAudioPackage(manifest) {
  const audioPaths = listRomeAudioManifestPaths(manifest)
  const mediaPaths = listRomeMediaManifestPaths(manifest)

  const audioVerification = await verifyCachedManifestPaths(audioPaths, {
    durationChecks: true,
    manifest,
  })
  const mediaVerification = await verifyCachedManifestPaths(mediaPaths)

  return {
    valid: audioVerification.valid && mediaVerification.valid,
    total: audioVerification.total + mediaVerification.total,
    missing: [...audioVerification.missing, ...mediaVerification.missing],
    durationMismatches: audioVerification.durationMismatches,
    mediaMissing: mediaVerification.missing,
  }
}

export async function hydrateRomeAudioCache(manifest) {
  const audioPaths = listRomeAudioManifestPaths(manifest)
  const mediaPaths = listRomeMediaManifestPaths(manifest)
  const cache = await openRomeAudioCache()

  for (const manifestPath of audioPaths) {
    const response = await cache.match(cacheUrlForManifestPath(manifestPath))
    if (!response?.ok) continue

    const blob = await response.blob()
    if (!blob.size) continue

    registerCachedAudio(manifestPath, URL.createObjectURL(blob))
  }

  for (const manifestPath of mediaPaths) {
    const response = await cache.match(cacheUrlForManifestPath(manifestPath))
    if (!response?.ok) continue

    const blob = await response.blob()
    if (!blob.size) continue

    registerCachedMedia(manifestPath, URL.createObjectURL(blob))
  }
}

async function downloadManifestPaths(paths, { cache, signal, onPathComplete, contentTypeForPath }) {
  for (const manifestPath of paths) {
    if (signal?.aborted) throw new DOMException('Download aborted', 'AbortError')

    const sourceUrl = cacheUrlForManifestPath(manifestPath)
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
        headers: {
          'Content-Type': response.headers.get('Content-Type') ?? contentTypeForPath(manifestPath),
        },
      }))
    }

    onPathComplete(manifestPath)
  }
}

export async function downloadRomeAudioPackage(manifest, { onProgress, signal } = {}) {
  const audioPaths = listRomeAudioManifestPaths(manifest)
  const mediaPaths = listRomeMediaManifestPaths(manifest)
  const mapEstimate = estimateRomeMapTileDownload(manifest)
  const totalSteps = audioPaths.length + mediaPaths.length + mapEstimate.tileCount
  const cache = await openRomeAudioCache()

  writeRomeOfflineStatus({
    status: OFFLINE_AUDIO_STATUS.DOWNLOADING,
    fileCount: audioPaths.length,
    mediaFileCount: mediaPaths.length,
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

    const onPathComplete = (manifestPath) => {
      completed += 1
      reportProgress(manifestPath)
    }

    await downloadManifestPaths(audioPaths, {
      cache,
      signal,
      onPathComplete,
      contentTypeForPath: () => 'audio/mpeg',
    })

    await downloadManifestPaths(mediaPaths, {
      cache,
      signal,
      onPathComplete,
      contentTypeForPath: mediaContentType,
    })

    const packageVerification = await verifyRomeAudioPackage(manifest)
    if (!packageVerification.valid) {
      const durationIssue = packageVerification.durationMismatches?.[0]
      if (durationIssue) {
        throw new Error(
          `Offline duration check failed for ${durationIssue.path} (${durationIssue.blobSize} bytes, expected ≥${durationIssue.minimumBytes}).`
        )
      }
      throw new Error(`Offline verification failed (${packageVerification.missing.length} missing files).`)
    }

    await hydrateRomeAudioCache(manifest)

    if (env.mapboxToken && mapEstimate.tileCount > 0) {
      await downloadRomeMapTiles(manifest, {
        signal,
        token: env.mapboxToken,
        onProgress: ({ completed: mapCompleted, currentPath }) => {
          completed = audioPaths.length + mediaPaths.length + mapCompleted
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
      fileCount: audioPaths.length,
      mediaFileCount: mediaPaths.length,
      mapTileCount: mapVerification.total,
      downloadedAt,
      error: null,
    })

    return {
      status: OFFLINE_AUDIO_STATUS.COMPLETE,
      fileCount: audioPaths.length,
      mediaFileCount: mediaPaths.length,
      mapTileCount: mapVerification.total,
      downloadedAt,
      verification: packageVerification,
      mapVerification,
    }
  } catch (error) {
    writeRomeOfflineStatus({
      status: OFFLINE_AUDIO_STATUS.FAILED,
      fileCount: audioPaths.length,
      mediaFileCount: mediaPaths.length,
      mapTileCount: mapEstimate.tileCount,
      downloadedAt: null,
      error: error?.message ?? 'Download failed',
    })
    throw error
  }
}

export async function clearRomeAudioPackage(manifest) {
  const audioPaths = listRomeAudioManifestPaths(manifest)
  const mediaPaths = listRomeMediaManifestPaths(manifest)
  const cache = await openRomeAudioCache()

  await Promise.all(
    [...audioPaths, ...mediaPaths].map((manifestPath) =>
      cache.delete(cacheUrlForManifestPath(manifestPath))
    )
  )
  clearCachedAudio()
  clearCachedMedia()
  await clearRomeMapTiles(manifest, { token: env.mapboxToken })

  writeRomeOfflineStatus({
    status: OFFLINE_AUDIO_STATUS.NONE,
    fileCount: 0,
    mediaFileCount: 0,
    mapTileCount: 0,
    downloadedAt: null,
    error: null,
  })

  return { deleted: audioPaths.length + mediaPaths.length }
}

export async function isRomeAudioReadyOffline(manifest) {
  const status = readRomeOfflineStatus()
  if (status.status !== OFFLINE_AUDIO_STATUS.COMPLETE) return false
  const verification = await verifyRomeAudioPackage(manifest)
  if (!verification.valid) return false
  return isRomeMapReadyOffline(manifest, { token: env.mapboxToken })
}
