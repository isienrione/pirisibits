#!/usr/bin/env node
/**
 * Automated EN/ES coverage checks for ChronoWalk localization.
 *
 * Usage:
 *   npm run check:i18n
 *   npm run check:i18n -- --require-audio-files
 *
 * --require-audio-files hard-fails on every shipping Spanish narration asset
 * expected by collectManifestAudioPaths(manifest, 'es') (currently 52 files),
 * not only the 28 hero-stop chapters.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
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
import { collectManifestAudioPaths } from '../src/content/audioPaths.js'
import { parseRomeManifest } from '../src/content/romeManifestZod.schema.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const requireAudioFiles = process.argv.includes('--require-audio-files')

function fail(message, items = []) {
  console.error(`✗ ${message}`)
  for (const item of items) console.error(`  - ${item}`)
  process.exitCode = 1
}

function listScriptFiles(dir) {
  if (!existsSync(dir)) return []
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...listScriptFiles(full))
    else if (entry.isFile() && entry.name.endsWith('.md')) out.push(full)
  }
  return out
}

async function main() {
  process.exitCode = 0

  const enKeys = listMessageKeys(LOCALES.EN)
  const esKeys = listMessageKeys(LOCALES.ES)
  const missingEs = missingMessageKeys(LOCALES.ES)
  const orphanEs = esKeys.filter((key) => !enKeys.includes(key))
  if (missingEs.length) {
    fail(`Spanish message catalog missing ${missingEs.length} key(s)`, missingEs)
  } else {
    console.log(`✓ Message keys: ${enKeys.length} EN keys covered in ES`)
  }
  if (orphanEs.length) {
    fail(`Spanish catalog has ${orphanEs.length} orphan key(s) not in EN`, orphanEs)
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

  for (const name of ['transits.json', 'system.json', 'acts.json', 'reflections.json']) {
    const path = join(root, 'src/i18n/content/es', name)
    if (!existsSync(path)) fail(`Missing Spanish overlay file`, [path])
  }
  const transits = JSON.parse(readFileSync(join(root, 'src/i18n/content/es/transits.json'), 'utf8'))
  if (Object.keys(transits).length < 10) {
    fail('Spanish transit overlay looks too thin', [String(Object.keys(transits).length)])
  } else {
    console.log(`✓ Transit overlay present (${Object.keys(transits).length} transit ids)`)
  }

  const raw = JSON.parse(readFileSync(join(root, 'src/content/rome/manifest.json'), 'utf8'))
  const manifest = parseRomeManifest(raw)
  const esNarrationPaths = collectManifestAudioPaths(manifest, LOCALES.ES).filter((path) =>
    path.startsWith('/rome/audio/es/narration/'),
  )
  const heroPaths = listHeroStopSpanishAudioPaths()
  console.log(
    `✓ Expected Spanish narration assets: ${esNarrationPaths.length} shipping / ${heroPaths.length} hero-stop chapters`,
  )

  const scriptsDir = join(root, 'docs/spanish-audio/scripts')
  const scriptFiles = listScriptFiles(scriptsDir)
  const scriptBasenames = new Set(
    scriptFiles.map((file) => file.split('/').pop().replace(/\.md$/, '') + '.mp3'),
  )
  const missingScripts = esNarrationPaths
    .map((path) => path.split('/').pop())
    .filter((file) => !scriptBasenames.has(file))
  if (missingScripts.length) {
    fail(`ElevenLabs package missing ${missingScripts.length} script(s)`, missingScripts)
  } else {
    console.log(`✓ ElevenLabs scripts present for all ${esNarrationPaths.length} narration assets`)
  }

  for (const required of [
    'docs/spanish-audio/00_READ_ME_FIRST.md',
    'docs/spanish-audio/01_MASTER_AUDIO_MANIFEST.md',
    'docs/spanish-audio/02_PRONUNCIATION_GUIDE.md',
    'docs/i18n/SPANISH_STYLE_GUIDE.md',
  ]) {
    if (!existsSync(join(root, required))) fail('Missing Spanish production doc', [required])
  }

  const missingFiles = esNarrationPaths.filter(
    (path) => !existsSync(join(root, 'public', path.replace(/^\//, ''))),
  )
  const zeroByte = esNarrationPaths.filter((path) => {
    const full = join(root, 'public', path.replace(/^\//, ''))
    if (!existsSync(full)) return false
    try {
      return statSync(full).size === 0
    } catch {
      return false
    }
  })

  if (requireAudioFiles) {
    if (missingFiles.length) {
      fail(
        `${missingFiles.length} Spanish narration MP3(s) missing under public/ (shipping set)`,
        missingFiles,
      )
    } else {
      console.log(`✓ Spanish audio files present (${esNarrationPaths.length} narration assets)`)
    }
    if (zeroByte.length) {
      fail(`${zeroByte.length} Spanish narration MP3(s) are zero-byte`, zeroByte)
    }
  } else if (missingFiles.length) {
    console.log(
      `⚠ ${missingFiles.length}/${esNarrationPaths.length} Spanish narration MP3s not on disk yet (map + scripts ready; use --require-audio-files for hard fail)`,
    )
  } else {
    console.log(`✓ Spanish audio files present (${esNarrationPaths.length} narration assets)`)
  }

  // Also surface hero-only count for operators who track the 28-file hero map.
  const missingHero = heroPaths.filter(
    (path) => !existsSync(join(root, 'public', path.replace(/^\//, ''))),
  )
  if (!requireAudioFiles && missingHero.length) {
    console.log(`⚠ Hero-stop subset still missing on disk: ${missingHero.length}/28`)
  }

  if (process.exitCode) {
    console.error('\ncheck:i18n failed')
    process.exit(process.exitCode)
  }

  console.log('\n✓ check:i18n passed')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
