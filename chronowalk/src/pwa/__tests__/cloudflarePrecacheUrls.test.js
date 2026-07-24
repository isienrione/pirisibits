import { describe, expect, it } from 'vitest'
import {
  APP_SHELL_PRECACHE_URL,
  isUnsafePrecacheUrl,
  mapManifestToCloudflareCanonical,
  toCloudflareCanonicalUrl,
} from '../cloudflarePrecacheUrls.js'

describe('cloudflarePrecacheUrls', () => {
  it('maps the SPA shell to /landing (not /) so Workbox install gets HTTP 200', () => {
    expect(APP_SHELL_PRECACHE_URL).toBe('/landing')
    expect(toCloudflareCanonicalUrl('index.html')).toBe('/landing')
    expect(toCloudflareCanonicalUrl('/index.html')).toBe('/landing')
    expect(toCloudflareCanonicalUrl('/')).toBe('/landing')
    expect(toCloudflareCanonicalUrl('offline.html')).toBe('/offline')
    expect(toCloudflareCanonicalUrl('/offline.html')).toBe('/offline')
    expect(toCloudflareCanonicalUrl('assets/app.js')).toBe('assets/app.js')
  })

  it('flags bare / as unsafe for precache (production 302 → /landing)', () => {
    expect(isUnsafePrecacheUrl('/')).toBe(true)
    expect(isUnsafePrecacheUrl('/index.html')).toBe(true)
    expect(isUnsafePrecacheUrl('/landing')).toBe(false)
    expect(isUnsafePrecacheUrl('/offline')).toBe(false)
    expect(isUnsafePrecacheUrl('assets/app.js')).toBe(false)
  })

  it('rewrites and dedupes manifest entries used by Workbox precache', () => {
    expect(
      mapManifestToCloudflareCanonical([
        { url: 'index.html', revision: 'abc' },
        { url: '/index.html', revision: 'abc' },
        { url: '/', revision: 'abc' },
        { url: 'offline.html', revision: 'def' },
        { url: 'offline.html', revision: 'def' },
        'assets/app.js',
      ]),
    ).toEqual([
      { url: '/landing', revision: 'abc' },
      { url: '/offline', revision: 'def' },
      'assets/app.js',
    ])
  })
})
