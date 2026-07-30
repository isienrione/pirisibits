import { describe, expect, it } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..')

function redirectLines(source) {
  return source
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
}

describe('Cloudflare SPA routing + SW asset HTML rejection', () => {
  it('preserves / → /landing 302 and SPA fallback without an assets 404 rule', () => {
    const redirects = readFileSync(join(ROOT, 'public/_redirects'), 'utf8')
    const lines = redirectLines(redirects)

    expect(lines.some((line) => /^\/\s+\/landing\s+302$/.test(line))).toBe(true)
    expect(lines.some((line) => /^\/\*\s+\/index\.html\s+200$/.test(line))).toBe(true)
    // The 8a799eb rule that broke /landing in production must stay gone.
    expect(lines.some((line) => line.startsWith('/assets/*'))).toBe(false)
    expect(existsSync(join(ROOT, 'public/404.html'))).toBe(false)

    // Document routes are covered by the catch-all SPA rewrite (not listed
    // individually); ensure no rule shadows /landing with a 404.
    expect(redirects).not.toMatch(/\/landing\s+[^\n]*\s+404/)
    expect(redirects).not.toMatch(/\/walk-together\s+[^\n]*\s+404/)
  })

  it('keeps index.html / landing / sw.js revalidating; hashes assets as immutable', () => {
    const headers = readFileSync(join(ROOT, 'public/_headers'), 'utf8')
    expect(headers).toMatch(/\/sw\.js[\s\S]*?no-cache/)
    expect(headers).toMatch(/\/index\.html[\s\S]*?no-cache/)
    expect(headers).toMatch(/\/landing[\s\S]*?no-cache/)
    expect(headers).toMatch(/\/reset-shell(?:\.html)?[\s\S]*?no-cache/)
    expect(headers).toMatch(/\/assets\/\*[\s\S]*?immutable/)
    expect(headers).toMatch(/\/robots\.txt[\s\S]*?Content-Type:\s*text\/plain/)
    expect(headers).toMatch(/\/sitemap\.xml[\s\S]*?Content-Type:\s*application\/xml/)
    expect(headers).not.toMatch(/\/404\.html/)
  })

  it('service worker source rejects HTML for asset/module routes and binds shell to /landing', () => {
    const sw = readFileSync(join(ROOT, 'src/pwa/sw.js'), 'utf8')
    expect(sw).toContain('isAssetOrModuleRequest')
    expect(sw).toContain('rejectHtmlAssetPlugin')
    expect(sw).toContain('scrubHtmlPoisonedCaches')
    expect(sw).toContain("BUILD_PREFIX + '-assets'")
    expect(sw).toContain('APP_SHELL_PRECACHE_URL')
    expect(sw).toContain("createHandlerBoundToURL(APP_SHELL_PRECACHE_URL)")
    expect(sw).toContain('OFFLINE_PRECACHE_URL')
    expect(sw).toContain('createHandlerBoundToURL(OFFLINE_PRECACHE_URL)')
    // Opaque failed navigations surface Safari’s native “no signal” interstitial.
    expect(sw).not.toMatch(/return\s+Response\.error\s*\(/)
    expect(sw).toMatch(/\/\^\\\/reset-shell\$\//)
    // Must not bind the offline shell to apex `/` (302 in production).
    expect(sw).not.toMatch(/createHandlerBoundToURL\(\s*['"]\/['"]\s*\)/)
    // Rome offline map tiles must be cache-first - NetworkOnly bricks walking maps.
    expect(sw).toContain('chronowalk-rome-map-tiles-v1')
    expect(sw).toContain('matchRomeMapTile')
    expect(sw).not.toMatch(/api\.mapbox\.com[\s\S]{0,80}NetworkOnly/)
  })

  it('ships a static reset-shell escape hatch outside the SPA', () => {
    expect(existsSync(join(ROOT, 'public/rome/reset-shell.html'))).toBe(true)
    const html = readFileSync(join(ROOT, 'public/rome/reset-shell.html'), 'utf8')
    expect(html).toContain('cw-skip-sw-once')
    expect(html).toContain('caches.delete')
    expect(html).toContain('unregister')
    expect(html).toContain('/landing?cw_bust=')
    expect(html).toContain("sessionStorage.setItem('cw-chunk-reload'")
    expect(html).toContain('cw-shell-reset-at')
    expect(html).not.toContain("sessionStorage.removeItem('cw-boot-reload'")
    expect(html).not.toContain("sessionStorage.removeItem('cw-chunk-reload'")

    const legacy = readFileSync(join(ROOT, 'public/reset-shell.html'), 'utf8')
    expect(legacy).toContain('/rome/reset-shell.html')
  })

  it('eager-loads the marketing landing page (no second poisonable chunk)', () => {
    const routes = readFileSync(join(ROOT, 'src/app/lazyRoutes.jsx'), 'utf8')
    expect(routes).toContain("import ChronoWalkLanding from '../landing/ChronoWalkLanding.jsx'")
    expect(routes).toMatch(/export function LazyLandingPage/)
    expect(routes).not.toMatch(/LazyLandingPage = lazyRoute\(\s*\(\)\s*=>\s*import\(['"]\.\.\/landing\/ChronoWalkLanding/)
  })
})
