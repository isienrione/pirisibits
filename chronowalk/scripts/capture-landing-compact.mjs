#!/usr/bin/env node
/**
 * Capture compact landing QA screenshots.
 * Usage: node scripts/capture-landing-compact.mjs [baseUrl]
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT = join('/opt/cursor/artifacts', 'landing-compact-qa')
const BASE_URL = process.argv[2] || 'http://127.0.0.1:4173/landing'

const VIEWPORTS = [
  { name: '320x700', width: 320, height: 700, deviceScaleFactor: 2 },
  { name: '390x844', width: 390, height: 844, deviceScaleFactor: 2 },
  { name: '430x932', width: 430, height: 932, deviceScaleFactor: 2 },
  { name: '768x1024', width: 768, height: 1024, deviceScaleFactor: 2 },
  { name: '1440x1000', width: 1440, height: 1000, deviceScaleFactor: 1 },
]

const CRITICAL = [
  { name: '01-hero', selector: '#hero' },
  { name: '02-product-proof', selector: '#product-proof' },
  { name: '03-pantheon', selector: '#pantheon-preview' },
  { name: '04-pricing', selector: '#pricing' },
  { name: '05-route', selector: '#route-proof' },
  { name: '06-faq-final', selector: '#faq' },
]

async function dismissConsent(page) {
  const btn = await page.$('[data-testid="analytics-consent-accept"], [data-testid="analytics-consent-decline"]')
  if (btn) {
    try {
      await btn.click()
      await new Promise((r) => setTimeout(r, 250))
    } catch {
      /* ignore */
    }
  }
}

async function main() {
  await mkdir(OUT, { recursive: true })
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  })

  const metrics = []
  try {
    const page = await browser.newPage()
    for (const vp of VIEWPORTS) {
      await page.setViewport({
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: vp.deviceScaleFactor,
      })
      await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 120_000 })
      await page.waitForSelector('#hero, h1', { timeout: 60_000 })
      await dismissConsent(page)
      await new Promise((r) => setTimeout(r, 500))

      const above = join(OUT, `landing-${vp.name}-above.jpg`)
      const full = join(OUT, `landing-${vp.name}-full.jpg`)
      await page.screenshot({ path: above, type: 'jpeg', quality: 84, fullPage: false })
      await page.screenshot({ path: full, type: 'jpeg', quality: 84, fullPage: true })

      const height = await page.evaluate(() => document.documentElement.scrollHeight)
      metrics.push({ viewport: vp.name, scrollHeight: height, above, full })
      console.log(`✓ ${vp.name} height=${height}`)
    }

    // Critical positions at 390×844
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 })
    await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 120_000 })
    await page.waitForSelector('#hero', { timeout: 60_000 })
    await dismissConsent(page)

    for (const spot of CRITICAL) {
      const el = await page.$(spot.selector)
      if (!el) {
        console.warn(`missing ${spot.selector}`)
        continue
      }
      await el.scrollIntoView({ block: 'start' })
      await new Promise((r) => setTimeout(r, 350))
      const path = join(OUT, `critical-390-${spot.name}.jpg`)
      await page.screenshot({ path, type: 'jpeg', quality: 84, fullPage: false })
      console.log(`✓ critical ${spot.name}`)
    }

    await writeFile(join(OUT, 'metrics.json'), `${JSON.stringify(metrics, null, 2)}\n`)
  } finally {
    await browser.close()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
