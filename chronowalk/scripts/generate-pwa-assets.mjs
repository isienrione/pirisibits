import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outputDir = join(root, 'public', 'pwa')
const splashDir = join(outputDir, 'splash')
const publicDir = join(root, 'public')
const emblemPath = join(publicDir, 'brand', 'emblem-dark.png')

/** App shell / PWA background — matches theme-color in index.html */
const OBSIDIAN = { r: 22, g: 19, b: 15, alpha: 1 }

/**
 * iOS apple-touch-startup-image sizes (portrait + landscape).
 * media queries match Apple device pixel ratios so cold launch shows a branded splash
 * instead of a blank white/safari flash (Sam Selikoff / pwa-asset-generator pattern).
 */
const IOS_SPLASH_SCREENS = [
  // iPhone 14 Pro Max, 15 Plus, 15 Pro Max, 16 Plus, 16 Pro Max
  { file: 'iphone-14-pro-max-portrait.png', width: 1290, height: 2796, media: '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
  { file: 'iphone-14-pro-max-landscape.png', width: 2796, height: 1290, media: '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)' },
  // iPhone 14 Pro, 15, 15 Pro, 16, 16 Pro
  { file: 'iphone-14-pro-portrait.png', width: 1179, height: 2556, media: '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
  { file: 'iphone-14-pro-landscape.png', width: 2556, height: 1179, media: '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)' },
  // iPhone 14 Plus, 13 Pro Max, 12 Pro Max
  { file: 'iphone-14-plus-portrait.png', width: 1284, height: 2778, media: '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
  { file: 'iphone-14-plus-landscape.png', width: 2778, height: 1284, media: '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)' },
  // iPhone 14, 13, 13 Pro, 12, 12 Pro
  { file: 'iphone-14-portrait.png', width: 1170, height: 2532, media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
  { file: 'iphone-14-landscape.png', width: 2532, height: 1170, media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)' },
  // iPhone 13 mini, 12 mini
  { file: 'iphone-13-mini-portrait.png', width: 1080, height: 2340, media: '(device-width: 360px) and (device-height: 780px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
  { file: 'iphone-13-mini-landscape.png', width: 2340, height: 1080, media: '(device-width: 360px) and (device-height: 780px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)' },
  // iPhone 11 Pro Max, XS Max
  { file: 'iphone-11-pro-max-portrait.png', width: 1242, height: 2688, media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
  { file: 'iphone-11-pro-max-landscape.png', width: 2688, height: 1242, media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)' },
  // iPhone 11, XR
  { file: 'iphone-11-portrait.png', width: 828, height: 1792, media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
  { file: 'iphone-11-landscape.png', width: 1792, height: 828, media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)' },
  // iPhone X, XS, 11 Pro
  { file: 'iphone-x-portrait.png', width: 1125, height: 2436, media: '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
  { file: 'iphone-x-landscape.png', width: 2436, height: 1125, media: '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)' },
  // iPhone 8 Plus, 7 Plus, 6s Plus
  { file: 'iphone-8-plus-portrait.png', width: 1242, height: 2208, media: '(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
  { file: 'iphone-8-plus-landscape.png', width: 2208, height: 1242, media: '(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)' },
  // iPhone 8, 7, 6s, SE (2nd/3rd)
  { file: 'iphone-8-portrait.png', width: 750, height: 1334, media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
  { file: 'iphone-8-landscape.png', width: 1334, height: 750, media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)' },
  // iPhone SE (1st), 5s
  { file: 'iphone-se-portrait.png', width: 640, height: 1136, media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
  { file: 'iphone-se-landscape.png', width: 1136, height: 640, media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)' },
  // iPad Pro 12.9"
  { file: 'ipad-pro-129-portrait.png', width: 2048, height: 2732, media: '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
  { file: 'ipad-pro-129-landscape.png', width: 2732, height: 2048, media: '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)' },
  // iPad Pro 11"
  { file: 'ipad-pro-11-portrait.png', width: 1668, height: 2388, media: '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
  { file: 'ipad-pro-11-landscape.png', width: 2388, height: 1668, media: '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)' },
  // iPad Air / iPad 10.9"
  { file: 'ipad-air-portrait.png', width: 1640, height: 2360, media: '(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
  { file: 'ipad-air-landscape.png', width: 2360, height: 1640, media: '(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)' },
  // iPad 10.2"
  { file: 'ipad-102-portrait.png', width: 1620, height: 2160, media: '(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
  { file: 'ipad-102-landscape.png', width: 2160, height: 1620, media: '(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)' },
]

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

async function splashCanvas(width, height) {
  // Keep the mark readable on phone and tablet launch screens.
  const emblemSize = Math.round(Math.min(width, height) * 0.28)
  const left = Math.round((width - emblemSize) / 2)
  const top = Math.round((height - emblemSize) / 2)

  const emblem = await sharp(emblemPath)
    .resize(emblemSize, emblemSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer()

  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: OBSIDIAN,
    },
  }).composite([{ input: emblem, left, top }])
}

async function writePng(pipeline, filepath) {
  await pipeline.png({ compressionLevel: 9 }).toFile(filepath)
}

function buildSplashLinkTags() {
  return IOS_SPLASH_SCREENS.map(
    ({ file, media }) =>
      `<link rel="apple-touch-startup-image" href="/pwa/splash/${file}" media="${media}" />`,
  ).join('\n    ')
}

async function main() {
  await mkdir(outputDir, { recursive: true })
  await mkdir(splashDir, { recursive: true })

  const sizes = [
    { file: join(outputDir, 'icon-192.png'), size: 192, scale: 0.86 },
    { file: join(outputDir, 'icon-512.png'), size: 512, scale: 0.86 },
    // iOS Add-to-Home-Screen looks at /apple-touch-icon.png first (site root)
    { file: join(publicDir, 'apple-touch-icon.png'), size: 180, scale: 0.86 },
    { file: join(outputDir, 'apple-touch-icon.png'), size: 180, scale: 0.86 },
    { file: join(publicDir, 'favicon-32.png'), size: 32, scale: 0.9 },
    { file: join(publicDir, 'favicon-16.png'), size: 16, scale: 0.9 },
  ]

  for (const { file, size, scale } of sizes) {
    await writePng(await emblemOnCanvas(size, scale), file)
  }

  // Maskable safe zone — emblem ~65% so Android adaptive icons do not crop the seam
  await writePng(await emblemOnCanvas(512, 0.65), join(outputDir, 'icon-maskable-512.png'))

  for (const { file, width, height } of IOS_SPLASH_SCREENS) {
    await writePng(await splashCanvas(width, height), join(splashDir, file))
  }

  // Marker file consumed by the Vite HTML transform so splash <link> tags stay in sync.
  await writeFile(
    join(outputDir, 'ios-splash-links.html'),
    `${buildSplashLinkTags()}\n`,
  )

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

  console.log(
    `Generated PWA icons + ${IOS_SPLASH_SCREENS.length} iOS splash screens from public/brand/emblem-dark.png`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
