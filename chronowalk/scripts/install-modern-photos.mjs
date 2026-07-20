#!/usr/bin/env node
/**
 * Install modern-day photos into waypoint folders.
 *
 * 1. Drop source JPEGs into public/waypoints/_incoming/modern-photos/
 *    (see README.md there for filenames).
 * 2. Run: npm run install:modern-photos
 *
 * Creates modern-exterior.jpg (full) and modern-poster.jpg (16:9 hero crop)
 * in each destination folder listed in scripts/modern-photo-manifest.json.
 */
import { copyFile, mkdir, readFile, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const manifest = JSON.parse(
  await readFile(join(__dirname, 'modern-photo-manifest.json'), 'utf8')
)

const incomingDir = join(root, manifest.incomingDir)
const waypointsRoot = join(root, 'public', 'waypoints')

async function fileExists(path) {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

async function writeExterior(sourcePath, destPath) {
  const { maxWidth, quality } = manifest.exterior
  let pipeline = sharp(sourcePath).rotate()
  const meta = await pipeline.metadata()
  if (meta.width && meta.width > maxWidth) {
    pipeline = pipeline.resize({ width: maxWidth, withoutEnlargement: true })
  }
  await pipeline.jpeg({ quality, mozjpeg: true }).toFile(destPath)
}

async function writePoster(sourcePath, destPath) {
  const { width, height, quality } = manifest.poster
  await sharp(sourcePath)
    .rotate()
    .resize(width, height, { fit: 'cover', position: 'centre' })
    .jpeg({ quality, mozjpeg: true })
    .toFile(destPath)
}

async function installDestination(sourcePath, relDest) {
  const destDir = join(waypointsRoot, relDest)
  await mkdir(destDir, { recursive: true })

  const exteriorPath = join(destDir, 'modern-exterior.jpg')
  const posterPath = join(destDir, 'modern-poster.jpg')

  await writeExterior(sourcePath, exteriorPath)
  await writePoster(sourcePath, posterPath)

  return { exteriorPath, posterPath }
}

async function main() {
  await mkdir(incomingDir, { recursive: true })

  let installed = 0
  let skipped = 0
  const missing = []

  for (const entry of manifest.photos) {
    const sourcePath = join(incomingDir, entry.file)
    if (!(await fileExists(sourcePath))) {
      if (entry.optional) {
        skipped += 1
        continue
      }
      missing.push(entry.file)
      continue
    }

    for (const dest of entry.destinations) {
      const paths = await installDestination(sourcePath, dest)
      installed += 1
      console.log(`✓ ${entry.file} → ${dest}/`)
      console.log(`    ${paths.exteriorPath.replace(root + '/', '')}`)
      console.log(`    ${paths.posterPath.replace(root + '/', '')}`)
    }

    if (entry.alsoTourHero || entry.file === manifest.tourHeroSource) {
      const tourHeroPath = join(root, 'public', 'tour-hero.jpg')
      await writePoster(sourcePath, tourHeroPath)
      console.log(`✓ tour-hero.jpg updated from ${entry.file}`)
    }
  }

  if (missing.length) {
    console.error('\nMissing required photos in', manifest.incomingDir + '/')
    for (const file of missing) {
      console.error(`  - ${file}`)
    }
    console.error('\nSee public/waypoints/_incoming/modern-photos/README.md for the full list.')
    process.exit(1)
  }

  console.log(`\nDone. ${installed} destination folder(s) updated, ${skipped} optional file(s) skipped.`)
  console.log('Next: npm run verify-all-waypoints')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
