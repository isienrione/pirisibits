#!/usr/bin/env node
/**
 * Measure Rome shipping audio durations from R2 via ffprobe.
 *
 * Usage:
 *   npm run measure:durations
 *   VITE_MEDIA_BASE=https://media.chronowalk.app npm run measure:durations
 *   npm run measure:durations -- --from-dir=/path/to/rome/audio
 *
 * Writes src/content/rome/durations.json (filename → seconds).
 * Run npm run generate:rome-manifest to merge into manifest.json.
 */
import { execFile } from 'node:child_process'
import { writeFileSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import { collectManifestAudioPaths } from '../src/content/audioPaths.js'
import { buildDurationsMap, mergeDurationMaps, seedDurationsFromTransits } from '../src/content/durationManifest.js'
import { parseRomeManifest } from '../src/content/manifest.schema.js'
import { assertMediaHostResolvable, getMediaBase, loadEnvLocal } from './mediaBaseEnv.mjs'
import {
  assertReadableFile,
  localAudioPath,
  parseFromDirArg,
} from './localAudioPaths.mjs'

const execFileAsync = promisify(execFile)
const __dirname = dirname(fileURLToPath(import.meta.url))
const manifestPath = join(__dirname, '../src/content/rome/manifest.json')
const durationsPath = join(__dirname, '../src/content/rome/durations.json')
const dryRun = process.argv.includes('--dry-run')

async function hasFfprobe() {
  try {
    await execFileAsync('ffprobe', ['-version'])
    return true
  } catch {
    return false
  }
}

export async function probeMediaDuration(source) {
  const { stdout } = await execFileAsync('ffprobe', [
    '-v',
    'error',
    '-show_entries',
    'format=duration',
    '-of',
    'default=noprint_wrappers=1:nokey=1',
    source,
  ])

  const duration = parseFloat(String(stdout).trim())
  return Number.isFinite(duration) && duration > 0 ? duration : null
}

export async function probeRemoteDuration(url) {
  return probeMediaDuration(url)
}

async function main() {
  loadEnvLocal()

  const fromDir = parseFromDirArg()
  const base = getMediaBase()

  if (!fromDir && !base) {
    console.error('✗ VITE_MEDIA_BASE is not set.')
    console.error('  Set it in .env.local, or pass --from-dir=/path/to/rome/audio')
    process.exit(1)
  }

  if (!(await hasFfprobe())) {
    console.error('✗ ffprobe is required (install ffmpeg).')
    process.exit(1)
  }

  if (!fromDir) {
    await assertMediaHostResolvable(base)
  }

  const manifest = parseRomeManifest(JSON.parse(readFileSync(manifestPath, 'utf8')))
  const audioPaths = collectManifestAudioPaths(manifest)
  const measured = []
  const failed = []

  for (const path of audioPaths) {
    const source = fromDir
      ? localAudioPath(path, fromDir)
      : `${base}${path}`

    if (!source) {
      failed.push(path)
      console.error(`✗ ${path}: unsupported manifest audio path`)
      continue
    }

    try {
      if (fromDir) await assertReadableFile(source)
      const durationSeconds = await probeMediaDuration(source)
      if (durationSeconds == null) {
        failed.push(source)
        continue
      }
      measured.push({ path, durationSeconds })
      console.log(`✓ ${path} → ${durationSeconds.toFixed(1)}s`)
    } catch (error) {
      failed.push(source)
      console.error(`✗ ${path}: ${error instanceof Error ? error.message : error}`)
    }
  }

  const durations = mergeDurationMaps(
    seedDurationsFromTransits(manifest),
    buildDurationsMap(measured)
  )

  console.log(`\nMeasured ${measured.length}/${audioPaths.length} files`)

  if (failed.length) {
    console.error(`Failed to measure ${failed.length} files.`)
    if (!measured.length) process.exit(1)
  }

  if (dryRun) return

  writeFileSync(durationsPath, `${JSON.stringify(durations, null, 2)}\n`)
  console.log(`Wrote ${durationsPath} (${Object.keys(durations).length} entries)`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
}
