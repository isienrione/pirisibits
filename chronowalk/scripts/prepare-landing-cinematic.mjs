#!/usr/bin/env node
/**
 * Build responsive cinematic planes for landing full-bleed Rome slots.
 *
 * Default masters (repo waypoint / landing plates) produce four distinct scenes.
 * To use your own dusk / blue-hour panoramas instead:
 *
 *   1. Drop masters into public/landing/cinematic/_masters/
 *        hero.jpg | interlude.jpg | after-rome.jpg | ending.jpg
 *   2. npm run prepare:landing-cinematic
 *
 * Optional: pass --slot=hero to rebuild one plane only.
 */
import { mkdir, readdir, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const outRoot = join(root, 'public', 'landing', 'cinematic')
const mastersDir = join(outRoot, '_masters')

const DESKTOP = { width: 1920, height: 1080 }
const MOBILE = { width: 1080, height: 1350 }
const JPEG_Q = 82
const WEBP_Q = 78
const AVIF_Q = 55

/** Built-in fallbacks when `_masters/<slot>.jpg` is absent. */
const DEFAULT_SOURCES = {
  /** Forum dusk + Colosseum on the horizon — cinematic gold hour. */
  hero: join(root, 'public', 'landing', 'hero-rome.png'),
  /** Colosseum facade — Act I arrival / Roma Antica beat. */
  interlude: join(root, 'public', 'waypoints', 'colosseum', 'exterior', 'modern-exterior.jpg'),
  /** Castel Sant’Angelo from Ponte — After Rome memory. */
  'after-rome': join(root, 'public', 'waypoints', 'castel-sant-angelo', 'modern-exterior.jpg'),
  /** Trevi — distinct civic monument for the cinematic ending. */
  ending: join(root, 'public', 'waypoints', 'fontana-di-trevi', 'modern-exterior.jpg'),
}

const POSITION = {
  hero: 'attention',
  interlude: 'entropy',
  'after-rome': 'centre',
  ending: 'centre',
}

async function exists(path) {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

async function resolveSource(slot) {
  const candidates = [
    join(mastersDir, `${slot}.jpg`),
    join(mastersDir, `${slot}.jpeg`),
    join(mastersDir, `${slot}.png`),
    join(mastersDir, `${slot}.webp`),
    DEFAULT_SOURCES[slot],
  ]
  for (const path of candidates) {
    if (path && (await exists(path))) return path
  }
  throw new Error(`No source found for cinematic slot "${slot}"`)
}

async function writeVariants(slot, sourcePath) {
  const dir = join(outRoot, slot)
  await mkdir(dir, { recursive: true })
  const position = POSITION[slot] ?? 'centre'

  const desktopPipeline = () =>
    sharp(sourcePath)
      .rotate()
      .resize(DESKTOP.width, DESKTOP.height, { fit: 'cover', position })

  const mobilePipeline = () =>
    sharp(sourcePath)
      .rotate()
      .resize(MOBILE.width, MOBILE.height, { fit: 'cover', position })

  await desktopPipeline().jpeg({ quality: JPEG_Q, mozjpeg: true, progressive: true }).toFile(join(dir, 'desktop.jpg'))
  await desktopPipeline().webp({ quality: WEBP_Q }).toFile(join(dir, 'desktop.webp'))
  await desktopPipeline().avif({ quality: AVIF_Q }).toFile(join(dir, 'desktop.avif'))

  await mobilePipeline().jpeg({ quality: JPEG_Q, mozjpeg: true, progressive: true }).toFile(join(dir, 'mobile.jpg'))
  await mobilePipeline().webp({ quality: WEBP_Q }).toFile(join(dir, 'mobile.webp'))
  await mobilePipeline().avif({ quality: AVIF_Q }).toFile(join(dir, 'mobile.avif'))

  await sharp(sourcePath)
    .rotate()
    .resize(32, 18, { fit: 'cover', position })
    .jpeg({ quality: 40, mozjpeg: true })
    .toFile(join(dir, 'lqip.jpg'))

  return dir
}

async function main() {
  await mkdir(mastersDir, { recursive: true })

  const slotFlag = process.argv.find((a) => a.startsWith('--slot='))
  const only = slotFlag ? slotFlag.slice('--slot='.length) : null
  const slots = only ? [only] : Object.keys(DEFAULT_SOURCES)

  for (const slot of slots) {
    if (!DEFAULT_SOURCES[slot]) throw new Error(`Unknown slot: ${slot}`)
    const source = await resolveSource(slot)
    const dir = await writeVariants(slot, source)
    console.log(`✓ ${slot} ← ${source.replace(root + '/', '')} → ${dir.replace(root + '/', '')}`)
  }

  const listed = await readdir(mastersDir).catch(() => [])
  const masters = listed.filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
  if (masters.length === 0) {
    console.log(
      '\nTip: drop dusk panoramas into public/landing/cinematic/_masters/ as hero.jpg, interlude.jpg, after-rome.jpg, ending.jpg then re-run.',
    )
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
