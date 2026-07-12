#!/usr/bin/env node
/**
 * Install NOW photographs from PHOTOGRAPHY/NOW-files into public/waypoints/.
 * Creates modern-exterior.jpg + modern-poster.jpg per stop (same layout as install-modern-photos).
 *
 * Run: npm run install:now-files
 */
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const manifest = JSON.parse(await readFile(join(__dirname, 'now-files-manifest.json'), 'utf8'))

const sourceDir = join(root, manifest.sourceDir)
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
  return { exteriorPath, posterPath, posterUrl: `/waypoints/${relDest}/modern-poster.jpg` }
}

async function patchManifest(installedPosters) {
  const manifestPath = join(root, 'src/content/rome/manifest.json')
  const rome = JSON.parse(await readFile(manifestPath, 'utf8'))

  for (const [waypointId, relDest] of Object.entries(manifest.manifestWaypoints)) {
    const wp = rome.waypoints?.[waypointId]
    if (!wp) continue

    const posterUrl = installedPosters.get(relDest)
    if (!posterUrl) continue

    wp.photo = posterUrl
    if (wp.reconstruction) {
      wp.reconstruction.now = posterUrl
    }
    if (wp.now_image) {
      wp.now_image.file = posterUrl.split('/').pop()
      wp.now_image.source = 'commissioned'
      wp.now_image.license = 'original'
      wp.now_image.credit = 'ChronoWalk production photography'
    }
  }

  await writeFile(manifestPath, `${JSON.stringify(rome, null, 2)}\n`)
  console.log(`✓ Updated src/content/rome/manifest.json with local NOW poster URLs`)
}

async function main() {
  let installed = 0
  const posterByDest = new Map()

  for (const entry of manifest.photos) {
    const sourcePath = join(sourceDir, entry.file)
    if (!(await fileExists(sourcePath))) {
      console.warn(`⚠ Missing source: ${entry.file}`)
      continue
    }

    for (const dest of entry.destinations) {
      const paths = await installDestination(sourcePath, dest)
      posterByDest.set(dest, paths.posterUrl)
      installed += 1
      console.log(`✓ ${entry.file} → ${dest}/`)
    }

    if (entry.tourHero) {
      const tourHeroPath = join(root, 'public', 'tour-hero.jpg')
      await writePoster(sourcePath, tourHeroPath)
      console.log(`✓ tour-hero.jpg updated from ${entry.file}`)
    }
  }

  await patchManifest(posterByDest)
  console.log(`\nDone. ${installed} waypoint folder(s) updated from NOW-files.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
