#!/usr/bin/env node
/**
 * Validate Rome manifest schema and HEAD-check audio files on R2.
 *
 * Usage:
 *   npm run check:content
 *   npm run check:content -- --skip-remote
 *
 * Env: VITE_MEDIA_BASE (required unless --skip-remote)
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { collectManifestAudioPaths } from '../src/content/audioPaths.js'
import { audioKeyFromManifestPath } from '../src/content/durationVerification.js'
import { durationCoverage } from '../src/content/durationManifest.js'
import { parseRomeManifest } from '../src/content/manifest.schema.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const manifestPath = join(__dirname, '../src/content/rome/manifest.json')
const skipRemote = process.argv.includes('--skip-remote')

function loadEnvLocal() {
  try {
    const envPath = join(__dirname, '../.env.local')
    const raw = readFileSync(envPath, 'utf8')
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq)
      const value = trimmed.slice(eq + 1)
      if (!process.env[key]) process.env[key] = value
    }
  } catch {
    // optional
  }
}

async function headCheck(url) {
  const response = await fetch(url, { method: 'HEAD' })
  return response.ok
}

async function main() {
  loadEnvLocal()

  const raw = JSON.parse(readFileSync(manifestPath, 'utf8'))
  const manifest = parseRomeManifest(raw)
  const audioPaths = collectManifestAudioPaths(manifest)
  const durationEntries = Object.entries(manifest.durations ?? {})

  console.log(`✓ Manifest schema valid (${audioPaths.length} audio files referenced)`)

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
      console.log(
        `  (${coverage.covered}/${coverage.total} shipping files have durations — run npm run measure:durations for full map)`
      )
    }
  }

  if (skipRemote) {
    console.log('✓ Skipping remote HEAD checks (--skip-remote)')
    return
  }

  const base = process.env.VITE_MEDIA_BASE?.replace(/\/$/, '')
  if (!base) {
    console.error('✗ VITE_MEDIA_BASE is not set. Use --skip-remote to validate schema only.')
    process.exit(1)
  }

  const missing = []
  const checked = []

  for (const path of audioPaths) {
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

  console.log(`✓ All ${checked.length} audio files present at ${base}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
