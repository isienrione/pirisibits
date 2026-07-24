import { describe, expect, it } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  INDEXABLE_PUBLIC_PATHS,
  NOINDEX_PATH_PREFIXES,
  PRODUCTION_ORIGIN,
  isIndexablePublicPath,
  isNoindexPath,
  resolveDocumentSeo,
  toAbsoluteUrl,
} from '../siteRoutes.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..')

function readPublic(name) {
  return readFileSync(join(ROOT, 'public', name), 'utf8')
}

function extractRouterPaths(appRouterSource) {
  return [...appRouterSource.matchAll(/path=["']([^"']+)["']/g)].map((m) => m[1])
}

function extractFooterLegalPaths(footerSource) {
  return [...footerSource.matchAll(/to:\s*['"]([^'"]+)['"]/g)].map((m) => m[1])
}

function parseSitemapLocs(xml) {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1].trim())
}

describe('siteRoutes SEO inventory', () => {
  it('marks landing/legal/contact as indexable with absolute canonicals', () => {
    for (const path of INDEXABLE_PUBLIC_PATHS) {
      expect(isIndexablePublicPath(path)).toBe(true)
      const seo = resolveDocumentSeo(path)
      expect(seo.robots).toBe('index,follow')
      expect(seo.canonicalHref).toBe(toAbsoluteUrl(path))
      expect(seo.canonicalHref.startsWith(`${PRODUCTION_ORIGIN}/`)).toBe(true)
    }
  })

  it('marks credential/transactional/app routes as noindex', () => {
    const samples = [
      '/access',
      '/access/confirmed',
      '/invite',
      '/setup',
      '/journey',
      '/walk-together',
      '/settings',
      '/journal/colosseum',
      '/purchase',
      '/checkout',
      '/preview',
      '/preview/colosseum',
      '/preview/waypoint/pantheon',
      '/credits',
    ]
    for (const path of samples) {
      expect(isNoindexPath(path)).toBe(true)
      expect(resolveDocumentSeo(path).robots).toBe('noindex,nofollow')
      expect(resolveDocumentSeo(path).canonicalHref).toBeNull()
    }
  })

  it('keeps noindex prefixes disjoint from indexable public paths', () => {
    for (const path of INDEXABLE_PUBLIC_PATHS) {
      expect(isNoindexPath(path)).toBe(false)
    }
    for (const prefix of NOINDEX_PATH_PREFIXES) {
      expect(INDEXABLE_PUBLIC_PATHS).not.toContain(prefix)
    }
  })
})

describe('public robots.txt + sitemap.xml', () => {
  it('ships plain-text robots syntax allowing marketing and disallowing private routes', () => {
    const robots = readPublic('robots.txt')
    expect(robots).not.toMatch(/<!doctype html>/i)
    expect(robots).toMatch(/^User-agent:\s*\*/m)
    expect(robots).toMatch(/^Allow:\s*\/landing$/m)
    expect(robots).toMatch(/^Allow:\s*\/legal\/$/m)
    expect(robots).toMatch(/^Allow:\s*\/contact$/m)
    expect(robots).toMatch(/^Sitemap:\s*https:\/\/chronowalk\.com\/sitemap\.xml$/m)

    for (const prefix of [
      '/access',
      '/invite',
      '/setup',
      '/journey',
      '/walk-together',
      '/settings',
      '/journal',
      '/purchase',
      '/checkout',
      '/preview',
    ]) {
      expect(robots).toMatch(new RegExp(`^Disallow:\\s*${prefix.replace('/', '\\/')}$`, 'm'))
    }
  })

  it('ships valid sitemap XML with only real public AppRouter + footer routes', () => {
    const xml = readPublic('sitemap.xml')
    expect(xml).not.toMatch(/<!doctype html>/i)
    expect(xml.trimStart().startsWith('<?xml')).toBe(true)
    expect(xml).toContain('<urlset')
    expect(xml).toContain('</urlset>')

    const locs = parseSitemapLocs(xml)
    expect(locs.length).toBeGreaterThan(0)

    const expected = INDEXABLE_PUBLIC_PATHS.map(toAbsoluteUrl)
    expect(locs).toEqual(expected)

    const router = readFileSync(join(ROOT, 'src/app/AppRouter.jsx'), 'utf8')
    const routerPaths = extractRouterPaths(router)
    const footer = readFileSync(join(ROOT, 'src/landing/LandingSiteFooter.jsx'), 'utf8')
    const footerLegal = extractFooterLegalPaths(footer)

    for (const loc of locs) {
      expect(loc.startsWith(`${PRODUCTION_ORIGIN}/`)).toBe(true)
      const path = loc.slice(PRODUCTION_ORIGIN.length)
      expect(routerPaths).toContain(path)
      expect(INDEXABLE_PUBLIC_PATHS).toContain(path)
      if (path !== '/landing') {
        expect(footerLegal).toContain(path)
      }
    }

    for (const banned of [
      '/access',
      '/invite',
      '/setup',
      '/journey',
      '/walk-together',
      '/settings',
      '/journal',
      '/preview',
      '/purchase',
      '/checkout',
      '/credits',
    ]) {
      expect(locs.some((loc) => loc.includes(banned))).toBe(false)
    }

    // No fabricated lastmod dates
    expect(xml).not.toContain('<lastmod>')
  })

  it('declares robots/sitemap Content-Type in Cloudflare _headers', () => {
    const headers = readFileSync(join(ROOT, 'public/_headers'), 'utf8')
    expect(headers).toMatch(/\/robots\.txt[\s\S]*?Content-Type:\s*text\/plain/)
    expect(headers).toMatch(/\/sitemap\.xml[\s\S]*?Content-Type:\s*application\/xml/)
  })

  it('does not include SEO files in PWA includeAssets / glob shell unless intentional', () => {
    const vite = readFileSync(join(ROOT, 'vite.config.js'), 'utf8')
    expect(vite).not.toMatch(/robots\.txt/)
    expect(vite).not.toMatch(/sitemap\.xml/)
    // globPatterns is js/css/html/ico/svg/woff2/json — excludes txt/xml
    expect(vite).toMatch(/globPatterns:\s*\[[^\]]*js,css,html/)
  })
})

describe('built dist SEO files (when present)', () => {
  it('copies robots.txt and sitemap.xml unchanged and not as HTML', () => {
    const distRobots = join(ROOT, 'dist/robots.txt')
    const distSitemap = join(ROOT, 'dist/sitemap.xml')
    if (!existsSync(distRobots) || !existsSync(distSitemap)) {
      // Build may not have run yet in unit-only CI shards.
      expect(existsSync(join(ROOT, 'public/robots.txt'))).toBe(true)
      expect(existsSync(join(ROOT, 'public/sitemap.xml'))).toBe(true)
      return
    }

    const robots = readFileSync(distRobots, 'utf8')
    const sitemap = readFileSync(distSitemap, 'utf8')
    expect(robots.trimStart().toLowerCase().startsWith('<!doctype html>')).toBe(false)
    expect(sitemap.trimStart().toLowerCase().startsWith('<!doctype html>')).toBe(false)
    expect(robots).toContain('Sitemap: https://chronowalk.com/sitemap.xml')
    expect(sitemap).toContain('<loc>https://chronowalk.com/landing</loc>')
    expect(robots).toBe(readPublic('robots.txt'))
    expect(sitemap).toBe(readPublic('sitemap.xml'))
  })
})
