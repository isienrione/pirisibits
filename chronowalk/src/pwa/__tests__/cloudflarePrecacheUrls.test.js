import { describe, expect, it } from 'vitest'
import {
  APP_SHELL_PRECACHE_URL,
  isUnsafePrecacheUrl,
  mapManifestToCloudflareCanonical,
  toCloudflareCanonicalUrl,
} from '../cloudflarePrecacheUrls.js'

describe('cloudflarePrecacheUrls', () => {
  it('maps the SPA shell to / (not /landing) so Workbox install gets HTTP 200', () => {
    expect(APP_SHELL_PRECACHE_URL).toBe('/')
    expect(toCloudflareCanonicalUrl('index.html')).toBe('/')
    expect(toCloudflareCanonicalUrl('/index.html')).toBe('/')
    expect(toCloudflareCanonicalUrl('/')).toBe('/')
    expect(toCloudflareCanonicalUrl('/landing')).toBe('/')
    expect(toCloudflareCanonicalUrl('offline.html')).toBe('/offline')
    expect(toCloudflareCanonicalUrl('/offline.html')).toBe('/offline')
    expect(toCloudflareCanonicalUrl('assets/app.js')).toBe('assets/app.js')
  })

  it('flags /landing and /index.html as unsafe for precache (production redirects)', () => {
    expect(isUnsafePrecacheUrl('/')).toBe(false)
    expect(isUnsafePrecacheUrl('/index.html')).toBe(true)
    expect(isUnsafePrecacheUrl('/landing')).toBe(true)
    expect(isUnsafePrecacheUrl('/offline')).toBe(false)
    expect(isUnsafePrecacheUrl('assets/app.js')).toBe(false)
  })

  it('rewrites and dedupes manifest entries used by Workbox precache', () => {
    expect(
      mapManifestToCloudflareCanonical([
        { url: 'index.html', revision: 'abc' },
        { url: '/index.html', revision: 'abc' },
        { url: '/', revision: 'abc' },
        { url: '/landing', revision: 'abc' },
        { url: 'offline.html', revision: 'def' },
        { url: 'offline.html', revision: 'def' },
        'assets/app.js',
      ]),
    ).toEqual([
      { url: '/', revision: 'abc' },
      { url: '/offline', revision: 'def' },
      'assets/app.js',
    ])
  })
})
