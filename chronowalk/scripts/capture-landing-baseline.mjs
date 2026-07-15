#!/usr/bin/env node
/**
 * Capture landing-page baseline screenshots + Lighthouse (mobile + desktop).
 * Usage: node scripts/capture-landing-baseline.mjs [baseUrl]
 */
import { mkdir, writeFile, copyFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import puppeteer from 'puppeteer'
import lighthouse from 'lighthouse'
import * as chromeLauncher from 'chrome-launcher'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT = join(ROOT, 'docs', 'landing-baseline')
const SHOTS = join(OUT, 'screenshots')
const ARTIFACTS = '/opt/cursor/artifacts/landing-baseline'

const BASE_URL = process.argv[2] || 'http://127.0.0.1:4173/'

const VIEWPORTS = [
  { name: '390x844', width: 390, height: 844, deviceScaleFactor: 2 },
  { name: '430x932', width: 430, height: 932, deviceScaleFactor: 2 },
  { name: '768x1024', width: 768, height: 1024, deviceScaleFactor: 2 },
  { name: '1024x1366', width: 1024, height: 1366, deviceScaleFactor: 2 },
  { name: '1440x1000', width: 1440, height: 1000, deviceScaleFactor: 1 },
]

async function waitForLanding(page) {
  await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 120_000 })
  await page.waitForSelector('.cw-landing, main, h1', { timeout: 60_000 })
  // Dismiss consent bar if present so it does not obscure screenshots
  const consent = await page.$('[aria-label="Analytics consent"] button, .consent-bar button')
  if (consent) {
    try {
      await consent.click()
      await new Promise((r) => setTimeout(r, 300))
    } catch {
      /* ignore */
    }
  }
  await new Promise((r) => setTimeout(r, 800))
}

async function captureScreenshots() {
  await mkdir(SHOTS, { recursive: true })
  await mkdir(ARTIFACTS, { recursive: true })

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  })

  const results = []
  try {
    const page = await browser.newPage()
    for (const vp of VIEWPORTS) {
      await page.setViewport({
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: vp.deviceScaleFactor,
      })
      await waitForLanding(page)

      const aboveFold = join(SHOTS, `landing-${vp.name}-above-fold.jpg`)
      const fullPage = join(SHOTS, `landing-${vp.name}-full.jpg`)

      await page.screenshot({ path: aboveFold, type: 'jpeg', quality: 82, fullPage: false })
      await page.screenshot({ path: fullPage, type: 'jpeg', quality: 82, fullPage: true })

      await copyFile(aboveFold, join(ARTIFACTS, `landing-${vp.name}-above-fold.jpg`))
      await copyFile(fullPage, join(ARTIFACTS, `landing-${vp.name}-full.jpg`))

      const title = await page.title()
      const h1 = await page.$eval('h1', (el) => el.textContent?.trim() || '').catch(() => '')
      results.push({
        viewport: vp.name,
        width: vp.width,
        height: vp.height,
        title,
        h1,
        aboveFold,
        fullPage,
      })
      console.log(`✓ screenshot ${vp.name}`)
    }
  } finally {
    await browser.close()
  }
  return results
}

function scorePct(auditOrCat) {
  if (auditOrCat == null || auditOrCat.score == null) return null
  return Math.round(auditOrCat.score * 100)
}

async function runLighthouse(formFactor) {
  const chrome = await chromeLauncher.launch({
    chromePath: process.env.CHROME_PATH || '/usr/bin/google-chrome-stable',
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage'],
  })

  try {
    const options = {
      logLevel: 'error',
      output: 'json',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      port: chrome.port,
      formFactor,
      screenEmulation:
        formFactor === 'mobile'
          ? { mobile: true, width: 390, height: 844, deviceScaleFactor: 2, disabled: false }
          : { mobile: false, width: 1440, height: 1000, deviceScaleFactor: 1, disabled: false },
      throttlingMethod: 'simulate',
    }

    const runnerResult = await lighthouse(BASE_URL, options)
    const lhr = runnerResult.lhr
    const cats = lhr.categories

    const summary = {
      formFactor,
      url: lhr.finalDisplayedUrl || lhr.requestedUrl,
      fetchTime: lhr.fetchTime,
      scores: {
        performance: scorePct(cats.performance),
        accessibility: scorePct(cats.accessibility),
        bestPractices: scorePct(cats['best-practices']),
        seo: scorePct(cats.seo),
      },
      metrics: {
        firstContentfulPaint: lhr.audits['first-contentful-paint']?.displayValue ?? null,
        largestContentfulPaint: lhr.audits['largest-contentful-paint']?.displayValue ?? null,
        totalBlockingTime: lhr.audits['total-blocking-time']?.displayValue ?? null,
        cumulativeLayoutShift: lhr.audits['cumulative-layout-shift']?.displayValue ?? null,
        speedIndex: lhr.audits['speed-index']?.displayValue ?? null,
        interactive: lhr.audits.interactive?.displayValue ?? null,
      },
      opportunities: Object.values(lhr.audits)
        .filter((a) => a.details?.type === 'opportunity' && a.numericValue > 0)
        .sort((a, b) => b.numericValue - a.numericValue)
        .slice(0, 8)
        .map((a) => ({
          id: a.id,
          title: a.title,
          displayValue: a.displayValue,
          score: scorePct(a),
        })),
    }

    const reportPath = join(OUT, `lighthouse-${formFactor}.json`)
    await writeFile(reportPath, JSON.stringify(lhr, null, 2))
    await copyFile(reportPath, join(ARTIFACTS, `lighthouse-${formFactor}.json`))
    console.log(`✓ lighthouse ${formFactor}`, summary.scores)
    return summary
  } finally {
    await chrome.kill()
  }
}

async function main() {
  await mkdir(OUT, { recursive: true })
  console.log('Capturing against', BASE_URL)

  const screenshots = await captureScreenshots()
  const lighthouseMobile = await runLighthouse('mobile')
  const lighthouseDesktop = await runLighthouse('desktop')

  const meta = {
    capturedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    branch: 'landing-editorial-restructure',
    note: 'Baseline before editorial restructure. Live landing preserved + archived under src/landing/archive/v3-premium-baseline-2026-07-14/',
    screenshots,
    lighthouse: {
      mobile: lighthouseMobile,
      desktop: lighthouseDesktop,
    },
  }

  await writeFile(join(OUT, 'capture-meta.json'), JSON.stringify(meta, null, 2))
  await copyFile(join(OUT, 'capture-meta.json'), join(ARTIFACTS, 'capture-meta.json'))
  console.log('Done. Wrote', OUT)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
