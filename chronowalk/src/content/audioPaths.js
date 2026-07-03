/** Audio file path resolution for Rome tour content on R2. */

export const ROME_AUDIO_ROOT = '/rome/audio'

export const AUDIO_CATEGORIES = {
  NARRATION: 'narration',
  BEDS: 'beds',
  INSERTS: 'inserts',
  SYSTEM: 'system',
}

export function audioFilePath(category, filename) {
  if (!filename) return null
  const clean = filename.replace(/^\//, '')
  return `${ROME_AUDIO_ROOT}/${category}/${clean}`
}

export function narrationPath(filename) {
  return audioFilePath(AUDIO_CATEGORIES.NARRATION, filename)
}

export function bedPath(filename) {
  return audioFilePath(AUDIO_CATEGORIES.BEDS, filename)
}

export function insertPath(filename) {
  return audioFilePath(AUDIO_CATEGORIES.INSERTS, filename)
}

export function systemPath(filename) {
  return audioFilePath(AUDIO_CATEGORIES.SYSTEM, filename)
}

/**
 * Collect every shipping audio path referenced by the manifest.
 * @param {import('./manifest.schema.js').romeManifestSchema['_output']} manifest
 */
export function collectManifestAudioPaths(manifest) {
  const paths = new Set()

  const add = (category, file) => {
    const path = audioFilePath(category, file)
    if (path) paths.add(path)
  }

  for (const waypoint of Object.values(manifest.waypoints)) {
    for (const chapter of waypoint.chapters) add(AUDIO_CATEGORIES.NARRATION, chapter)
    for (const outro of Object.values(waypoint.outro_variants ?? {})) add(AUDIO_CATEGORIES.NARRATION, outro)
  }

  for (const transit of Object.values(manifest.transits)) {
    if (transit.audio) add(AUDIO_CATEGORIES.NARRATION, transit.audio)
    for (const variant of Object.values(transit.variants ?? {})) add(AUDIO_CATEGORIES.NARRATION, variant)
  }

  for (const insert of Object.values(manifest.inserts)) {
    add(AUDIO_CATEGORIES.INSERTS, insert.audio)
  }

  for (const bed of Object.values(manifest.beds)) {
    add(AUDIO_CATEGORIES.BEDS, bed)
  }

  add(AUDIO_CATEGORIES.SYSTEM, manifest.system.presence)
  add(AUDIO_CATEGORIES.SYSTEM, manifest.system.longwalk)
  for (const file of manifest.system.no_ticket) add(AUDIO_CATEGORIES.NARRATION, file)
  for (const file of Object.values(manifest.system.ui)) add(AUDIO_CATEGORIES.SYSTEM, file)
  if (manifest.system.preview) add(AUDIO_CATEGORIES.NARRATION, manifest.system.preview)
  for (const file of Object.values(manifest.system.resume ?? {})) {
    add(AUDIO_CATEGORIES.NARRATION, file)
  }

  return [...paths].sort()
}
