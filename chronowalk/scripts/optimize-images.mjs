#!/usr/bin/env node
/**
 * Optimizes landing imagery and waypoint list thumbnails.
 *
 * - public/landing/*.{png,jpg,jpeg} → sibling .webp (max width 1440, quality 78)
 * - modern-poster.jpg / ancient-poster.jpg → *-thumb.webp (width 400, quality 70)
 *
 * Originals are kept for <picture> / legacy fallbacks.
 *
 * Usage: npm run optimize:images
 */
import { readdir, stat } from 'node:fs/promises'
import { join, dirname, extname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const landingDir = join(root, 'public', 'landing')
const waypointsDir = join(root, 'public', 'waypoints')

const LANDING_MAX_WIDTH = 1440
const LANDING_QUALITY = 78
const THUMB_WIDTH = 400
const THUMB_QUALITY = 70

const LANDING_INPUT_EXT = new Set(['.png', '.jpg', '.jpeg'])
const POSTER_NAMES = new Set(['modern-poster.jpg', 'ancient-poster.jpg'])

async function walk(dir, files = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      await walk(full, files)
    } else {
      files.push(full)
    }
  }
  return files
}

async function optimizeLandingImage(inputPath) {
  const ext = extname(inputPath).toLowerCase()
  if (!LANDING_INPUT_EXT.has(ext)) return null

  const base = basename(inputPath, ext)
  if (base.endsWith('.webp')) return null

  const outputPath = join(dirname(inputPath), `${base}.webp`)
  const inputStat = await stat(inputPath)
  const meta = await sharp(inputPath).rotate().metadata()

  let width = LANDING_MAX_WIDTH
  let quality = LANDING_QUALITY

  for (let attempt = 0; attempt < 4; attempt += 1) {
    let pipeline = sharp(inputPath).rotate()
    if (meta.width && meta.width > width) {
      pipeline = pipeline.resize(width, null, { withoutEnlargement: true })
    }

    await pipeline.webp({ quality }).toFile(outputPath)
    const outputStat = await stat(outputPath)

    if (outputStat.size <= 400 * 1024) {
      return {
        kind: 'landing',
        input: inputPath.replace(`${root}/`, ''),
        output: outputPath.replace(`${root}/`, ''),
        beforeKb: Math.round(inputStat.size / 1024),
        afterKb: Math.round(outputStat.size / 1024),
      }
    }

    quality = Math.max(52, quality - 8)
    width = Math.max(960, Math.round(width * 0.85))
  }

  const outputStat = await stat(outputPath)
  return {
    kind: 'landing',
    input: inputPath.replace(`${root}/`, ''),
    output: outputPath.replace(`${root}/`, ''),
    beforeKb: Math.round(inputStat.size / 1024),
    afterKb: Math.round(outputStat.size / 1024),
  }
}

async function optimizePosterThumb(inputPath) {
  const name = basename(inputPath)
  if (!POSTER_NAMES.has(name)) return null

  const stem = name.replace(/\.jpg$/, '')
  const outputPath = join(dirname(inputPath), `${stem}-thumb.webp`)

  await sharp(inputPath)
    .rotate()
    .resize(THUMB_WIDTH, null, { withoutEnlargement: true })
    .webp({ quality: THUMB_QUALITY })
    .toFile(outputPath)

  const [inputStat, outputStat] = await Promise.all([stat(inputPath), stat(outputPath)])
  return {
    kind: 'thumb',
    input: inputPath.replace(`${root}/`, ''),
    output: outputPath.replace(`${root}/`, ''),
    beforeKb: Math.round(inputStat.size / 1024),
    afterKb: Math.round(outputStat.size / 1024),
  }
}

async function main() {
  const landingFiles = await readdir(landingDir).catch(() => [])
  const landingResults = []

  for (const file of landingFiles) {
    const full = join(landingDir, file)
    const result = await optimizeLandingImage(full)
    if (result) landingResults.push(result)
  }

  const waypointFiles = await walk(waypointsDir).catch(() => [])
  const thumbResults = []

  for (const file of waypointFiles) {
    const result = await optimizePosterThumb(file)
    if (result) thumbResults.push(result)
  }

  const all = [...landingResults, ...thumbResults]
  if (!all.length) {
    console.log('No images to optimize.')
    return
  }

  console.log(`Optimized ${all.length} image(s):\n`)
  for (const row of all) {
    console.log(`  [${row.kind}] ${row.input} (${row.beforeKb} KB) → ${row.output} (${row.afterKb} KB)`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
