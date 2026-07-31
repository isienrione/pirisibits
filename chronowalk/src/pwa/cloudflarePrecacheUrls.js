/**
 * Cloudflare Pages routing vs Workbox precache URLs.
 *
 * Pretty URLs: `/index.html` → `/` (308), `/offline.html` → `/offline` (308).
 * Legacy rule: `/landing` → `/` (301). Workbox precache REQUIRES a final HTTP 200
 * without following a redirect chain - precaching `/landing` fails once it only
 * redirects, and `/index.html` fails under Pretty URLs.
 *
 * Therefore the SPA shell is precached at `/` (the stable 200 document URL).
 */
export const APP_SHELL_PRECACHE_URL = '/'
export const OFFLINE_PRECACHE_URL = '/offline'

export function toCloudflareCanonicalUrl(url) {
  if (url === 'index.html' || url === '/index.html' || url === '/' || url === '') {
    return APP_SHELL_PRECACHE_URL
  }
  if (url === 'offline.html' || url === '/offline.html') {
    return OFFLINE_PRECACHE_URL
  }
  // Never emit /landing - it permanently redirects to / in production.
  if (url === '/landing' || url === 'landing') return APP_SHELL_PRECACHE_URL
  if (url === '/index' || url === 'index') return APP_SHELL_PRECACHE_URL
  return url
}

/**
 * True when a precache URL is unsafe because production redirects it away
 * (Workbox install would get bad-precaching-response).
 */
export function isUnsafePrecacheUrl(url) {
  const normalized = String(url || '').split('?')[0]
  return (
    normalized === '/landing' ||
    normalized === '/index.html' ||
    normalized === '/index'
  )
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
