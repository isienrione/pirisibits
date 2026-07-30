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

function isHtmlContentType(contentType) {
  return String(contentType || '').toLowerCase().includes('text/html')
}

/**
 * Files the walk cannot start without. Optional beds/inserts/ambience that are
 * not shipped on Pages must not fail the whole prepare download — Cloudflare
 * SPA fallback returns 200 HTML for those missing paths.
 */
export function isCriticalOfflineAudioPath(manifestPath) {
  const path = String(manifestPath || '')
  if (!path.includes('/rome/audio/')) return false
  if (/\/narration\/w\d+/i.test(path)) return true
  if (/\/narration\/t\d+/i.test(path) && !path.endsWith('/t02.mp3')) return true
  if (path.includes('ui_arrival_chime') || path.includes('ui_waypoint_unlocked')) return true
  return false
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

/** True when the offline package persisted at least some Rome walking-map tiles. */
export function hasCachedRomeMapTiles() {
  const status = readRomeOfflineStatus()
  return (
    status.status === OFFLINE_AUDIO_STATUS.COMPLETE &&
    Number(status.mapTileCount) > 0
  )
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

/**
 * @param {object} manifest
 * @param {{ includeMedia?: boolean | 'stills' }} [options]
 *   After package download use `stills` — blob-URL’ing every reconstruction
 *   video at once has OOM-killed Home Screen WebViews on iOS. Videos hydrate
 *   on demand via {@link hydrateCachedManifestPath}.
 */
export async function hydrateRomeAudioCache(manifest, { includeMedia = 'stills' } = {}) {
  const audioPaths = listRomeAudioManifestPaths(manifest)
  const allMedia = listRomeMediaManifestPaths(manifest)
  const mediaPaths =
    includeMedia === true
      ? allMedia
      : includeMedia === 'stills'
        ? allMedia.filter((path) => !path.endsWith('.mp4'))
        : []
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

/** Hydrate a single cached media/audio path into a blob URL (idempotent). */
export async function hydrateCachedManifestPath(manifestPath, { kind = 'media' } = {}) {
  if (!manifestPath) return null
  const cache = await openRomeAudioCache()

  const candidates = []
  const pushUnique = (value) => {
    if (value && !candidates.includes(value)) candidates.push(value)
  }

  pushUnique(cacheUrlForManifestPath(manifestPath))
  pushUnique(manifestPath)
  try {
    if (/^https?:\/\//i.test(manifestPath)) {
      pushUnique(new URL(manifestPath).pathname)
    }
  } catch {
    // ignore
  }

  let response = null
  let matchedKey = null
  for (const key of candidates) {
    const hit = await cache.match(key)
    if (hit?.ok) {
      response = hit
      matchedKey = key
      break
    }
  }

  // Pathname scan — CDN host / query variants still hit the Rome media cache.
  if (!response?.ok) {
    try {
      const targetPath = new URL(
        /^https?:\/\//i.test(manifestPath)
          ? manifestPath
          : cacheUrlForManifestPath(manifestPath) || manifestPath,
        'https://chronowalk.local',
      ).pathname
      const keys = await cache.keys()
      for (const request of keys) {
        try {
          const keyUrl = new URL(request.url)
          if (keyUrl.pathname !== targetPath) continue
          const hit = await cache.match(request)
          if (hit?.ok) {
            response = hit
            matchedKey = targetPath
            break
          }
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }
  }

  if (!response?.ok) return null
  const blob = await response.blob()
  if (!blob.size) return null
  const blobUrl = URL.createObjectURL(blob)
  const registerPath =
    matchedKey && matchedKey.startsWith('/')
      ? matchedKey
      : (() => {
          try {
            if (/^https?:\/\//i.test(manifestPath)) return new URL(manifestPath).pathname
          } catch {
            // ignore
          }
          return manifestPath
        })()
  if (kind === 'audio') registerCachedAudio(registerPath, blobUrl)
  else registerCachedMedia(registerPath, blobUrl)
  // Also register under the original key so callers with CDN URLs resolve.
  if (registerPath !== manifestPath) {
    if (kind === 'audio') registerCachedAudio(manifestPath, blobUrl)
    else registerCachedMedia(manifestPath, blobUrl)
  }
  return blobUrl
}

const DOWNLOAD_ATTEMPTS = 3
/** Large reconstructions can exceed 45s on cellular even with bars. */
const DOWNLOAD_TIMEOUT_MS = 120_000

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Download aborted', 'AbortError'))
      return
    }
    const timer = setTimeout(resolve, ms)
    const onAbort = () => {
      clearTimeout(timer)
      reject(new DOMException('Download aborted', 'AbortError'))
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

async function fetchWithRetry(url, { signal, attempts = DOWNLOAD_ATTEMPTS } = {}) {
  let lastError = null
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (signal?.aborted) throw new DOMException('Download aborted', 'AbortError')

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS)
    const onOuterAbort = () => controller.abort()
    signal?.addEventListener('abort', onOuterAbort)

    try {
      const response = await fetch(url, { signal: controller.signal })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      return response
    } catch (error) {
      lastError = error
      if (signal?.aborted) {
        throw new DOMException('Download aborted', 'AbortError')
      }
      if (attempt < attempts - 1) {
        await sleep(400 * 2 ** attempt, signal)
      }
    } finally {
      clearTimeout(timeoutId)
      signal?.removeEventListener('abort', onOuterAbort)
    }
  }
  throw lastError ?? new Error('Download failed')
}

async function downloadManifestPaths(paths, { cache, signal, onPathComplete, contentTypeForPath }) {
  const skipped = []

  for (const manifestPath of paths) {
    if (signal?.aborted) throw new DOMException('Download aborted', 'AbortError')

    const sourceUrl = cacheUrlForManifestPath(manifestPath)
    const existing = await cache.match(sourceUrl)
    if (existing?.ok) {
      // Scrub SPA HTML that was previously cached under media URLs.
      if (isHtmlContentType(existing.headers.get('Content-Type'))) {
        await cache.delete(sourceUrl)
      } else {
        const existingBlob = await existing.blob()
        if (existingBlob.size > 0) {
          onPathComplete(manifestPath)
          continue
        }
        await cache.delete(sourceUrl)
      }
    }

    try {
      const response = await fetchWithRetry(sourceUrl, { signal })
      const contentType = response.headers.get('Content-Type') ?? contentTypeForPath(manifestPath)
      if (isHtmlContentType(contentType)) {
        // Missing file on Cloudflare Pages — SPA shell, not media.
        skipped.push(manifestPath)
        onPathComplete(manifestPath)
        continue
      }

      const blob = await response.blob()
      if (!blob.size) {
        throw new Error(`Downloaded empty file for ${manifestPath}`)
      }

      // Sniff tiny HTML shells that omitted Content-Type.
      if (blob.size < 24_000) {
        const head = await blob.slice(0, 64).text()
        if (/<!doctype html|<html[\s>]/i.test(head)) {
          skipped.push(manifestPath)
          onPathComplete(manifestPath)
          continue
        }
      }

      await cache.put(
        sourceUrl,
        new Response(blob, {
          status: 200,
          headers: { 'Content-Type': contentType },
        }),
      )
      onPathComplete(manifestPath)
    } catch (error) {
      if (error?.name === 'AbortError' || signal?.aborted) throw error
      if (isCriticalOfflineAudioPath(manifestPath)) {
        throw error
      }
      console.warn('[offline] Skipping unavailable optional asset:', manifestPath, error)
      skipped.push(manifestPath)
      onPathComplete(manifestPath)
    }
  }

  return skipped
}

export async function downloadRomeAudioPackage(manifest, { onProgress, signal } = {}) {
  const audioPaths = listRomeAudioManifestPaths(manifest)
  const mediaPaths = listRomeMediaManifestPaths(manifest)
  const mapEstimate = estimateRomeMapTileDownload(manifest)
  // Prepare ring tracks stories only — map tiles continue in the background.
  const storiesTotal = Math.max(1, audioPaths.length + mediaPaths.length)
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
        total: storiesTotal,
        percent: clampPercent((completed / storiesTotal) * 100),
        currentPath,
      })
    }

    const onPathComplete = (manifestPath) => {
      completed += 1
      reportProgress(manifestPath)
    }

    const skippedAudio = await downloadManifestPaths(audioPaths, {
      cache,
      signal,
      onPathComplete,
      contentTypeForPath: () => 'audio/mpeg',
    })

    const skippedMedia = await downloadManifestPaths(mediaPaths, {
      cache,
      signal,
      onPathComplete,
      contentTypeForPath: mediaContentType,
    })

    const packageVerification = await verifyRomeAudioPackage(manifest)
    const criticalMissing = (packageVerification.missing ?? []).filter(isCriticalOfflineAudioPath)
    const criticalDuration = (packageVerification.durationMismatches ?? []).filter((entry) =>
      isCriticalOfflineAudioPath(entry.path),
    )
    if (criticalMissing.length > 0) {
      throw new Error(
        `Offline verification failed (${criticalMissing.length} essential story files missing).`,
      )
    }
    if (criticalDuration.length > 0) {
      const durationIssue = criticalDuration[0]
      throw new Error(
        `Offline duration check failed for ${durationIssue.path} (${durationIssue.blobSize} bytes, expected ≥${durationIssue.minimumBytes}).`,
      )
    }
    if (skippedAudio.length || skippedMedia.length) {
      console.warn(
        '[offline] Skipped unavailable optional assets:',
        skippedAudio.length + skippedMedia.length,
      )
    }

    // Stills only — full video blob hydration has killed iOS Home Screen WebViews.
    await hydrateRomeAudioCache(manifest, { includeMedia: 'stills' })

    // Mark stories ready immediately so the prepare UI does not collapse while
    // map tiles (optional, often flaky on cellular) are still fetching.
    const downloadedAt = Date.now()
    writeRomeOfflineStatus({
      status: OFFLINE_AUDIO_STATUS.COMPLETE,
      fileCount: audioPaths.length - skippedAudio.length,
      mediaFileCount: mediaPaths.length - skippedMedia.length,
      mapTileCount: 0,
      downloadedAt,
      error: null,
      skippedOptional: skippedAudio.length + skippedMedia.length,
    })
    completed = storiesTotal
    onProgress?.({
      completed: storiesTotal,
      total: storiesTotal,
      percent: 100,
      currentPath: 'stories-ready',
    })

    let mapVerification = { valid: true, skipped: true, total: 0, missing: [] }
    if (env.mapboxToken && mapEstimate.tileCount > 0) {
      try {
        await downloadRomeMapTiles(manifest, {
          signal,
          token: env.mapboxToken,
          onProgress: ({ currentPath }) => {
            onProgress?.({
              completed: storiesTotal,
              total: storiesTotal,
              percent: 100,
              currentPath,
            })
          },
        })
        mapVerification = await verifyRomeMapTiles(manifest, { token: env.mapboxToken })
        writeRomeOfflineStatus({
          status: OFFLINE_AUDIO_STATUS.COMPLETE,
          fileCount: audioPaths.length - skippedAudio.length,
          mediaFileCount: mediaPaths.length - skippedMedia.length,
          mapTileCount: mapVerification.total,
          downloadedAt,
          error: mapVerification.valid || mapVerification.skipped ? null : 'map_tiles_partial',
          skippedOptional: skippedAudio.length + skippedMedia.length,
        })
      } catch (mapError) {
        console.warn('[offline] Map tile download incomplete:', mapError)
        mapVerification = {
          valid: false,
          skipped: false,
          total: mapEstimate.tileCount,
          missing: ['map-tiles'],
          error: mapError?.message ?? 'map_tiles_failed',
        }
        writeRomeOfflineStatus({
          status: OFFLINE_AUDIO_STATUS.COMPLETE,
          fileCount: audioPaths.length - skippedAudio.length,
          mediaFileCount: mediaPaths.length - skippedMedia.length,
          mapTileCount: 0,
          downloadedAt,
          error: 'map_tiles_partial',
          skippedOptional: skippedAudio.length + skippedMedia.length,
        })
      }
    }

    return {
      status: OFFLINE_AUDIO_STATUS.COMPLETE,
      fileCount: audioPaths.length - skippedAudio.length,
      mediaFileCount: mediaPaths.length - skippedMedia.length,
      mapTileCount: mapVerification.total ?? 0,
      downloadedAt,
      verification: packageVerification,
      mapVerification,
      skippedAudio,
      skippedMedia,
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
  // Optional beds/inserts may be absent from Pages (SPA HTML). Only essential
  // story narration + arrival cues must be present for "ready".
  const criticalMissing = (verification.missing ?? []).filter(isCriticalOfflineAudioPath)
  const criticalDuration = (verification.durationMismatches ?? []).filter((entry) =>
    isCriticalOfflineAudioPath(entry.path),
  )
  return criticalMissing.length === 0 && criticalDuration.length === 0
}
