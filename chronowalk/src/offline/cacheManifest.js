import { getTourBounds, getTourLegs } from '../services/tourRegistry'
import { getWaypointGeo } from '../data/waypointGeo'
import { resolveAssetUrl } from '../services/waypointService'
import { MEDIA_URL_KEYS } from '../services/waypointMerge'

export const OFFLINE_MANIFEST_VERSION = 1

const COPY_KEYS = [
  'immersive_orientation_hint',
  'arrival_headline',
  'arrival_subtitle',
  'arrival_transcript',
  'slider_poster_at_sec',
  'slider_poster_hold_ms',
  'slider_post_animation_loop_ms',
  'slider_freeze_at_sec',
]

const POV_KEYS = ['lat', 'lng', 'framingProfile', 'viewpoint', 'media_cache_version']

/** Strip cache-bust query params so downloads dedupe on the underlying asset. */
export function canonicalAssetUrl(url) {
  if (!url) return null
  try {
    const parsed = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://local')
    return `${parsed.origin}${parsed.pathname}`
  } catch {
    return String(url).split('?')[0]
  }
}

/** Resolve relative / CDN paths to an absolute fetch URL. */
export function toAbsoluteAssetUrl(url) {
  if (!url) return null
  const resolved = resolveAssetUrl(url)
  if (/^https?:\/\//i.test(resolved)) return resolved
  if (typeof window !== 'undefined') {
    return new URL(resolved, window.location.origin).href
  }
  return resolved
}

export function inferMediaKind(url) {
  const extension = String(url).split('?')[0].split('.').pop()?.toLowerCase() ?? ''
  if (['mp4', 'webm', 'mov'].includes(extension)) return 'video'
  if (['mp3', 'wav', 'm4a', 'aac', 'ogg'].includes(extension)) return 'audio'
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(extension)) return 'image'
  return 'file'
}

export function collectWaypointAssetEntries(waypoint) {
  if (!waypoint?.id) return []

  const entries = []
  for (const field of MEDIA_URL_KEYS) {
    const sourceUrl = toAbsoluteAssetUrl(waypoint[field])
    if (!sourceUrl) continue

    entries.push({
      id: `${waypoint.id}:${field}`,
      stopId: waypoint.id,
      field,
      sourceUrl,
      cacheKey: canonicalAssetUrl(sourceUrl),
      mediaKind: inferMediaKind(sourceUrl),
    })
  }

  return entries
}

export function dedupeAssetEntries(entries) {
  const seen = new Set()
  const unique = []

  for (const entry of entries) {
    if (!entry?.cacheKey || seen.has(entry.cacheKey)) continue
    seen.add(entry.cacheKey)
    unique.push(entry)
  }

  return unique
}

export function serializeWaypointMetadata(waypoint) {
  if (!waypoint) return null

  const metadata = {
    id: waypoint.id,
    title: waypoint.title ?? null,
  }

  for (const key of [...MEDIA_URL_KEYS, ...COPY_KEYS, ...POV_KEYS]) {
    if (waypoint[key] != null) metadata[key] = waypoint[key]
  }

  return metadata
}

export function buildTourCacheManifest({ tour, waypoints }) {
  if (!tour?.id) {
    throw new Error('Tour id is required to build an offline cache manifest.')
  }

  const stopIds = tour.stopIds ?? []
  const geoByStopId = Object.fromEntries(
    stopIds.map((stopId) => [stopId, getWaypointGeo(stopId)]).filter(([, geo]) => geo)
  )

  const waypointMetadata = waypoints.map(serializeWaypointMetadata).filter(Boolean)
  const assets = dedupeAssetEntries(waypoints.flatMap(collectWaypointAssetEntries))

  return {
    manifestVersion: OFFLINE_MANIFEST_VERSION,
    tourId: tour.id,
    tour: {
      id: tour.id,
      title: tour.title,
      subtitle: tour.subtitle,
      stopIds,
      mapZoom: tour.mapZoom ?? null,
    },
    stopIds,
    geoByStopId,
    legs: getTourLegs(tour),
    bounds: getTourBounds(tour),
    waypoints: waypointMetadata,
    assets,
    assetCount: assets.length,
    createdAt: Date.now(),
  }
}

export function listRequiredCacheKeys(manifest) {
  return (manifest?.assets ?? []).map((asset) => asset.cacheKey).filter(Boolean)
}
