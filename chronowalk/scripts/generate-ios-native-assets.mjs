/**
 * Generate ChronoWalk AppIcon + Splash PNGs for the Capacitor iOS asset catalog.
 * Source: public/brand/emblem-dark.png (1024×1024) — same emblem as PWA icons.
 */
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const emblemPath = join(root, 'public', 'brand', 'emblem-dark.png')
const appIconPath = join(
  root,
  'ios',
  'App',
  'App',
  'Assets.xcassets',
  'AppIcon.appiconset',
  'AppIcon-512@2x.png',
)
const splashDir = join(root, 'ios', 'App', 'App', 'Assets.xcassets', 'Splash.imageset')

/** Matches theme-color / PWA obsidian shell (#16130F). */
const OBSIDIAN = { r: 22, g: 19, b: 15, alpha: 1 }

async function emblemOnCanvas(size, emblemScale = 0.86) {
  const emblemSize = Math.round(size * emblemScale)
  const offset = Math.round((size - emblemSize) / 2)

  const emblem = await sharp(emblemPath)
    .resize(emblemSize, emblemSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer()

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: OBSIDIAN,
    },
  }).composite([{ input: emblem, left: offset, top: offset }])
}

async function main() {
  // App Store / home screen icon (1024×1024, no transparency for store submission).
  await (await emblemOnCanvas(1024, 0.86))
    .flatten({ background: OBSIDIAN })
    .png({ compressionLevel: 9 })
    .toFile(appIconPath)

  // Launch splash scales (centered emblem on obsidian).
  const splashSizes = [
    { file: 'splash-2732x2732-2.png', size: 911 },
    { file: 'splash-2732x2732-1.png', size: 1822 },
    { file: 'splash-2732x2732.png', size: 2732 },
  ]

  for (const { file, size } of splashSizes) {
    await (await emblemOnCanvas(size, 0.42))
      .png({ compressionLevel: 9 })
      .toFile(join(splashDir, file))
  }

  console.log('iOS native assets written:', appIconPath, splashDir)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
