import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { listMessageKeys, missingMessageKeys, t } from '../t.js'
import { LOCALES } from '../locales.js'
import { setActiveLocale } from '../activeLocale.js'
import {
  assertHeroStopAudioMapComplete,
  HERO_STOP_AUDIO,
  HERO_STOP_IDS,
  heroStopSpanishNarrationPath,
  listHeroStopSpanishAudioPaths,
  localeAudioFilePath,
  PANTHEON_AUDIO_FILES,
} from '../audio/heroStopAudioMap.js'
import { applyLocaleOverlay } from '../content/applyLocaleOverlay.js'
import { narrationPath } from '../../content/audioPaths.js'
import { clearRomeManifestCache, loadRomeManifest } from '../../content/manifest.js'
import rawManifest from '../../content/rome/manifest.json'

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..')

describe('i18n coverage', () => {
  it('keeps Spanish message keys complete vs English', () => {
    expect(listMessageKeys(LOCALES.EN).length).toBeGreaterThan(40)
    expect(missingMessageKeys(LOCALES.ES)).toEqual([])
  })

  it('maps all 21 hero stops to deterministic Spanish narration paths', () => {
    expect(HERO_STOP_IDS).toHaveLength(21)
    expect(assertHeroStopAudioMapComplete().ok).toBe(true)

    const paths = listHeroStopSpanishAudioPaths()
    expect(paths.every((path) => path.startsWith('/rome/audio/es/narration/'))).toBe(true)
    expect(new Set(paths).size).toBe(paths.length)

    for (const id of HERO_STOP_IDS) {
      const primary = HERO_STOP_AUDIO[id].primary
      expect(heroStopSpanishNarrationPath(id)).toBe(`/rome/audio/es/narration/${primary}`)
    }

    for (const file of PANTHEON_AUDIO_FILES) {
      expect(paths).toContain(`/rome/audio/es/narration/${file}`)
    }
  })

  it('keeps English narration paths unchanged', () => {
    setActiveLocale(LOCALES.EN)
    expect(narrationPath('w17_ch1.mp3')).toBe('/rome/audio/narration/w17_ch1.mp3')
    expect(localeAudioFilePath(LOCALES.EN, 'narration', 'w01.mp3')).toBe(
      '/rome/audio/narration/w01.mp3',
    )
  })

  it('prefixes Spanish narration paths while leaving beds/system unprefixed', () => {
    setActiveLocale(LOCALES.ES)
    expect(narrationPath('w17_ch1.mp3')).toBe('/rome/audio/es/narration/w17_ch1.mp3')
    setActiveLocale(LOCALES.EN)
  })

  it('applies Spanish overlay so Pantheon and hero stops are not mixed-language', () => {
    const localized = applyLocaleOverlay(rawManifest, LOCALES.ES)
    expect(localized.waypoints.w17.title).toMatch(/Panteón/i)
    expect(localized.waypoints.w17.chapters[0].transcript).toMatch(/plaza|fuente|obelisco/i)
    expect(localized.waypoints.w23.chapters).toHaveLength(3)
    expect(localized.waypoints.w23.chapters.every((c) => c.transcript.length > 80)).toBe(true)
    expect(localized.transits.t05.title).toMatch(/quedó|quedo/i)
    expect(localized.transits.t05.transcript.length).toBeGreaterThan(40)
    expect(localized.system.no_ticket_meta?.[0]?.transcript.length).toBeGreaterThan(80)
    expect(localized.waypoints.w17.reconstruction?.caption).toMatch(/evidencias|conjetura/i)

    for (const id of HERO_STOP_IDS) {
      expect(localized.waypoints[id].title).toBeTruthy()
      expect(localized.waypoints[id].approachLine).toBeTruthy()
      expect(localized.waypoints[id].arrivalLine).toBeTruthy()
    }
  })

  it('loads locale-aware manifests through loadRomeManifest()', () => {
    clearRomeManifestCache()
    setActiveLocale(LOCALES.ES)
    const es = loadRomeManifest()
    expect(es.waypointsById.w17.title).toMatch(/Panteón/i)

    clearRomeManifestCache()
    setActiveLocale(LOCALES.EN)
    const en = loadRomeManifest()
    expect(en.waypointsById.w17.title).toBe('The Pantheon')
  })

  it('translates core UI helpers', () => {
    setActiveLocale(LOCALES.ES)
    expect(t('shell.tab.walk')).toBe('Caminar')
    expect(t('pantheon.free.h1')).toMatch(/Panteón/i)
    setActiveLocale(LOCALES.EN)
    expect(t('shell.tab.walk')).toBe('Walk')
  })

  it('documents expected Spanish audio tree for ops', () => {
    const readme = join(root, 'public/rome/audio/es/README.md')
    expect(existsSync(readme)).toBe(true)
    const text = readFileSync(readme, 'utf8')
    expect(text).toMatch(/w17_ch1\.mp3/)
    expect(text).toMatch(/21/)
  })
})
