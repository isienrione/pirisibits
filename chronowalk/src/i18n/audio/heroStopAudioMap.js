/**
 * Deterministic map: 21 hero stops → Spanish narration asset paths.
 *
 * Convention (locale ≠ en):
 *   /rome/audio/{locale}/{category}/{filename}
 * English keeps the legacy unprefixed tree:
 *   /rome/audio/{category}/{filename}
 *
 * Filenames match the English masters so production can drop Spanish takes
 * into public/rome/audio/es/narration/ (or the CDN mirror) without renames.
 */

import { LOCALES } from '../locales.js'

const ROME_AUDIO_ROOT = '/rome/audio'
const NARRATION = 'narration'

/** Ordered product hero stops (excludes scripted Forum rest `pause`). */
export const HERO_STOP_IDS = Object.freeze([
  'w01',
  'w02',
  'w03',
  'w04',
  'w06',
  'w07',
  'w08',
  'w10',
  'w11_12',
  'w13',
  'w14',
  'w15',
  'w16',
  'w17',
  'w23',
  'w18',
  'w19',
  'w20',
  'w21',
  'enc_circus',
  'w22',
])

/**
 * Primary + chapter narration files per hero stop (English filename keys).
 * `primary` is the first chapter used for previews / coverage checks.
 */
export const HERO_STOP_AUDIO = Object.freeze({
  w01: { primary: 'w01.mp3', chapters: ['w01.mp3'] },
  w02: { primary: 'w02_ch1.mp3', chapters: ['w02_ch1.mp3', 'w02_ch2.mp3'] },
  w03: { primary: 'w03_ch1.mp3', chapters: ['w03_ch1.mp3', 'w03_ch2.mp3'] },
  w04: {
    primary: 'w04_ch1.mp3',
    chapters: ['w04_ch1.mp3', 'w04_ch2.mp3', 'forum_intro_above.mp3'],
  },
  w06: { primary: 'w06.mp3', chapters: ['w06.mp3'] },
  w07: { primary: 'w07.mp3', chapters: ['w07.mp3'] },
  w08: { primary: 'w08.mp3', chapters: ['w08.mp3'] },
  w10: { primary: 'w10.mp3', chapters: ['w10.mp3'] },
  w11_12: { primary: 'w1112_b1.mp3', chapters: ['w1112_b1.mp3', 'w1112_b2.mp3'] },
  w13: { primary: 'w13.mp3', chapters: ['w13.mp3'] },
  w14: { primary: 'w14.mp3', chapters: ['w14.mp3'] },
  w15: { primary: 'w15.mp3', chapters: ['w15.mp3'] },
  w16: { primary: 'w16.mp3', chapters: ['w16.mp3'] },
  w17: { primary: 'w17_ch1.mp3', chapters: ['w17_ch1.mp3'] },
  w23: {
    primary: 'w17_ch2.mp3',
    chapters: ['w17_ch2.mp3', 'w17_ch3.mp3', 'w17_ch4.mp3'],
  },
  w18: { primary: 'w18.mp3', chapters: ['w18.mp3'] },
  w19: { primary: 'w19.mp3', chapters: ['w19.mp3'] },
  w20: { primary: 'w20.mp3', chapters: ['w20.mp3'] },
  w21: { primary: 'w21.mp3', chapters: ['w21.mp3'] },
  enc_circus: { primary: 'enc_circus.mp3', chapters: ['enc_circus.mp3'] },
  w22: { primary: 'w22.mp3', chapters: ['w22.mp3'] },
})

export const PANTHEON_STOP_IDS = Object.freeze(['w17', 'w23'])

export const PANTHEON_AUDIO_FILES = Object.freeze([
  'w17_ch1.mp3',
  'w17_ch2.mp3',
  'w17_ch3.mp3',
  'w17_ch4.mp3',
])

/** Locale-aware path for a category + filename. English keeps legacy paths. */
export function localeAudioFilePath(locale, category, filename) {
  if (!filename) return null
  const clean = String(filename).replace(/^\//, '')
  const cat = category || NARRATION
  if (!locale || locale === LOCALES.EN) {
    return `${ROME_AUDIO_ROOT}/${cat}/${clean}`
  }
  return `${ROME_AUDIO_ROOT}/${locale}/${cat}/${clean}`
}

export function heroStopSpanishNarrationPath(waypointId, filename) {
  const file = filename || HERO_STOP_AUDIO[waypointId]?.primary
  return localeAudioFilePath(LOCALES.ES, NARRATION, file)
}

/** Flat list of every Spanish hero-stop narration path (deterministic order). */
export function listHeroStopSpanishAudioPaths() {
  const paths = []
  for (const id of HERO_STOP_IDS) {
    const entry = HERO_STOP_AUDIO[id]
    for (const file of entry.chapters) {
      paths.push(heroStopSpanishNarrationPath(id, file))
    }
  }
  return paths
}

export function assertHeroStopAudioMapComplete() {
  const missingIds = HERO_STOP_IDS.filter((id) => !HERO_STOP_AUDIO[id]?.primary)
  const bad = []
  for (const id of HERO_STOP_IDS) {
    const entry = HERO_STOP_AUDIO[id]
    if (!entry?.chapters?.length) bad.push(`${id}: no chapters`)
    else if (!entry.chapters.includes(entry.primary)) bad.push(`${id}: primary not in chapters`)
  }
  return { missingIds, bad, ok: missingIds.length === 0 && bad.length === 0 }
}
