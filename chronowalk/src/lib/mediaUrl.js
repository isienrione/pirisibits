/** Resolve manifest media paths against VITE_MEDIA_BASE (R2 CDN). */
const blobCache = new Map()

function resolveNetworkMediaUrl(path) {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path

  const base = import.meta.env.VITE_MEDIA_BASE?.replace(/\/$/, '') ?? ''
  const normalized = path.startsWith('/') ? path : `/${path}`
  return base ? `${base}${normalized}` : normalized
}

/**
 * Stable cache-storage key for offline assets (always the CDN URL, never a blob URL).
 * @param {string} manifestPath
 */
export function cacheUrlForManifestPath(manifestPath) {
  return resolveNetworkMediaUrl(manifestPath)
}

/** Network/CDN URL only · never a Cache API blob. */
export function networkMediaUrl(path) {
  return resolveNetworkMediaUrl(path)
}

/**
 * Register a cached blob URL for offline threshold media and heroes.
 * @param {string} manifestPath e.g. /rome/img/w01_now.avif
 * @param {string} blobUrl
 */
export function registerCachedMedia(manifestPath, blobUrl) {
  if (manifestPath && blobUrl) blobCache.set(manifestPath, blobUrl)
}

/** Drop a poisoned offline blob so callers can fall back to the network URL. */
export function unregisterCachedMedia(manifestPath) {
  if (!manifestPath) return
  blobCache.delete(manifestPath)
  try {
    if (/^https?:\/\//i.test(manifestPath)) {
      const pathname = new URL(manifestPath).pathname
      if (pathname) blobCache.delete(pathname)
    }
  } catch {
    // ignore
  }
}

export function clearCachedMedia() {
  blobCache.clear()
}

export function mediaUrl(path) {
  if (!path) return null
  if (blobCache.has(path)) return blobCache.get(path)
  // Threshold/C6 often receive absolute CDN URLs after resolvePhotoUrl; offline
  // blobs are keyed by the manifest path (`/waypoints/...`).
  try {
    if (/^https?:\/\//i.test(path)) {
      const pathname = new URL(path).pathname
      if (pathname && blobCache.has(pathname)) return blobCache.get(pathname)
    }
  } catch {
    // ignore bad URLs
  }
  return resolveNetworkMediaUrl(path)
}
