import { env } from '../config/env.js'
import { getManifestTourBounds, getManifestWaypointIds } from '../content/mapStops.js'

/**
 * Offline Rome walking-map pack.
 *
 * Uses classic Mapbox Streets (not Standard). Standard pulls dynamic basemap
 * resources that cannot be cached reliably — offline that becomes an empty
 * canvas with only the traveler / destination markers ("two dots").
 *
 * Pack contents: style JSON + streets-v8 vector tiles + glyphs + sprites.
 */
export const ROME_MAP_TILE_CACHE = 'chronowalk-rome-map-tiles-v2'
/** Classic style — glyphs/sprites/tiles are enumerable and Cache-friendly. */
export const DEFAULT_MAP_STYLE_PATH = 'mapbox/streets-v12'
export const DEFAULT_MAP_TILESET = 'mapbox.mapbox-streets-v8'
/** Cover walking-camera zooms (≈15.5–16.5) with a one-level buffer either side. */
export const DEFAULT_MAP_ZOOM_MIN = 13
export const DEFAULT_MAP_ZOOM_MAX = 16
/** ~1.1 km padding so route + user position near stops stay inside the tile hull. */
export const BOUNDS_PADDING_DEG = 0.01
/** Soft-fail tiles; require this fraction (plus style/glyphs/sprites) to pass. */
export const MAP_TILE_COVERAGE_THRESHOLD = 0.9
const DOWNLOAD_CONCURRENCY = 6
const TILE_ATTEMPTS = 3
const TILE_TIMEOUT_MS = 25_000
/** Latin + common European ranges for street labels. */
const GLYPH_RANGES = ['0-255', '256-511', '512-767']
const FALLBACK_FONTSTACKS = [
  'DIN Pro Regular',
  'DIN Pro Medium',
  'DIN Pro Bold',
  'DIN Pro Italic',
  'Arial Unicode MS Regular',
]

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

export function parseMapboxStylePath(styleUrl) {
  const url = styleUrl || `mapbox://styles/${DEFAULT_MAP_STYLE_PATH}`
  if (!url?.startsWith('mapbox://styles/')) return DEFAULT_MAP_STYLE_PATH
  return url.replace('mapbox://styles/', '')
}

export function styleJsonUrl(stylePath = DEFAULT_MAP_STYLE_PATH, token = env.mapboxToken) {
  if (!token) return null
  return `https://api.mapbox.com/styles/v1/${stylePath}?access_token=${token}`
}

export function vectorTileUrl(tile, token = env.mapboxToken, tileset = DEFAULT_MAP_TILESET) {
  if (!token) return null
  return `https://api.mapbox.com/v4/${tileset}/${tile.z}/${tile.x}/${tile.y}.vector.pbf?access_token=${token}`
}

export function glyphUrl(fontstack, range, token = env.mapboxToken) {
  if (!token || !fontstack || !range) return null
  const encoded = encodeURIComponent(fontstack)
  return `https://api.mapbox.com/fonts/v1/mapbox/${encoded}/${range}.pbf?access_token=${token}`
}

export function spriteUrls(stylePath = DEFAULT_MAP_STYLE_PATH, token = env.mapboxToken) {
  if (!token) return []
  const base = `https://api.mapbox.com/styles/v1/${stylePath}/sprite`
  return [
    `${base}.json?access_token=${token}`,
    `${base}.png?access_token=${token}`,
    `${base}@2x.json?access_token=${token}`,
    `${base}@2x.png?access_token=${token}`,
  ]
}

function collectFontstacksFromStyle(style) {
  const stacks = new Set(FALLBACK_FONTSTACKS)
  for (const layer of style?.layers ?? []) {
    const fonts = layer?.layout?.['text-font']
    if (!Array.isArray(fonts)) continue
    for (const font of fonts) {
      if (typeof font === 'string' && font.trim()) stacks.add(font.trim())
    }
  }
  return [...stacks]
}

function listGlyphUrlsFromStyle(style, token = env.mapboxToken) {
  const urls = []
  for (const fontstack of collectFontstacksFromStyle(style)) {
    for (const range of GLYPH_RANGES) {
      const url = glyphUrl(fontstack, range, token)
      if (url) urls.push(url)
    }
  }
  return urls
}

export function listRomeVectorTileUrls(
  manifest,
  {
    token = env.mapboxToken,
    zoomMin = DEFAULT_MAP_ZOOM_MIN,
    zoomMax = DEFAULT_MAP_ZOOM_MAX,
  } = {},
) {
  if (!token || !manifest) return []
  const bounds = padBounds(
    getManifestTourBounds(manifest, getManifestWaypointIds(manifest, manifest.journey?.default_path ?? 'a')),
  )
  return tilesCoveringBounds(bounds, zoomMin, zoomMax)
    .map((tile) => vectorTileUrl(tile, token))
    .filter(Boolean)
}

/**
 * Synchronous URL list for estimates / verify (style + tiles + sprite stubs).
 * Glyph URLs are added after the style JSON is fetched (fontstacks from layers).
 */
export function listRomeMapTileUrls(
  manifest,
  {
    token = env.mapboxToken,
    stylePath = DEFAULT_MAP_STYLE_PATH,
    zoomMin = DEFAULT_MAP_ZOOM_MIN,
    zoomMax = DEFAULT_MAP_ZOOM_MAX,
  } = {},
) {
  if (!token || !manifest) return []

  const urls = [styleJsonUrl(stylePath, token), ...spriteUrls(stylePath, token)].filter(Boolean)
  urls.push(...listRomeVectorTileUrls(manifest, { token, zoomMin, zoomMax }))

  // Estimated glyph set (actual download uses style-derived stacks).
  for (const fontstack of FALLBACK_FONTSTACKS) {
    for (const range of GLYPH_RANGES) {
      const url = glyphUrl(fontstack, range, token)
      if (url) urls.push(url)
    }
  }

  return urls
}

export function estimateRomeMapTileDownload(manifest, options = {}) {
  const urls = listRomeMapTileUrls(manifest, options)
  return {
    tileCount: urls.length,
    bytes: urls.length * 40_000,
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

/** Blob URL for the offline style JSON, if hydrated — prefer this for Mapbox `style`. */
export function getCachedOfflineStyleUrl(token = env.mapboxToken) {
  const url = styleJsonUrl(DEFAULT_MAP_STYLE_PATH, token)
  return url ? resolveCachedMapTileUrl(url) : null
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

async function putCacheBlob(cache, url, blob, contentType) {
  await cache.put(
    url,
    new Response(blob, {
      status: 200,
      headers: { 'Content-Type': contentType },
    }),
  )
}

function guessContentType(url, responseType) {
  if (responseType) return responseType
  if (url.includes('.pbf')) return 'application/vnd.mapbox-vector-tile'
  if (url.includes('.json')) return 'application/json'
  if (url.includes('.png')) return 'image/png'
  return 'application/octet-stream'
}

async function fetchAndStore(cache, url, { signal } = {}) {
  const existing = await matchMapTileInCache(cache, url)
  if (existing?.ok) {
    const blob = await existing.blob()
    if (blob.size) return { ok: true, skipped: true }
  }

  let lastError = null
  for (let attempt = 0; attempt < TILE_ATTEMPTS; attempt += 1) {
    if (signal?.aborted) throw new DOMException('Download aborted', 'AbortError')
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TILE_TIMEOUT_MS)
    const onOuterAbort = () => controller.abort()
    signal?.addEventListener('abort', onOuterAbort)
    try {
      const response = await fetch(url, { signal: controller.signal })
      if (!response.ok) {
        throw new Error(`Failed to download map asset (${response.status})`)
      }
      const blob = await response.blob()
      if (!blob.size) {
        throw new Error('Downloaded empty map asset')
      }
      await putCacheBlob(cache, url, blob, guessContentType(url, response.headers.get('Content-Type')))
      return { ok: true, skipped: false }
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
  return { ok: false, error: lastError }
}

async function runPool(items, concurrency, worker) {
  let next = 0
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (next < items.length) {
      const index = next
      next += 1
      await worker(items[index], index)
    }
  })
  await Promise.all(workers)
}

export async function verifyRomeMapTiles(manifest, options = {}) {
  const token = options.token ?? env.mapboxToken
  const stylePath = options.stylePath ?? DEFAULT_MAP_STYLE_PATH
  const styleUrl = styleJsonUrl(stylePath, token)
  if (!styleUrl) {
    return { valid: true, total: 0, missing: [], skipped: true }
  }

  const cache = await openMapTileCache()
  const missing = []

  const styleMatch = await matchMapTileInCache(cache, styleUrl)
  if (!styleMatch?.ok) {
    return {
      valid: false,
      total: 1,
      missing: [styleUrl],
      skipped: false,
      coverage: 0,
    }
  }

  let style = null
  try {
    style = await styleMatch.clone().json()
  } catch {
    missing.push(styleUrl)
  }

  const spriteList = spriteUrls(stylePath, token)
  for (const url of spriteList) {
    const match = await matchMapTileInCache(cache, url)
    if (!match?.ok) missing.push(url)
  }

  const glyphList = style ? listGlyphUrlsFromStyle(style, token) : []
  let glyphsPresent = 0
  for (const url of glyphList) {
    const match = await matchMapTileInCache(cache, url)
    if (match?.ok) glyphsPresent += 1
    else missing.push(url)
  }

  const tileUrls = listRomeVectorTileUrls(manifest, options)
  let tilesPresent = 0
  for (const url of tileUrls) {
    const match = await matchMapTileInCache(cache, url)
    if (!match?.ok) {
      missing.push(url)
      continue
    }
    const blob = await match.blob()
    if (!blob.size) {
      missing.push(url)
      continue
    }
    tilesPresent += 1
  }

  const tileCoverage = tileUrls.length ? tilesPresent / tileUrls.length : 1
  const spritesOk = spriteList.every((url) => !missing.includes(url))
  const glyphsOk = glyphsPresent >= Math.min(3, glyphList.length)
  const valid =
    Boolean(style) && spritesOk && glyphsOk && tileCoverage >= MAP_TILE_COVERAGE_THRESHOLD

  return {
    valid,
    total: 1 + spriteList.length + glyphList.length + tileUrls.length,
    missing,
    skipped: false,
    coverage: tileCoverage,
    tilesPresent,
    tileTotal: tileUrls.length,
    glyphsPresent,
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

  // Register every Cache entry - older packages / URL variants still feed
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
  const stylePath = DEFAULT_MAP_STYLE_PATH
  const styleUrl = styleJsonUrl(stylePath, token)
  if (!styleUrl || !manifest) {
    return { skipped: true, tileCount: 0 }
  }

  const cache = await openMapTileCache()

  // 1) Style JSON first — needed to discover fonts.
  const styleResult = await fetchAndStore(cache, styleUrl, { signal })
  if (!styleResult.ok) {
    throw styleResult.error ?? new Error('Failed to download offline map style')
  }

  const styleResponse = await matchMapTileInCache(cache, styleUrl)
  const style = await styleResponse.json()

  // Rewrite mapbox:// glyph/sprite refs to absolute HTTPS so blob-loaded styles
  // request URLs that match our Cache keys / transformRequest.
  const absoluteStyle = {
    ...style,
    glyphs: `https://api.mapbox.com/fonts/v1/mapbox/{fontstack}/{range}.pbf?access_token=${token}`,
    sprite: `https://api.mapbox.com/styles/v1/${stylePath}/sprite`,
  }
  await putCacheBlob(
    cache,
    styleUrl,
    new Blob([JSON.stringify(absoluteStyle)], { type: 'application/json' }),
    'application/json',
  )

  const assetUrls = [
    ...spriteUrls(stylePath, token),
    ...listGlyphUrlsFromStyle(absoluteStyle, token),
    ...listRomeVectorTileUrls(manifest, { token }),
  ]

  let completed = 0
  const total = assetUrls.length + 1
  onProgress?.({
    completed: 1,
    total,
    percent: clampPercent((1 / total) * 100),
    currentPath: styleUrl,
  })

  const failures = []
  await runPool(assetUrls, DOWNLOAD_CONCURRENCY, async (url) => {
    if (signal?.aborted) throw new DOMException('Download aborted', 'AbortError')
    const result = await fetchAndStore(cache, url, { signal })
    if (!result.ok) {
      failures.push({ url, error: result.error?.message ?? 'failed' })
    }
    completed += 1
    onProgress?.({
      completed: completed + 1,
      total,
      percent: clampPercent(((completed + 1) / total) * 100),
      currentPath: url,
    })
  })

  const verification = await verifyRomeMapTiles(manifest, { token, stylePath })
  if (!verification.valid) {
    const failedTiles = failures.length
    throw new Error(
      `Map pack incomplete (${verification.missing.length} missing` +
        `${failedTiles ? `, ${failedTiles} fetch failures` : ''}` +
        `, coverage ${Math.round((verification.coverage ?? 0) * 100)}%).`,
    )
  }

  await hydrateRomeMapTileCache(manifest, { token, stylePath })

  return {
    skipped: false,
    tileCount: verification.total,
    verification,
    failures,
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
