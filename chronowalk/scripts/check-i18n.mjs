#!/usr/bin/env node
/**
 * Automated EN/ES coverage checks for ChronoWalk localization.
 *
 * Usage:
 *   npm run check:i18n
 *   npm run check:i18n -- --require-audio-files
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { missingMessageKeys, listMessageKeys } from '../src/i18n/t.js'
import {
  assertHeroStopAudioMapComplete,
  HERO_STOP_AUDIO,
  HERO_STOP_IDS,
  listHeroStopSpanishAudioPaths,
  PANTHEON_AUDIO_FILES,
  PANTHEON_STOP_IDS,
} from '../src/i18n/audio/heroStopAudioMap.js'
import { LOCALES } from '../src/i18n/locales.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const requireAudioFiles = process.argv.includes('--require-audio-files')

function fail(message, items = []) {
  console.error(`✗ ${message}`)
  for (const item of items) console.error(`  - ${item}`)
  process.exitCode = 1
}

function main() {
  process.exitCode = 0

  const enKeys = listMessageKeys(LOCALES.EN)
  const missingEs = missingMessageKeys(LOCALES.ES)
  if (missingEs.length) {
    fail(`Spanish message catalog missing ${missingEs.length} key(s)`, missingEs)
  } else {
    console.log(`✓ Message keys: ${enKeys.length} EN keys covered in ES`)
  }

  const mapStatus = assertHeroStopAudioMapComplete()
  if (!mapStatus.ok) {
    fail('Hero-stop Spanish audio map incomplete', [
      ...mapStatus.missingIds.map((id) => `missing id ${id}`),
      ...mapStatus.bad,
    ])
  } else if (HERO_STOP_IDS.length !== 21) {
    fail(`Expected 21 hero stops, found ${HERO_STOP_IDS.length}`)
  } else {
    console.log(`✓ Hero-stop audio map: ${HERO_STOP_IDS.length} stops, deterministic ES paths`)
  }

  const overlayPath = join(root, 'src/i18n/content/es/waypoints.json')
  const overlay = JSON.parse(readFileSync(overlayPath, 'utf8'))
  const missingOverlay = HERO_STOP_IDS.filter((id) => !overlay[id]?.title)
  if (missingOverlay.length) {
    fail('Spanish waypoint overlay missing hero stops', missingOverlay)
  }

  const pantheonGaps = []
  for (const id of PANTHEON_STOP_IDS) {
    const stop = overlay[id]
    if (!stop) {
      pantheonGaps.push(`${id}: missing overlay`)
      continue
    }
    const expected = HERO_STOP_AUDIO[id].chapters
    for (const file of expected) {
      const chapter = (stop.chapters || []).find((c) => c.file === file)
      if (!chapter?.transcript || chapter.transcript.length < 80) {
        pantheonGaps.push(`${id}/${file}: missing Spanish transcript`)
      }
      if (!chapter?.title) pantheonGaps.push(`${id}/${file}: missing Spanish title`)
    }
  }
  if (pantheonGaps.length) {
    fail('Pantheon Spanish content incomplete', pantheonGaps)
  } else {
    console.log(`✓ Pantheon fully localized (${PANTHEON_AUDIO_FILES.join(', ')})`)
  }

  const chapterGaps = []
  for (const id of HERO_STOP_IDS) {
    const stop = overlay[id]
    const expected = HERO_STOP_AUDIO[id].chapters
    for (const file of expected) {
      const chapter = (stop.chapters || []).find((c) => c.file === file)
      if (!chapter?.transcript || chapter.transcript.length < 40) {
        chapterGaps.push(`${id}/${file}`)
      }
    }
    if (!stop.approachLine || !stop.arrivalLine) {
      chapterGaps.push(`${id}: approach/arrival`)
    }
  }
  if (chapterGaps.length) {
    fail('Spanish hero-stop chapter coverage gaps', chapterGaps)
  } else {
    console.log('✓ All 21 hero stops have Spanish titles, lines, and chapter transcripts')
  }

  const esPaths = listHeroStopSpanishAudioPaths()
  const missingFiles = esPaths.filter((path) => !existsSync(join(root, 'public', path.replace(/^\//, ''))))
  if (requireAudioFiles) {
    if (missingFiles.length) {
      fail(
        `${missingFiles.length} Spanish hero-stop audio file(s) missing under public/`,
        missingFiles,
      )
    } else {
      console.log(`✓ Spanish audio files present (${esPaths.length} narration assets)`)
    }
  } else if (missingFiles.length) {
    console.log(
      `⚠ ${missingFiles.length}/${esPaths.length} Spanish audio files not on disk yet (map is ready; use --require-audio-files for hard fail)`,
    )
  } else {
    console.log(`✓ Spanish audio files present (${esPaths.length} narration assets)`)
  }

  if (process.exitCode) {
    console.error('\ncheck:i18n failed')
    process.exit(process.exitCode)
  }

  console.log('\n✓ check:i18n passed')
}

main()
