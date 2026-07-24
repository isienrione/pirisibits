import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..')

describe('Cloudflare SPA + asset caching headers', () => {
  it('serves a real 404 for missing /assets/* instead of SPA index.html', () => {
    const redirects = readFileSync(join(ROOT, 'public/_redirects'), 'utf8')
    expect(redirects).toMatch(/\/assets\/\*\s+\/404\.html\s+404/)
    const lines = redirects
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
    const assetsIdx = lines.findIndex((line) => line.startsWith('/assets/*'))
    const spaIdx = lines.findIndex((line) => /^\/\*\s+/.test(line))
    expect(assetsIdx).toBeGreaterThanOrEqual(0)
    expect(spaIdx).toBeGreaterThan(assetsIdx)
  })

  it('keeps index.html and sw.js revalidating; hashes assets as immutable', () => {
    const headers = readFileSync(join(ROOT, 'public/_headers'), 'utf8')
    expect(headers).toMatch(/\/sw\.js[\s\S]*?no-cache/)
    expect(headers).toMatch(/\/index\.html[\s\S]*?no-cache/)
    expect(headers).toMatch(/\/assets\/\*[\s\S]*?immutable/)
  })

  it('service worker source rejects HTML for asset/module routes', () => {
    const sw = readFileSync(join(ROOT, 'src/pwa/sw.js'), 'utf8')
    expect(sw).toContain('isAssetOrModuleRequest')
    expect(sw).toContain('rejectHtmlAssetPlugin')
    expect(sw).toContain('scrubHtmlPoisonedCaches')
    expect(sw).toContain("BUILD_PREFIX + '-assets'")
  })
})
