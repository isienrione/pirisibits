import { mediaUrl } from '../lib/mediaUrl'
import {
  AUDIO_CATEGORIES,
  audioFilePath,
  bedPath,
  insertPath,
  narrationPath,
  systemPath,
} from '../content/audioPaths.js'

const blobCache = new Map()

/**
 * Register a cached blob URL for offline playback (Prompt C hook).
 * @param {string} manifestPath e.g. /rome/audio/narration/w01.mp3
 * @param {string} blobUrl
 */
export function registerCachedAudio(manifestPath, blobUrl) {
  if (manifestPath && blobUrl) blobCache.set(manifestPath, blobUrl)
}

export function clearCachedAudio() {
  blobCache.clear()
}

export function getAudioUrl(manifestPath) {
  if (!manifestPath) return null
  if (blobCache.has(manifestPath)) return blobCache.get(manifestPath)
  return mediaUrl(manifestPath)
}

export function resolveNarrationUrl(filename) {
  return getAudioUrl(narrationPath(filename))
}

export function resolveBedUrl(zone, beds) {
  const file = beds?.[zone]
  return file ? getAudioUrl(bedPath(file)) : null
}

export function resolveInsertUrl(filename) {
  return getAudioUrl(insertPath(filename))
}

export function resolveSystemUrl(filename) {
  return getAudioUrl(systemPath(filename))
}

export function resolvePlanItemUrl(item) {
  if (!item?.file) return null
  const category = item.category ?? AUDIO_CATEGORIES.NARRATION
  return getAudioUrl(audioFilePath(category, item.file))
}
