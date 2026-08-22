#!/usr/bin/env node
/**
 * Capture Traveler screens at iPhone viewport sizes.
 * Usage: node scripts/capture-traveler-screens.mjs <outDir> [port] [--viewports]
 */
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const screens = [
  'A01',
  'A03',
  'B01',
  'B04',
  'C01',
  'C03',
  'D01',
  'D02',
  'D05',
  'D07',
  'D08',
  'D09',
  'E01',
  'E03',
  'F01',
  'I01',
]

const labels = {
  A01: 'Welcome',
  A03: 'Interests',
  B01: 'Home',
  B04: 'Route sequence',
  C01: 'Walking',
  C03: 'Arrival',
  D01: 'Hero cover',
  D02: 'Hero runtime',
  D05: 'Discovery',
  D07: 'Mystery sealed',
  D08: 'Mystery revealed',
  D09: 'Then / Now',
  E01: 'Fork',
  E03: 'Recomposed',
  F01: 'City map',
  I01: 'Settings',
}

const outDir = resolve(process.argv[2] ?? 'docs/demo/visual/baseline')
const port = process.argv.find((arg) => /^\d+$/.test(arg)) ?? '8081'
const withViewports = process.argv.includes('--viewports')
const makeSheet = process.argv.includes('--sheet')

const sizes = [{ name: '390x844', width: 390, height: 844 }]
if (withViewports) {
  sizes.push({ name: '393x852', width: 393, height: 852 }, { name: '430x932', width: 430, height: 932 })
}

mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()

for (const size of sizes) {
  await page.setViewportSize({ width: size.width, height: size.height })
  const folder = size.name === '390x844' ? outDir : resolve(outDir, size.name)
  mkdirSync(folder, { recursive: true })
  for (const id of screens) {
    if (size.name !== '390x844' && !['A01', 'B01', 'C01', 'D01', 'D09'].includes(id)) continue
    const url = `http://127.0.0.1:${port}/?screen=${id}`
    await page.goto(url, { waitUntil: 'networkidle', timeout: 90000 })
    await page.waitForTimeout(1800)
    const file = resolve(folder, `${id}.png`)
    await page.screenshot({ path: file, fullPage: false })
    console.log('wrote', file)
  }
}

if (makeSheet) {
  const cells = screens
    .map((id) => {
      const src = `data:image/png;base64,${readFileSync(resolve(outDir, `${id}.png`)).toString('base64')}`
      return `<figure><img src="${src}" alt="${id}" /><figcaption>${id} · ${labels[id]}</figcaption></figure>`
    })
    .join('\n')
  const html = `<!doctype html>
<html><head><meta charset="utf-8" />
<style>
  html, body { margin: 0; background: #F7F1E6; color: #211C15; font-family: "DM Sans", Georgia, serif; }
  h1 { font-family: Georgia, serif; font-weight: 600; font-size: 42px; margin: 0 0 8px; }
  p.lead { font-size: 18px; max-width: 720px; line-height: 1.45; margin: 0 0 32px; color: #3A342A; }
  header { padding: 40px 40px 12px; }
  .grid { display: grid; grid-template-columns: repeat(4, 390px); gap: 28px; padding: 0 40px 48px; }
  figure { margin: 0; }
  img { width: 390px; height: 844px; object-fit: cover; background: #16130F; }
  figcaption { font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase; margin-top: 10px; color: #C97F1E; }
</style></head>
<body>
<header>
  <h1>ChronoWalk Traveler · visual draft</h1>
  <p class="lead">Rome, composed for the hours you actually have. A cinematic outdoor walk — the city leads, the interface recedes.</p>
</header>
<div class="grid">${cells}</div>
</body></html>`
  await page.setViewportSize({ width: 1688, height: 2200 })
  await page.setContent(html, { waitUntil: 'load' })
  await page.waitForTimeout(400)
  const sheet = resolve(outDir, '../TRAVELER_V1_CONTACT_SHEET.png')
  await page.screenshot({ path: sheet, fullPage: true })
  console.log('wrote', sheet)
}

await browser.close()
