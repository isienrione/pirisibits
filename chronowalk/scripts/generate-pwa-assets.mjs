import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outputDir = join(root, 'public', 'pwa')
const publicDir = join(root, 'public')
const emblemPath = join(publicDir, 'brand', 'emblem-dark.png')

/** App shell / PWA background — matches theme-color in index.html */
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

async function writePng(pipeline, filepath) {
  await pipeline.png({ compressionLevel: 9 }).toFile(filepath)
}

async function main() {
  await mkdir(outputDir, { recursive: true })

  const sizes = [
    { file: join(outputDir, 'icon-192.png'), size: 192, scale: 0.86 },
    { file: join(outputDir, 'icon-512.png'), size: 512, scale: 0.86 },
    { file: join(outputDir, 'apple-touch-icon.png'), size: 180, scale: 0.86 },
    { file: join(publicDir, 'favicon-32.png'), size: 32, scale: 0.9 },
    { file: join(publicDir, 'favicon-16.png'), size: 16, scale: 0.9 },
  ]

  for (const { file, size, scale } of sizes) {
    await writePng(await emblemOnCanvas(size, scale), file)
  }

  // Maskable safe zone — emblem ~65% so Android adaptive icons do not crop the seam
  await writePng(await emblemOnCanvas(512, 0.65), join(outputDir, 'icon-maskable-512.png'))

  const favicon32 = await (await emblemOnCanvas(32, 0.9)).png().toBuffer()
  const faviconDataUri = `data:image/png;base64,${favicon32.toString('base64')}`
  await writeFile(
    join(publicDir, 'favicon.svg'),
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
  <rect width="32" height="32" rx="6" fill="#16130F"/>
  <image href="${faviconDataUri}" width="32" height="32" preserveAspectRatio="xMidYMid meet"/>
</svg>
`,
  )

  const heroPath = join(publicDir, 'tour-hero.jpg')

  await sharp(heroPath)
    .resize(540, 720, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(join(outputDir, 'screenshot-mobile.jpg'))

  await sharp(heroPath)
    .resize(1280, 720, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(join(outputDir, 'screenshot-wide.jpg'))

  console.log('Generated official brand PWA icons from public/brand/emblem-dark.png')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
