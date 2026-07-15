import { describe, expect, it } from 'vitest'
import {
  mapManifestToCloudflareCanonical,
  toCloudflareCanonicalUrl,
} from '../cloudflarePrecacheUrls.js'

describe('cloudflarePrecacheUrls', () => {
  it('maps SPA and offline HTML to Cloudflare pretty URLs', () => {
    expect(toCloudflareCanonicalUrl('index.html')).toBe('/')
    expect(toCloudflareCanonicalUrl('/index.html')).toBe('/')
    expect(toCloudflareCanonicalUrl('offline.html')).toBe('/offline')
    expect(toCloudflareCanonicalUrl('/offline.html')).toBe('/offline')
    expect(toCloudflareCanonicalUrl('assets/app.js')).toBe('assets/app.js')
  })

  it('rewrites and dedupes manifest entries used by Workbox precache', () => {
    expect(
      mapManifestToCloudflareCanonical([
        { url: 'index.html', revision: 'abc' },
        { url: '/index.html', revision: 'abc' },
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
