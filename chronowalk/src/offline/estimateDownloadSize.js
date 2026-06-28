import { getTourById } from '../services/tourRegistry'
import { getLocalWaypoint } from '../services/waypointMerge'
import { resolveAssetUrl } from '../services/waypointService'
import {
  buildTourCacheManifest,
  collectWaypointAssetEntries,
  dedupeAssetEntries,
  inferMediaKind,
} from './cacheManifest'

/** Conservative per-asset byte estimates for pre-download sizing. */
const ESTIMATED_BYTES_BY_KIND = {
  video: 6_500_000,
  audio: 750_000,
  image: 400_000,
  file: 120_000,
}

const METADATA_OVERHEAD_BYTES = 48_000

export function formatDownloadSize(bytes) {
  if (bytes == null || Number.isNaN(bytes)) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10_240 ? 1 : 0)} KB`
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(bytes < 10_485_760 ? 1 : 0)} MB`
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

function normalizeLocalWaypoint(waypoint) {
  if (!waypoint) return null
  return {
    ...waypoint,
    modern_image_url: resolveAssetUrl(waypoint.modern_image_url),
    modern_video_url: resolveAssetUrl(waypoint.modern_video_url),
    modern_poster_url: resolveAssetUrl(waypoint.modern_poster_url),
    ancient_image_url: resolveAssetUrl(waypoint.ancient_image_url),
    ancient_video_url: resolveAssetUrl(waypoint.ancient_video_url),
    ancient_poster_url: resolveAssetUrl(waypoint.ancient_poster_url),
    depth_map_url: resolveAssetUrl(waypoint.depth_map_url),
    ambient_url: resolveAssetUrl(waypoint.ambient_url),
    transit_narrative_url: resolveAssetUrl(waypoint.transit_narrative_url),
    arrival_immersive_url: resolveAssetUrl(waypoint.arrival_immersive_url),
    arrival_alert_url: resolveAssetUrl(waypoint.arrival_alert_url),
  }
}

export function estimateAssetBytes(asset) {
  const kind = asset?.mediaKind ?? inferMediaKind(asset?.sourceUrl ?? '')
  return ESTIMATED_BYTES_BY_KIND[kind] ?? ESTIMATED_BYTES_BY_KIND.file
}

export function estimateManifestBytes(manifest) {
  if (!manifest?.assets?.length) return METADATA_OVERHEAD_BYTES

  const assetBytes = manifest.assets.reduce((total, asset) => total + estimateAssetBytes(asset), 0)
  return assetBytes + METADATA_OVERHEAD_BYTES
}

export function estimateTourDownloadSize(tour) {
  if (!tour?.stopIds?.length) {
    return {
      bytes: 0,
      assetCount: 0,
      stopCount: 0,
    }
  }

  const waypoints = tour.stopIds
    .map((stopId) => normalizeLocalWaypoint(getLocalWaypoint(stopId)))
    .filter(Boolean)

  const manifest = buildTourCacheManifest({ tour, waypoints })
  const bytes = estimateManifestBytes(manifest)

  return {
    bytes,
    assetCount: manifest.assetCount,
    stopCount: tour.stopIds.length,
    manifest,
  }
}

export async function estimateTourDownloadSizeById(tourId) {
  const tour = getTourById(tourId)
  if (!tour) {
    throw new Error(`Tour not found: ${tourId}`)
  }
  return estimateTourDownloadSize(tour)
}

export function estimateFromWaypoints(tour, waypoints) {
  const manifest = buildTourCacheManifest({ tour, waypoints })
  return {
    bytes: estimateManifestBytes(manifest),
    assetCount: manifest.assetCount,
    stopCount: tour?.stopIds?.length ?? 0,
    manifest,
  }
}

export function sumAssetEntryBytes(entries) {
  return dedupeAssetEntries(entries).reduce((total, entry) => total + estimateAssetBytes(entry), 0)
}

export function collectTourAssetEntries(tour) {
  const waypoints = tour.stopIds
    .map((stopId) => normalizeLocalWaypoint(getLocalWaypoint(stopId)))
    .filter(Boolean)

  return dedupeAssetEntries(waypoints.flatMap(collectWaypointAssetEntries))
}
