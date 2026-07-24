#!/usr/bin/env node
/**
 * Post-build / operator checks for Cloudflare Pages + Workbox install safety.
 *
 * Usage (after npm run build):
 *   node scripts/verify-pwa-routing.mjs
 *
 * Optional live probe (read-only; never deploys):
 *   VERIFY_LIVE=1 node scripts/verify-pwa-routing.mjs
 */
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  APP_SHELL_PRECACHE_URL,
  isUnsafePrecacheUrl,
  mapManifestToCloudflareCanonical,
} from '../src/pwa/cloudflarePrecacheUrls.js'
import {
  INDEXABLE_PUBLIC_PATHS,
  PRODUCTION_ORIGIN,
  toAbsoluteUrl,
} from '../src/seo/siteRoutes.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const errors = []

function fail(message) {
  errors.push(message)
  console.error(`FAIL: ${message}`)
}

function ok(message) {
  console.log(`OK: ${message}`)
}

function checkRedirects(source, label) {
  const lines = source
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))

  const hasApex = lines.some((line) => /^\/\s+\/landing\s+302$/.test(line))
  const hasSpa = lines.some((line) => /^\/\*\s+\/index\.html\s+200$/.test(line))
  const hasAssets404 = lines.some((line) => line.startsWith('/assets/*') && /\s404\s*$/.test(line))

  if (!hasApex) fail(`${label}: missing \`/ → /landing 302\``)
  else ok(`${label}: / → /landing 302`)

  if (!hasSpa) fail(`${label}: missing \`/* → /index.html 200\``)
  else ok(`${label}: /* → /index.html 200 (covers /landing, /walk-together, …)`)

  if (hasAssets404) {
    fail(`${label}: /assets/* 404 rule present (broke /landing on Cloudflare Pages)`)
  } else {
    ok(`${label}: no /assets/* 404 rule`)
  }
}

function checkBuiltSw(swSource) {
  if (!swSource.includes(`"url":"${APP_SHELL_PRECACHE_URL}"`)) {
    fail(`dist/sw.js precache missing ${APP_SHELL_PRECACHE_URL}`)
  } else {
    ok(`dist/sw.js precache includes ${APP_SHELL_PRECACHE_URL}`)
  }

  const urlMatches = [...swSource.matchAll(/"url":"([^"]+)"/g)].map((m) => m[1])
  const unsafe = urlMatches.filter((url) => isUnsafePrecacheUrl(url))
  if (unsafe.length) {
    fail(`dist/sw.js precache contains unsafe URLs: ${unsafe.join(', ')}`)
  } else {
    ok('dist/sw.js precache has no bare / or /index.html entries')
  }

  if (!/status!==200/.test(swSource) && !/status !== 200/.test(swSource)) {
    fail('dist/sw.js missing status validation in cache plugin')
  } else {
    ok('dist/sw.js includes response status validation')
  }

  if (/"url":"\/robots\.txt"/.test(swSource) || /"url":"\/sitemap\.xml"/.test(swSource)) {
    fail('dist/sw.js should not precache robots.txt / sitemap.xml into the offline shell')
  } else {
    ok('dist/sw.js does not precache robots.txt / sitemap.xml')
  }
}

function checkManifestTransformUnit() {
  const mapped = mapManifestToCloudflareCanonical([
    { url: 'index.html', revision: 'x' },
    { url: '/', revision: 'x' },
  ])
  if (mapped.some((e) => isUnsafePrecacheUrl(typeof e === 'string' ? e : e.url))) {
    fail('mapManifestToCloudflareCanonical still emits unsafe URLs')
  } else {
    ok('manifest transform maps index.html → /landing only')
  }
}

function looksLikeHtml(body) {
  return /^\s*<!doctype\s+html/i.test(body) || /^\s*<html[\s>]/i.test(body)
}

function checkSeoStaticFiles() {
  const publicRobots = join(ROOT, 'public/robots.txt')
  const publicSitemap = join(ROOT, 'public/sitemap.xml')

  if (!existsSync(publicRobots)) {
    fail('public/robots.txt missing')
  } else {
    const robots = readFileSync(publicRobots, 'utf8')
    if (looksLikeHtml(robots)) fail('public/robots.txt looks like HTML')
    else if (!/^User-agent:\s*\*/m.test(robots)) fail('public/robots.txt missing User-agent: *')
    else if (!/^Sitemap:\s*https:\/\/chronowalk\.com\/sitemap\.xml$/m.test(robots)) {
      fail('public/robots.txt missing production Sitemap line')
    } else ok('public/robots.txt present (plain-text robots syntax)')
  }

  if (!existsSync(publicSitemap)) {
    fail('public/sitemap.xml missing')
  } else {
    const sitemap = readFileSync(publicSitemap, 'utf8')
    if (looksLikeHtml(sitemap)) fail('public/sitemap.xml looks like HTML')
    else if (!sitemap.includes('<urlset') || !sitemap.includes('</urlset>')) {
      fail('public/sitemap.xml missing urlset')
    } else {
      const locs = [...sitemap.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1].trim())
      const expected = INDEXABLE_PUBLIC_PATHS.map(toAbsoluteUrl)
      const missing = expected.filter((url) => !locs.includes(url))
      const extra = locs.filter((url) => !expected.includes(url))
      if (missing.length || extra.length) {
        fail(
          `public/sitemap.xml locs mismatch (missing=${missing.join(',') || '—'} extra=${extra.join(',') || '—'})`,
        )
      } else if (locs.some((url) => !url.startsWith(`${PRODUCTION_ORIGIN}/`))) {
        fail('public/sitemap.xml contains non-production URLs')
      } else ok('public/sitemap.xml present with indexable public URLs only')
    }
  }

  for (const name of ['robots.txt', 'sitemap.xml']) {
    const distPath = join(ROOT, 'dist', name)
    if (!existsSync(distPath)) {
      console.warn(`WARN: dist/${name} missing — run npm run build first for full checks`)
      continue
    }
    const body = readFileSync(distPath, 'utf8')
    if (looksLikeHtml(body)) fail(`dist/${name} begins with HTML (SPA shell leak)`)
    else ok(`dist/${name} present and not HTML`)
  }

  const headers = readFileSync(join(ROOT, 'public/_headers'), 'utf8')
  if (!/\/robots\.txt[\s\S]*?Content-Type:\s*text\/plain/.test(headers)) {
    fail('public/_headers missing robots.txt text/plain Content-Type')
  } else ok('public/_headers: robots.txt → text/plain')

  if (!/\/sitemap\.xml[\s\S]*?Content-Type:\s*application\/xml/.test(headers)) {
    fail('public/_headers missing sitemap.xml application/xml Content-Type')
  } else ok('public/_headers: sitemap.xml → application/xml')
}

async function probeLive() {
  const base = process.env.VERIFY_BASE_URL || 'https://chronowalk.com'
  const fetchHead = async (path) => {
    const response = await fetch(`${base}${path}`, {
      method: 'GET',
      redirect: 'manual',
      headers: { Accept: '*/*' },
    })
    return response
  }

  const root = await fetchHead('/')
  if (root.status !== 302 && root.status !== 301) {
    fail(`live ${base}/ expected 302, got ${root.status}`)
  } else {
    const location = root.headers.get('location') || ''
    if (!location.includes('/landing')) {
      fail(`live ${base}/ Location should include /landing, got ${location}`)
    } else {
      ok(`live ${base}/ → ${location} (${root.status})`)
    }
  }

  for (const path of ['/landing', '/walk-together']) {
    const response = await fetchHead(path)
    const ct = response.headers.get('content-type') || ''
    if (response.status !== 200 || !/text\/html/i.test(ct)) {
      fail(`live ${base}${path} expected 200 text/html, got ${response.status} ${ct}`)
    } else {
      ok(`live ${base}${path} → 200 text/html`)
    }
  }

  const robotsRes = await fetchHead('/robots.txt')
  const robotsCt = robotsRes.headers.get('content-type') || ''
  const robotsBody = await robotsRes.text()
  if (
    robotsRes.status !== 200 ||
    /html/i.test(robotsCt) ||
    looksLikeHtml(robotsBody) ||
    !/User-agent:/i.test(robotsBody)
  ) {
    fail(
      `live ${base}/robots.txt expected 200 non-HTML plain robots, got ${robotsRes.status} ${robotsCt}`,
    )
  } else {
    ok(`live ${base}/robots.txt → 200 ${robotsCt || 'text/plain'}`)
  }

  const sitemapRes = await fetchHead('/sitemap.xml')
  const sitemapCt = sitemapRes.headers.get('content-type') || ''
  const sitemapBody = await sitemapRes.text()
  if (
    sitemapRes.status !== 200 ||
    !/(application|text)\/xml/i.test(sitemapCt) ||
    looksLikeHtml(sitemapBody) ||
    !/<urlset/i.test(sitemapBody)
  ) {
    fail(
      `live ${base}/sitemap.xml expected 200 XML, got ${sitemapRes.status} ${sitemapCt}`,
    )
  } else {
    ok(`live ${base}/sitemap.xml → 200 ${sitemapCt}`)
  }

  // Discover a real hashed chunk from the landing document.
  const landing = await fetch(`${base}/landing`, { redirect: 'follow' })
  const html = await landing.text()
  const asset = html.match(/\/assets\/[^"']+\.js/)?.[0]
  if (!asset) {
    fail('live landing HTML did not reference a /assets/*.js chunk')
  } else {
    const assetRes = await fetchHead(asset)
    const ct = assetRes.headers.get('content-type') || ''
    if (assetRes.status !== 200 || !/javascript/i.test(ct)) {
      fail(`live ${asset} expected 200 javascript, got ${assetRes.status} ${ct}`)
    } else {
      ok(`live ${asset} → 200 ${ct}`)
    }
  }
}

checkManifestTransformUnit()
checkSeoStaticFiles()

const publicRedirects = join(ROOT, 'public/_redirects')
checkRedirects(readFileSync(publicRedirects, 'utf8'), 'public/_redirects')

const distRedirects = join(ROOT, 'dist/_redirects')
if (existsSync(distRedirects)) {
  checkRedirects(readFileSync(distRedirects, 'utf8'), 'dist/_redirects')
} else {
  console.warn('WARN: dist/_redirects missing — run npm run build first for full checks')
}

const distSw = join(ROOT, 'dist/sw.js')
if (existsSync(distSw)) {
  checkBuiltSw(readFileSync(distSw, 'utf8'))
} else {
  console.warn('WARN: dist/sw.js missing — run npm run build first for full checks')
}

if (existsSync(join(ROOT, 'public/404.html'))) {
  fail('public/404.html should be removed (unused after dropping assets 404 rule)')
} else {
  ok('public/404.html absent')
}

if (process.env.VERIFY_LIVE === '1') {
  await probeLive()
} else {
  console.log('SKIP: live probes (set VERIFY_LIVE=1 to curl production read-only)')
}

if (errors.length) {
  console.error(`\n${errors.length} verification failure(s)`)
  process.exit(1)
}

console.log('\nverify-pwa-routing: all checks passed')
