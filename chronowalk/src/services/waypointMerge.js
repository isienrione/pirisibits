import { COLOSSEUM_WAYPOINT } from '../data/colosseum'

const MEDIA_URL_KEYS = [
  'modern_image_url',
  'modern_video_url',
  'modern_poster_url',
  'ancient_image_url',
  'ancient_video_url',
  'ancient_poster_url',
  'depth_map_url',
  'ambient_url',
  'transit_narrative_url',
  'arrival_immersive_url',
  'arrival_alert_url',
]

const COPY_KEYS = [
  'immersive_orientation_hint',
  'arrival_headline',
  'arrival_subtitle',
  'slider_poster_at_sec',
  'slider_poster_hold_ms',
  'slider_post_animation_loop_ms',
  'slider_freeze_at_sec',
]

/**
 * Supabase rows may omit large media fields during MVP. Keep local seed assets as fallback.
 */
export const mergeWaypointWithLocalDefaults = (remote, local) => {
  if (!remote) return { ...local }
  if (!local) return { ...remote }

  const merged = { ...local, ...remote }

  for (const key of MEDIA_URL_KEYS) {
    if (!merged[key]) merged[key] = local[key]
  }

  for (const key of COPY_KEYS) {
    if (!merged[key]) merged[key] = local[key]
  }

  return merged
}

export const getLocalWaypoint = (id) => {
  if (id === 'colosseum') return COLOSSEUM_WAYPOINT
  return null
}
