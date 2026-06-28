import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outputDir = join(root, 'public', 'pwa')

const iconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" fill="none">
  <rect width="512" height="512" rx="112" fill="#FFFDF8"/>
  <circle cx="256" cy="256" r="188" fill="#F4E7D0"/>
  <circle cx="256" cy="256" r="148" fill="#C8643C" opacity="0.14"/>
  <path
    d="M156 318c0-72 44-118 100-118 38 0 68 18 86 48l-36 24c-12-18-28-28-50-28-42 0-68 34-68 74s26 74 68 74c24 0 42-10 56-30l36 22c-22 36-56 56-98 56-58 0-104-44-104-122Z"
    fill="#C8643C"
  />
  <path
    d="M286 200h44v168h-44V200Z"
    fill="#D9A441"
  />
  <circle cx="360" cy="344" r="18" fill="#7A8B5A"/>
</svg>`

const maskableIconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" fill="none">
  <rect width="512" height="512" fill="#FFFDF8"/>
  <circle cx="256" cy="256" r="156" fill="#F4E7D0"/>
  <path
    d="M176 318c0-58 36-94 82-94 32 0 56 14 70 38l-30 20c-10-14-24-22-42-22-34 0-56 28-56 62s22 62 56 62c20 0 34-8 46-24l30 18c-18 30-46 46-80 46-48 0-86-36-86-100Z"
    fill="#C8643C"
  />
  <path d="M286 214h36v136h-36V214Z" fill="#D9A441"/>
  <circle cx="344" cy="334" r="14" fill="#7A8B5A"/>
</svg>`

async function writePng(buffer, filename, width, height) {
  await sharp(buffer)
    .resize(width, height)
    .png({ compressionLevel: 9 })
    .toFile(join(outputDir, filename))
}

async function main() {
  await mkdir(outputDir, { recursive: true })

  await writePng(Buffer.from(iconSvg), 'icon-192.png', 192, 192)
  await writePng(Buffer.from(iconSvg), 'icon-512.png', 512, 512)
  await writePng(Buffer.from(maskableIconSvg), 'icon-maskable-512.png', 512, 512)

  const heroPath = join(root, 'public', 'tour-hero.jpg')

  await sharp(heroPath)
    .resize(540, 720, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(join(outputDir, 'screenshot-mobile.jpg'))

  await sharp(heroPath)
    .resize(1280, 720, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(join(outputDir, 'screenshot-wide.jpg'))

  console.log('Generated PWA icons and screenshots in public/pwa/')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
