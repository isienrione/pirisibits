/**
 * Cloudflare Pages routing vs Workbox precache URLs.
 *
 * Pretty URLs: `/index.html` → `/` (308), `/offline.html` → `/offline` (308).
 * Apex rule: `/` → `/landing` (302). Workbox precache REQUIRES a final HTTP 200
 * without following a redirect chain · precaching `/` fails when `/` is only a
 * 302 (and failed harder when SPA fallback briefly returned 404 in deploy 8a799eb).
 *
 * Therefore the SPA shell is precached at `/landing` (the stable 200 document URL).
 */
export const APP_SHELL_PRECACHE_URL = '/landing'
export const OFFLINE_PRECACHE_URL = '/offline'

export function toCloudflareCanonicalUrl(url) {
  if (url === 'index.html' || url === '/index.html' || url === '/' || url === '') {
    return APP_SHELL_PRECACHE_URL
  }
  if (url === 'offline.html' || url === '/offline.html') {
    return OFFLINE_PRECACHE_URL
  }
  // Never emit bare `/` · it redirects to /landing in production.
  if (url === '/index' || url === 'index') return APP_SHELL_PRECACHE_URL
  return url
}

/**
 * True when a precache URL is unsafe because production redirects it away
 * (Workbox install would get bad-precaching-response).
 */
export function isUnsafePrecacheUrl(url) {
  const normalized = String(url || '').split('?')[0]
  return normalized === '/' || normalized === '' || normalized === '/index.html'
}

export function mapManifestToCloudflareCanonical(manifest = []) {
  const seen = new Set()
  const mapped = []

  for (const entry of manifest) {
    if (typeof entry === 'string') {
      const url = toCloudflareCanonicalUrl(entry)
      if (isUnsafePrecacheUrl(url)) continue
      if (seen.has(url)) continue
      seen.add(url)
      mapped.push(url)
      continue
    }

    const url = toCloudflareCanonicalUrl(entry.url)
    if (isUnsafePrecacheUrl(url)) continue
    if (seen.has(url)) continue
    seen.add(url)
    mapped.push({ ...entry, url })
  }

  return mapped
}
