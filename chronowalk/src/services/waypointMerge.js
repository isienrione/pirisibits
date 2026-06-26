import { COLOSSEUM_WAYPOINT } from '../data/colosseum'
import { PANTHEON_WAYPOINT } from '../data/pantheon'
import { PIAZZA_NAVONA_WAYPOINT } from '../data/piazza-navona'
import { CAPITOLINE_HILL_WAYPOINT } from '../data/capitoline-hill'
import { CAMPO_DE_FIORI_WAYPOINT } from '../data/campo-de-fiori'
import { LARGO_ARGENTINA_WAYPOINT } from '../data/largo-argentina'
import { CASTEL_SANT_ANGELO_WAYPOINT } from '../data/castel-sant-angelo'
import { getAudioScriptsForWaypoint } from '../data/audioScripts'

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
  'arrival_transcript',
  'transit_transcript',
  'slider_poster_at_sec',
  'slider_poster_hold_ms',
  'slider_post_animation_loop_ms',
  'slider_freeze_at_sec',
]

/**
 * Supabase rows may omit large media fields during MVP. Keep local seed assets as fallback.
 * Reject remote URLs that point at a different waypoint's folder (common copy-paste mistake).
 */
const LOCAL_POV_KEYS = ['lat', 'lng', 'framingProfile']

export const isForeignWaypointMediaUrl = (url, waypointId) => {
  if (!url || !waypointId) return false
  const match = String(url).match(/\/waypoints\/([^/]+)\//)
  return Boolean(match && match[1] !== waypointId)
}

export const mergeWaypointWithLocalDefaults = (remote, local) => {
  if (!remote) return { ...local }
  if (!local) return { ...remote }

  const merged = { ...local, ...remote }

  // Git seed paths are authoritative for slider/audio assets during local iteration.
  for (const key of MEDIA_URL_KEYS) {
    if (isForeignWaypointMediaUrl(merged[key], local.id)) {
      merged[key] = local[key]
    } else if (local[key]) {
      merged[key] = local[key]
    } else if (!merged[key]) {
      merged[key] = local[key]
    }
  }

  for (const key of COPY_KEYS) {
    if (!merged[key]) merged[key] = local[key]
  }

  // Git seed is authoritative for camera POV — Supabase rows may lag during asset iteration.
  for (const key of LOCAL_POV_KEYS) {
    if (local[key] != null) merged[key] = local[key]
  }

  if (local.viewpoint) {
    merged.viewpoint = { ...remote.viewpoint, ...local.viewpoint }
  }

  return merged
}

export const getLocalWaypoint = (id) => {
  let waypoint = null
  if (id === 'colosseum') waypoint = COLOSSEUM_WAYPOINT
  else if (id === 'pantheon') waypoint = PANTHEON_WAYPOINT
  else if (id === 'piazza-navona') waypoint = PIAZZA_NAVONA_WAYPOINT
  else if (id === 'capitoline-hill') waypoint = CAPITOLINE_HILL_WAYPOINT
  else if (id === 'campo-de-fiori') waypoint = CAMPO_DE_FIORI_WAYPOINT
  else if (id === 'largo-argentina') waypoint = LARGO_ARGENTINA_WAYPOINT
  else if (id === 'castel-sant-angelo') waypoint = CASTEL_SANT_ANGELO_WAYPOINT

  if (!waypoint) return null

  const scripts = getAudioScriptsForWaypoint(id)
  return { ...waypoint, ...scripts }
}
