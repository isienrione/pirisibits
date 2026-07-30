import { env } from '../config/env.js'
import { getManifestTourBounds, getManifestWaypointIds } from '../content/mapStops.js'

export const ROME_MAP_TILE_CACHE = 'chronowalk-rome-map-tiles-v1'
export const DEFAULT_MAP_STYLE_PATH = 'mapbox/standard'
export const DEFAULT_MAP_TILESET = 'mapbox.mapbox-streets-v8'
/** Cover walking-camera zooms (≈15.5–16.5) with a one-level buffer either side. */
export const DEFAULT_MAP_ZOOM_MIN = 13
export const DEFAULT_MAP_ZOOM_MAX = 17
/** ~1.1 km padding so route + user position near stops stay inside the tile hull. */
export const BOUNDS_PADDING_DEG = 0.01

const tileBlobUrls = new Map()

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function normalizeUrl(url) {
  try {
    const parsed = new URL(url)
    // Mapbox appends volatile billing/session params; strip so Cache + blob maps hit.
    parsed.searchParams.delete('sku')
    parsed.searchParams.delete('pluginName')
    parsed.searchParams.delete('fresh')
    return parsed.toString()
  } catch {
    return url
  }
}

/** Match a tile/style Response even when query params differ from download time. */
async function matchMapTileInCache(cache, url) {
  if (!cache || !url) return null

  const direct = await cache.match(url)
  if (direct?.ok) return direct

  const normalized = normalizeUrl(url)
  if (normalized !== url) {
    const normalizedMatch = await cache.match(normalized)
    if (normalizedMatch?.ok) return normalizedMatch
  }

  try {
    const target = new URL(url)
    const keys = await cache.keys()
    for (const key of keys) {
      try {
        const keyUrl = new URL(typeof key === 'string' ? key : key.url)
        if (keyUrl.pathname !== target.pathname) continue
        if (keyUrl.hostname !== target.hostname) continue
        const hit = await cache.match(key)
        if (hit?.ok) return hit
      } catch {
        // ignore malformed cache keys
      }
    }
  } catch {
    // ignore
  }

  return null
}

export function lngLatToTile(lng, lat, zoom) {
  const scale = 2 ** zoom
  const x = Math.floor(((lng + 180) / 360) * scale)
  const latRad = (lat * Math.PI) / 180
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * scale
  )
  return { z: zoom, x, y }
}

export function padBounds(bounds, padding = BOUNDS_PADDING_DEG) {
  if (!bounds) return null
  return {
    minLat: bounds.minLat - padding,
    maxLat: bounds.maxLat + padding,
    minLng: bounds.minLng - padding,
    maxLng: bounds.maxLng + padding,
    center: bounds.center,
  }
}

export function tilesCoveringBounds(bounds, zoomMin = DEFAULT_MAP_ZOOM_MIN, zoomMax = DEFAULT_MAP_ZOOM_MAX) {
  if (!bounds) return []

  const tiles = []
  const seen = new Set()

  for (let z = zoomMin; z <= zoomMax; z += 1) {
    const northWest = lngLatToTile(bounds.minLng, bounds.maxLat, z)
    const southEast = lngLatToTile(bounds.maxLng, bounds.minLat, z)

    for (let x = northWest.x; x <= southEast.x; x += 1) {
      for (let y = northWest.y; y <= southEast.y; y += 1) {
        const key = `${z}/${x}/${y}`
        if (seen.has(key)) continue
        seen.add(key)
        tiles.push({ z, x, y })
      }
    }
  }

  return tiles
}

export function parseMapboxStylePath(styleUrl = env.mapboxStyleUrl) {
  if (!styleUrl?.startsWith('mapbox://styles/')) return DEFAULT_MAP_STYLE_PATH
  return styleUrl.replace('mapbox://styles/', '')
}

export function styleJsonUrl(stylePath = DEFAULT_MAP_STYLE_PATH, token = env.mapboxToken) {
  if (!token) return null
  return `https://api.mapbox.com/styles/v1/${stylePath}?access_token=${token}`
}

export function vectorTileUrl(tile, token = env.mapboxToken, tileset = DEFAULT_MAP_TILESET) {
  if (!token) return null
  return `https://api.mapbox.com/v4/${tileset}/${tile.z}/${tile.x}/${tile.y}.vector.pbf?access_token=${token}`
}

export function listRomeMapTileUrls(
  manifest,
  {
    token = env.mapboxToken,
    stylePath = parseMapboxStylePath(),
    zoomMin = DEFAULT_MAP_ZOOM_MIN,
    zoomMax = DEFAULT_MAP_ZOOM_MAX,
  } = {}
) {
  if (!token || !manifest) return []

  const bounds = padBounds(
    getManifestTourBounds(manifest, getManifestWaypointIds(manifest, manifest.journey?.default_path ?? 'a'))
  )
  const urls = [styleJsonUrl(stylePath, token)].filter(Boolean)

  for (const tile of tilesCoveringBounds(bounds, zoomMin, zoomMax)) {
    const url = vectorTileUrl(tile, token)
    if (url) urls.push(url)
  }

  return urls
}

export function estimateRomeMapTileDownload(manifest, options = {}) {
  const urls = listRomeMapTileUrls(manifest, options)
  return {
    tileCount: urls.length,
    bytes: urls.length * 45_000,
  }
}

export function registerCachedMapTile(sourceUrl, blobUrl) {
  tileBlobUrls.set(normalizeUrl(sourceUrl), blobUrl)
}

export function clearCachedMapTiles() {
  for (const blobUrl of tileBlobUrls.values()) {
    URL.revokeObjectURL(blobUrl)
  }
  tileBlobUrls.clear()
}

export function resolveCachedMapTileUrl(url) {
  return tileBlobUrls.get(normalizeUrl(url)) ?? null
}

export function createMapboxTransformRequest() {
  return (url, resourceType) => {
    if (
      resourceType === 'Tile' ||
      resourceType === 'Style' ||
      resourceType === 'Source' ||
      resourceType === 'Glyphs' ||
      resourceType === 'SpriteImage' ||
      resourceType === 'SpriteJSON'
    ) {
      const cached = resolveCachedMapTileUrl(url)
      if (cached) return { url: cached }
      // Kick a background Cache API → blob register for the next request of this URL.
      void warmCachedMapTile(url)
    }
    return { url }
  }
}

async function warmCachedMapTile(url) {
  try {
    if (resolveCachedMapTileUrl(url)) return
    const cache = await openMapTileCache()
    const match = await matchMapTileInCache(cache, url)
    if (!match?.ok) return
    const blob = await match.blob()
    if (!blob.size) return
    registerCachedMapTile(url, URL.createObjectURL(blob))
  } catch {
    // ignore
  }
}

async function openMapTileCache() {
  if (typeof caches === 'undefined') {
    throw new Error('Cache storage is not supported in this browser.')
  }
  return caches.open(ROME_MAP_TILE_CACHE)
}

export async function verifyRomeMapTiles(manifest, options = {}) {
  const urls = listRomeMapTileUrls(manifest, options)
  if (!urls.length) {
    return { valid: true, total: 0, missing: [], skipped: true }
  }

  const cache = await openMapTileCache()
  const missing = []

  for (const url of urls) {
    const match = await matchMapTileInCache(cache, url)
    if (!match?.ok) {
      missing.push(url)
      continue
    }

    const blob = await match.blob()
    if (!blob.size) missing.push(url)
  }

  return {
    valid: missing.length === 0,
    total: urls.length,
    missing,
    skipped: false,
  }
}

export async function hydrateRomeMapTileCache(manifest, options = {}) {
  const cache = await openMapTileCache()
  let hydrated = 0

  const urls = listRomeMapTileUrls(manifest, options)
  for (const url of urls) {
    const response = await matchMapTileInCache(cache, url)
    if (!response?.ok) continue

    const blob = await response.blob()
    if (!blob.size) continue

    registerCachedMapTile(url, URL.createObjectURL(blob))
    hydrated += 1
  }

  // Register every Cache entry — older packages / URL variants still feed
  // sync transformRequest even when they fall outside the current URL list.
  try {
    const keys = await cache.keys()
    for (const request of keys) {
      const url = typeof request === 'string' ? request : request.url
      if (!url || resolveCachedMapTileUrl(url)) continue
      const response = await cache.match(request)
      if (!response?.ok) continue
      const blob = await response.blob()
      if (!blob.size) continue
      registerCachedMapTile(url, URL.createObjectURL(blob))
      hydrated += 1
    }
  } catch {
    // ignore cache enumeration failures
  }

  return { hydrated }
}

export async function downloadRomeMapTiles(manifest, { onProgress, signal, token = env.mapboxToken } = {}) {
  const urls = listRomeMapTileUrls(manifest, { token })
  if (!urls.length) {
    return { skipped: true, tileCount: 0 }
  }

  const cache = await openMapTileCache()
  let completed = 0

  const TILE_ATTEMPTS = 3
  const TILE_TIMEOUT_MS = 20_000

  for (const url of urls) {
    if (signal?.aborted) throw new DOMException('Download aborted', 'AbortError')

    const existing = await cache.match(url)
    if (!existing?.ok) {
      let lastError = null
      let stored = false
      for (let attempt = 0; attempt < TILE_ATTEMPTS; attempt += 1) {
        if (signal?.aborted) throw new DOMException('Download aborted', 'AbortError')
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), TILE_TIMEOUT_MS)
        const onOuterAbort = () => controller.abort()
        signal?.addEventListener('abort', onOuterAbort)
        try {
          const response = await fetch(url, { signal: controller.signal })
          if (!response.ok) {
            throw new Error(`Failed to download map tile (${response.status})`)
          }
          const blob = await response.blob()
          if (!blob.size) {
            throw new Error('Downloaded empty map tile')
          }
          const contentType =
            response.headers.get('Content-Type') ??
            (url.includes('.pbf') ? 'application/vnd.mapbox-vector-tile' : 'application/json')
          await cache.put(
            url,
            new Response(blob, {
              status: 200,
              headers: { 'Content-Type': contentType },
            }),
          )
          stored = true
          break
        } catch (error) {
          lastError = error
          if (signal?.aborted) {
            throw new DOMException('Download aborted', 'AbortError')
          }
          if (attempt < TILE_ATTEMPTS - 1) {
            await new Promise((resolve) => setTimeout(resolve, 300 * 2 ** attempt))
          }
        } finally {
          clearTimeout(timeoutId)
          signal?.removeEventListener('abort', onOuterAbort)
        }
      }
      if (!stored) {
        throw lastError ?? new Error('Failed to download map tile')
      }
    }

    completed += 1
    onProgress?.({
      completed,
      total: urls.length,
      percent: clampPercent((completed / urls.length) * 100),
      currentPath: url,
    })
  }

  const verification = await verifyRomeMapTiles(manifest, { token })
  if (!verification.valid) {
    throw new Error(`Map tile verification failed (${verification.missing.length} missing).`)
  }

  await hydrateRomeMapTileCache(manifest, { token })

  return {
    skipped: false,
    tileCount: urls.length,
    verification,
  }
}

export async function clearRomeMapTiles(manifest, options = {}) {
  const urls = listRomeMapTileUrls(manifest, options)
  const cache = await openMapTileCache()

  await Promise.all(urls.map((url) => cache.delete(url)))
  clearCachedMapTiles()

  return { deleted: urls.length }
}

export async function isRomeMapReadyOffline(manifest, options = {}) {
  const verification = await verifyRomeMapTiles(manifest, options)
  if (verification.skipped) return true
  return verification.valid
}
