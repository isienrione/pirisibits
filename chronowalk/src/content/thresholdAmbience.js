import { mediaUrl } from '../lib/mediaUrl.js'

/**
 * Resolve press-and-hold threshold crossfade ambience from the manifest.
 * @param {import('./manifest.schema.js').romeManifestSchema['_output']} manifest
 */
export function resolveThresholdAmbienceUrls(manifest) {
  const files = manifest?.system?.threshold_ambience
  if (!files?.now || !files?.then) {
    return { nowAmbienceUrl: null, thenSoundscapeUrl: null }
  }

  return {
    nowAmbienceUrl: mediaUrl(thresholdAmbiencePath(files.now)),
    thenSoundscapeUrl: mediaUrl(thresholdAmbiencePath(files.then)),
  }
}

export function thresholdAmbiencePath(filename) {
  if (!filename) return null
  const clean = filename.replace(/^\//, '')
  if (clean.startsWith('rome/audio/')) return `/${clean}`
  return `/rome/audio/${clean}`
}

export function collectThresholdAmbiencePaths(manifest) {
  const files = manifest?.system?.threshold_ambience
  if (!files) return []

  return [files.now, files.then]
    .map((file) => thresholdAmbiencePath(file))
    .filter(Boolean)
    .sort()
}
