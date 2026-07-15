/**
 * Cloudflare Pages "Pretty URLs" redirect `*.html` to extensionless paths
 * (`/index.html` → `/`, `/offline.html` → `/offline`). Workbox must precache
 * the canonical 200 URLs or navigation can fail with Chrome ERR_FAILED.
 */
export function toCloudflareCanonicalUrl(url) {
  if (url === 'index.html' || url === '/index.html') return '/'
  if (url === 'offline.html' || url === '/offline.html') return '/offline'
  return url
}

export function mapManifestToCloudflareCanonical(manifest = []) {
  const seen = new Set()
  const mapped = []

  for (const entry of manifest) {
    if (typeof entry === 'string') {
      const url = toCloudflareCanonicalUrl(entry)
      if (seen.has(url)) continue
      seen.add(url)
      mapped.push(url)
      continue
    }

    const url = toCloudflareCanonicalUrl(entry.url)
    if (seen.has(url)) continue
    seen.add(url)
    mapped.push({ ...entry, url })
  }

  return mapped
}
