/** Audio file path resolution for Rome tour content on R2. */

import { chapterFile } from './chapterMeta.js'
import { collectThresholdAmbiencePaths } from './thresholdAmbience.js'
import { getActiveLocale } from '../i18n/activeLocale.js'
import { DEFAULT_LOCALE, LOCALES } from '../i18n/locales.js'
import { localeAudioFilePath } from '../i18n/audio/heroStopAudioMap.js'

export const ROME_AUDIO_ROOT = '/rome/audio'

export const AUDIO_CATEGORIES = {
  NARRATION: 'narration',
  BEDS: 'beds',
  INSERTS: 'inserts',
  SYSTEM: 'system',
}

/**
 * Spoken system UI cues that fork by locale (same filename as English masters).
 * Instrumental / non-verbal cues (e.g. arrival chime) stay language-neutral.
 */
export const LOCALIZED_SYSTEM_FILES = Object.freeze([
  'ui_waypoint_unlocked.mp3',
])

function usesLocaleAudioTree(category, filename, locale) {
  if (!locale || locale === LOCALES.EN || locale === DEFAULT_LOCALE) return false
  if (category === AUDIO_CATEGORIES.NARRATION) return true
  if (category === AUDIO_CATEGORIES.SYSTEM && LOCALIZED_SYSTEM_FILES.includes(filename)) {
    return true
  }
  return false
}

/**
 * Resolve a category/filename to a locale-aware public path.
 * English keeps `/rome/audio/{category}/{file}`; other locales use
 * `/rome/audio/{locale}/{category}/{file}` for narration and spoken system cues.
 */
export function audioFilePath(category, filename, locale = getActiveLocale()) {
  if (!filename) return null
  const clean = filename.replace(/^\//, '')
  if (!usesLocaleAudioTree(category, clean, locale)) {
    return `${ROME_AUDIO_ROOT}/${category}/${clean}`
  }
  return localeAudioFilePath(locale, category, clean)
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
 * @param {string} [locale]
 */
export function collectManifestAudioPaths(manifest, locale = getActiveLocale()) {
  const paths = new Set()

  const add = (category, file) => {
    const path = audioFilePath(category, file, locale)
    if (path) paths.add(path)
  }

  for (const waypoint of Object.values(manifest.waypoints)) {
    for (const chapter of waypoint.chapters) add(AUDIO_CATEGORIES.NARRATION, chapterFile(chapter))
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

  for (const path of collectThresholdAmbiencePaths(manifest)) {
    paths.add(path)
  }

  return [...paths].sort()
}
