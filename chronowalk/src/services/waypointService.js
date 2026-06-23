import { env } from '../config/env'
import { supabase } from '../lib/supabase'
import { COLOSSEUM_WAYPOINT } from '../data/colosseum'

/**
 * TODO (Supabase): When ready for production content, populate the `waypoints`
 * table in Supabase with id, title, image URLs, and audio URLs
 * (transit_narrative_url, arrival_immersive_url, ambient_url).
 * Then set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.
 */

/**
 * Local seed data — fallback when Supabase is not configured.
 */
const LOCAL_WAYPOINTS = {
  colosseum: COLOSSEUM_WAYPOINT,
}

/**
 * Resolves asset paths to full URLs.
 * - Absolute URLs (http/https) pass through unchanged.
 * - Relative paths are prefixed with VITE_CDN_BASE_URL (e.g. Cloudflare CDN).
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
})

/** Audio URLs for AudioOrchestrator (Supabase / CDN resolved). */
export const getWaypointAudioUrls = (waypoint) => ({
  ambient: waypoint.ambient_url,
  transit: waypoint.transit_narrative_url,
  arrival: waypoint.arrival_immersive_url,
})

const fetchWaypointFromSupabase = async (id) => {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('waypoints')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw new Error(`Supabase waypoint fetch failed: ${error.message}`)
  }

  return data
}

/**
 * Fetches a waypoint by ID from Supabase, falling back to local seed data.
 */
export const fetchWaypointById = async (id) => {
  const remoteWaypoint = await fetchWaypointFromSupabase(id)
  if (remoteWaypoint) {
    return normalizeWaypoint(remoteWaypoint)
  }

  const waypoint = LOCAL_WAYPOINTS[id]
  if (!waypoint) {
    throw new Error(`Waypoint not found: ${id}`)
  }

  return normalizeWaypoint(waypoint)
}
