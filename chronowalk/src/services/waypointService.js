import { env } from '../config/env'
import { COLOSSEUM_WAYPOINT } from '../data/colosseum'

/**
 * Local seed data — used until a database/API is connected.
 * Swap fetchWaypointById() to call your API and remove this map.
 */
const LOCAL_WAYPOINTS = {
  colosseum: COLOSSEUM_WAYPOINT,
}

/**
 * Resolves asset paths to full URLs.
 * - Absolute URLs (http/https) pass through unchanged.
 * - Relative paths are prefixed with VITE_CDN_BASE_URL (e.g. Cloudflare CDN).
 *
 * Example:
 *   VITE_CDN_BASE_URL=https://cdn.example.com
 *   path: /waypoints/colosseum/modern.jpg
 *   → https://cdn.example.com/waypoints/colosseum/modern.jpg
 */
export const resolveAssetUrl = (url) => {
  if (!url) return null
  if (/^https?:\/\//i.test(url)) return url
  if (!env.cdnBaseUrl) return url

  const base = env.cdnBaseUrl.replace(/\/$/, '')
  const path = String(url).replace(/^\//, '')
  return `${base}/${path}`
}

const normalizeWaypoint = (waypoint) => ({
  ...waypoint,
  modern_image_url: resolveAssetUrl(waypoint.modern_image_url),
  ancient_image_url: resolveAssetUrl(waypoint.ancient_image_url),
  depth_map_url: resolveAssetUrl(waypoint.depth_map_url),
  transit_narrative_url: resolveAssetUrl(waypoint.transit_narrative_url),
  arrival_immersive_url: resolveAssetUrl(waypoint.arrival_immersive_url),
})

/**
 * Fetches a waypoint by ID.
 *
 * TODO: Replace local seed lookup with database/API fetch:
 *
 *   const response = await fetch(`${env.apiBaseUrl}/waypoints/${id}`)
 *   if (!response.ok) throw new Error(`Failed to load waypoint: ${id}`)
 *   const waypoint = await response.json()
 *   return normalizeWaypoint(waypoint)
 */
export const fetchWaypointById = async (id) => {
  if (env.apiBaseUrl) {
    // Placeholder for future API integration — uncomment when backend is ready:
    // const response = await fetch(`${env.apiBaseUrl.replace(/\/$/, '')}/waypoints/${id}`)
    // if (!response.ok) throw new Error(`Failed to load waypoint: ${id}`)
    // return normalizeWaypoint(await response.json())
  }

  const waypoint = LOCAL_WAYPOINTS[id]
  if (!waypoint) {
    throw new Error(`Waypoint not found: ${id}`)
  }

  return normalizeWaypoint(waypoint)
}
