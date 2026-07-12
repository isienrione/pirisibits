#!/usr/bin/env node
/**
 * Rendered-contrast CI — WCAG 2.1 contrast + touch-target size audit via Puppeteer.
 *
 * Prerequisite: npm run build && npm run preview (or pass baseUrl)
 *
 * Usage: npm run check:contrast [baseUrl]
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import puppeteer from 'puppeteer-core'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const allowlistPath = join(__dirname, 'contrast-allowlist.json')
const defaultBaseUrl = process.argv[2] ?? 'http://127.0.0.1:4173'
const viewport = { width: 390, height: 844, deviceScaleFactor: 2 }

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/usr/bin/google-chrome-stable',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean)

const ROUTES = [
  { path: '/landing', access: 'public', waitMs: 1200 },
  { path: '/preview', access: 'public', waitMs: 2500 },
  { path: '/setup', access: 'granted', waitMs: 1200 },
  { path: '/stops', access: 'granted', waitMs: 1200 },
  { path: '/journal', access: 'granted', waitMs: 1200 },
  { path: '/no-ticket', access: 'granted', waitMs: 1200 },
  { path: '/access', access: 'public', waitMs: 1200 },
  { path: '/map', access: 'granted', waitMs: 2500 },
]

function loadAllowlist() {
  const raw = JSON.parse(readFileSync(allowlistPath, 'utf8'))
  return raw.entries ?? []
}

function isAllowlisted(route, failure, allowlist) {
  return allowlist.some((entry) => {
    if (entry.route !== route) return false
    if (entry.type && entry.type !== failure.type) return false
    if (entry.textIncludes && !failure.text?.includes(entry.textIncludes)) return false
    if (entry.tag && entry.tag !== failure.tag) return false
    if (entry.role && entry.role !== failure.role) return false
    if (entry.selector && failure.selector && !failure.selector.includes(entry.selector)) return false
    return true
  })
}

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { redirect: 'manual' })
      if (res.ok || res.status === 304 || res.status < 500) return true
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 300))
  }
  return false
}

function startPreview() {
  const child = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', '4173'], {
    cwd: root,
    stdio: 'ignore',
    detached: false,
  })
  return child
}

function resolveChromePath() {
  for (const candidate of CHROME_CANDIDATES) {
    try {
      readFileSync(candidate)
      return candidate
    } catch {
      // try next
    }
  }
  throw new Error('No Chrome/Chromium executable found. Set CHROME_PATH.')
}

async function applyAccessPreset(page, access) {
  await page.evaluate((mode) => {
    if (mode === 'granted') {
      localStorage.setItem('cw_access', 'true')
    } else {
      localStorage.removeItem('cw_access')
    }
    localStorage.setItem('cw_analytics_consent', 'accepted')
  }, access)
}

async function auditPage(page) {
  return page.evaluate(() => {
    function parseRgb(input) {
      if (!input || input === 'transparent') return null
      const m = input.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
      if (!m) return null
      return {
        r: Number(m[1]),
        g: Number(m[2]),
        b: Number(m[3]),
        a: m[4] === undefined ? 1 : Number(m[4]),
      }
    }

    function blend(fg, bg) {
      const a = fg.a + bg.a * (1 - fg.a)
      if (a === 0) return bg
      return {
        r: (fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / a,
        g: (fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / a,
        b: (fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / a,
        a,
      }
    }

    function luminance({ r, g, b }) {
      const srgb = [r, g, b].map((v) => {
        const c = v / 255
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
      })
      return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2]
    }

    function contrastRatio(fg, bg) {
      const l1 = luminance(fg)
      const l2 = luminance(bg)
      const lighter = Math.max(l1, l2)
      const darker = Math.min(l1, l2)
      return (lighter + 0.05) / (darker + 0.05)
    }

    function getOpaqueBackground(el) {
      const layers = []
      let node = el
      while (node && node.nodeType === Node.ELEMENT_NODE) {
        const bg = parseRgb(getComputedStyle(node).backgroundColor)
        if (bg) layers.push(bg)
        node = node.parentElement
      }

      layers.reverse()
      let composite = parseRgb(getComputedStyle(document.documentElement).backgroundColor)
        ?? { r: 255, g: 255, b: 255, a: 1 }

      for (const layer of layers) {
        composite = blend(layer, composite)
      }

      return { r: composite.r, g: composite.g, b: composite.b, a: 1 }
    }

    function isIgnoredElement(el) {
      if (el.closest('[aria-label="Analytics consent"]')) return true
      if (el.closest('[data-testid="threshold-help"]')) return true
      return false
    }

    function isVisible(el) {
      const style = getComputedStyle(el)
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) {
        return false
      }
      const rect = el.getBoundingClientRect()
      return rect.width > 0 && rect.height > 0
    }

    function cssPath(el) {
      if (!el || el.nodeType !== Node.ELEMENT_NODE) return ''
      const parts = []
      let node = el
      while (node && node.nodeType === Node.ELEMENT_NODE && parts.length < 5) {
        let part = node.tagName.toLowerCase()
        if (node.id) {
          part += `#${node.id}`
          parts.unshift(part)
          break
        }
        if (node.className && typeof node.className === 'string') {
          const cls = node.className.trim().split(/\s+/).slice(0, 2).join('.')
          if (cls) part += `.${cls}`
        }
        parts.unshift(part)
        node = node.parentElement
      }
      return parts.join(' > ')
    }

    function isLargeText(fontSizePx, fontWeight) {
      return fontSizePx >= 24 || (fontSizePx >= 18.66 && fontWeight >= 700)
    }

    const failures = []
    const seen = new Set()

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.textContent?.trim()) return NodeFilter.FILTER_REJECT
        const parent = node.parentElement
        if (!parent) return NodeFilter.FILTER_REJECT
        const tag = parent.tagName
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'SVG') {
          return NodeFilter.FILTER_REJECT
        }
        if (!isVisible(parent)) return NodeFilter.FILTER_REJECT
        return NodeFilter.FILTER_ACCEPT
      },
    })

    while (walker.nextNode()) {
      const el = walker.currentNode.parentElement
      if (isIgnoredElement(el)) continue
      const style = getComputedStyle(el)
      const fg = parseRgb(style.color)
      if (!fg) continue
      const bg = getOpaqueBackground(el)
      const ratio = contrastRatio(fg, bg)
      const fontSizePx = Number.parseFloat(style.fontSize)
      const fontWeight = Number.parseInt(style.fontWeight, 10) || 400
      const required = isLargeText(fontSizePx, fontWeight) ? 3 : 4.5
      if (ratio >= required) continue

      const text = el.textContent.trim().replace(/\s+/g, ' ').slice(0, 80)
      const key = `${text}|${ratio.toFixed(2)}|${cssPath(el)}`
      if (seen.has(key)) continue
      seen.add(key)

      failures.push({
        type: 'contrast',
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute('role') ?? '',
        text,
        ratio,
        required,
        fg: style.color,
        bg: `rgb(${Math.round(bg.r)}, ${Math.round(bg.g)}, ${Math.round(bg.b)})`,
        selector: cssPath(el),
      })
    }

    const interactives = document.querySelectorAll('a, button, [role="button"], input, select, textarea, summary')
    for (const el of interactives) {
      if (!isVisible(el)) continue
      if (isIgnoredElement(el)) continue
      const tag = el.tagName.toLowerCase()
      if (tag === 'a' && !el.getAttribute('href') && !el.getAttribute('role')) continue
      const rect = el.getBoundingClientRect()
      if (rect.width >= 40 && rect.height >= 40) continue

      const label = (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 80)
      failures.push({
        type: 'target-size',
        tag,
        role: el.getAttribute('role') ?? '',
        text: label,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        selector: cssPath(el),
      })
    }

    return failures
  })
}

async function main() {
  const allowlist = loadAllowlist()
  let previewProcess = null
  let baseUrl = defaultBaseUrl

  const serverUp = await waitForServer(baseUrl, 1500)
  if (!serverUp) {
    previewProcess = startPreview()
    const ready = await waitForServer(baseUrl, 45000)
    if (!ready) {
      previewProcess.kill('SIGTERM')
      throw new Error(`Preview server not reachable at ${baseUrl}`)
    }
  }

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: resolveChromePath(),
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  })

  const violations = []

  try {
    const page = await browser.newPage()
    await page.setViewport(viewport)

    for (const route of ROUTES) {
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
      await applyAccessPreset(page, route.access)
      await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'networkidle2', timeout: 90000 })
      if (route.waitMs) await new Promise((r) => setTimeout(r, route.waitMs))

      const failures = await auditPage(page)
      for (const failure of failures) {
        if (isAllowlisted(route.path, failure, allowlist)) continue
        violations.push({ route: route.path, ...failure })
      }
    }
  } finally {
    await browser.close()
    if (previewProcess) previewProcess.kill('SIGTERM')
  }

  if (violations.length) {
    console.error('Rendered contrast / target-size violations:\n')
    for (const v of violations) {
      if (v.type === 'contrast') {
        console.error(
          `  ${v.route} [contrast] ${v.ratio.toFixed(2)}:1 (need ${v.required}:1) — ${v.tag} "${v.text}" (${v.fg} on ${v.bg})`,
        )
      } else {
        console.error(
          `  ${v.route} [target-size] ${v.width}×${v.height}px — ${v.tag} "${v.text}"`,
        )
      }
    }
    console.error(`\n${violations.length} violation(s). Allowlist: scripts/contrast-allowlist.json`)
    console.error('See DESIGN_LAW.md → Enforcement')
    process.exit(1)
  }

  console.log(`check:contrast passed (${ROUTES.length} routes at ${viewport.width}×${viewport.height})`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
