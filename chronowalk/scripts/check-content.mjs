#!/usr/bin/env node
/**
 * Validate city package + Rome live manifest schema and HEAD-check audio on R2.
 *
 * Usage:
 *   npm run check:content
 *   npm run check:content -- --skip-remote
 *   npm run check:content -- --require-full-durations
 *
 * Env: VITE_MEDIA_BASE (required unless --skip-remote)
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { collectManifestAudioPaths } from '../src/content/audioPaths.js'
import { collectManifestMediaPaths } from '../src/content/mediaPaths.js'
import { audioKeyFromManifestPath } from '../src/content/durationVerification.js'
import { durationCoverage } from '../src/content/durationManifest.js'
import { parseRomeManifest } from '../src/content/romeManifestZod.schema.js'
import { loadCityPackage, validateCity } from '../src/content/cityPackage/node.js'
import { assertMediaHostResolvable, getMediaBase, loadEnvLocal, printMediaHostHelp } from './mediaBaseEnv.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const manifestPath = join(__dirname, '../src/content/rome/manifest.json')
const skipRemote = process.argv.includes('--skip-remote')
const requireFullDurations = process.argv.includes('--require-full-durations')

async function headCheck(url) {
  const response = await fetch(url, { method: 'HEAD' })
  return response.ok
}

async function main() {
  loadEnvLocal()

  const romePackage = loadCityPackage('rome')
  const cityValidation = validateCity(romePackage)
  if (!cityValidation.ok) {
    console.error('✗ Rome city package validation failed:\n')
    for (const issue of cityValidation.issues.filter((i) => i.severity === 'error')) {
      console.error(`  - [${issue.code}] ${issue.message}`)
    }
    process.exit(1)
  }
  console.log('✓ Rome city package valid (src/content/cities/rome/)')

  const raw = JSON.parse(readFileSync(manifestPath, 'utf8'))
  const manifest = parseRomeManifest(raw)
  const audioPaths = collectManifestAudioPaths(manifest)
  const mediaPaths = collectManifestMediaPaths(manifest)
  const durationEntries = Object.entries(manifest.durations ?? {})

  console.log(
    `✓ Manifest schema valid (${audioPaths.length} audio files, ${mediaPaths.length} visual assets referenced)`
  )

  if (durationEntries.length) {
    const audioKeys = new Set(audioPaths.map((path) => audioKeyFromManifestPath(path)))
    const unknownDurationKeys = durationEntries
      .map(([key]) => key)
      .filter((key) => !audioKeys.has(key) && !audioPaths.includes(key))

    if (unknownDurationKeys.length) {
      console.error('✗ durations references unknown audio files:\n')
      for (const key of unknownDurationKeys) console.error(`  - ${key}`)
      process.exit(1)
    }

    console.log(`✓ durations map covers ${durationEntries.length} known audio files`)

    const coverage = durationCoverage(manifest, audioPaths)
    if (coverage.covered < coverage.total) {
      const message = `  (${coverage.covered}/${coverage.total} shipping files have durations — run npm run measure:durations for full map)`
      if (requireFullDurations) {
        console.error(`✗ durations incomplete (${coverage.covered}/${coverage.total}):\n`)
        for (const key of coverage.missing) console.error(`  - ${key}`)
        process.exit(1)
      }
      console.log(message)
    } else if (requireFullDurations) {
      console.log(`✓ durations map covers all ${coverage.total} shipping audio files`)
    }
  } else if (requireFullDurations) {
    console.error('✗ durations map is missing from manifest')
    process.exit(1)
  }

  if (skipRemote) {
    console.log('✓ Skipping remote HEAD checks (--skip-remote)')
    return
  }

  const base = getMediaBase()
  if (!base) {
    console.error('✗ VITE_MEDIA_BASE is not set. Use --skip-remote to validate schema only.')
    process.exit(1)
  }

  await assertMediaHostResolvable(base)

  const missing = []
  const checked = []

  for (const path of [...audioPaths, ...mediaPaths]) {
    const url = `${base}${path}`
    checked.push(url)
    const ok = await headCheck(url)
    if (!ok) missing.push(url)
  }

  if (missing.length) {
    console.error(`✗ ${missing.length} of ${checked.length} files missing on R2:\n`)
    for (const url of missing) console.error(`  - ${url}`)
    process.exit(1)
  }

  console.log(`✓ All ${audioPaths.length} audio files present at ${base}`)
  console.log(`✓ All ${mediaPaths.length} visual assets present at ${base}`)
}

main().catch((error) => {
  if (error instanceof TypeError && String(error.message).includes('fetch failed')) {
    const base = getMediaBase()
    if (base) {
      printMediaHostHelp(new URL(base).hostname)
      process.exit(1)
    }
  }
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
