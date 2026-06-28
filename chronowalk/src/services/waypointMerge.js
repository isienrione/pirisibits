import { COLOSSEUM_WAYPOINT } from '../data/colosseum'
import { PANTHEON_WAYPOINT } from '../data/pantheon'
import { PIAZZA_NAVONA_WAYPOINT } from '../data/piazza-navona'
import { CAPITOLINE_HILL_WAYPOINT } from '../data/capitoline-hill'
import { CAMPO_DE_FIORI_WAYPOINT } from '../data/campo-de-fiori'
import { LARGO_ARGENTINA_WAYPOINT } from '../data/largo-argentina'
import { CASTEL_SANT_ANGELO_WAYPOINT } from '../data/castel-sant-angelo'
import { FONTANA_DI_TREVI_WAYPOINT } from '../data/fontana-di-trevi'
import { EXPANSION_WAYPOINTS_BY_ID } from '../data/expansionWaypoints'
import { FORUM_WAYPOINTS_BY_ID } from '../data/forumWaypoints'

export const MEDIA_URL_KEYS = [
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
  'immersive_mode',
  'immersive_orientation_hint',
  'arrival_headline',
  'arrival_subtitle',
  'arrival_transcript',
  'slider_poster_at_sec',
  'slider_poster_hold_ms',
  'slider_post_animation_loop_ms',
  'slider_freeze_at_sec',
]

const LOCAL_POV_KEYS = ['lat', 'lng', 'framingProfile']

const LOCAL_WAYPOINTS = {
  colosseum: COLOSSEUM_WAYPOINT,
  pantheon: PANTHEON_WAYPOINT,
  'piazza-navona': PIAZZA_NAVONA_WAYPOINT,
  'capitoline-hill': CAPITOLINE_HILL_WAYPOINT,
  'campo-de-fiori': CAMPO_DE_FIORI_WAYPOINT,
  'largo-argentina': LARGO_ARGENTINA_WAYPOINT,
  'castel-sant-angelo': CASTEL_SANT_ANGELO_WAYPOINT,
  'fontana-di-trevi': FONTANA_DI_TREVI_WAYPOINT,
  ...FORUM_WAYPOINTS_BY_ID,
  ...EXPANSION_WAYPOINTS_BY_ID,
}

export const isForeignWaypointMediaUrl = (url, waypointId) => {
  if (!url || !waypointId) return false
  const path = String(url)
  if (!path.includes('/waypoints/')) return false
  if (path.includes(`/${waypointId}/`)) return false
  if (waypointId === 'colosseum' && path.includes('/waypoints/colosseum/')) return false
  return true
}

export const mergeWaypointWithLocalDefaults = (remote, local) => {
  if (!remote) return { ...local }
  if (!local) return { ...remote }

  const merged = { ...local, ...remote }

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

  for (const key of LOCAL_POV_KEYS) {
    if (local[key] != null) merged[key] = local[key]
  }

  if (local.viewpoint) {
    merged.viewpoint = { ...remote.viewpoint, ...local.viewpoint }
  }

  return merged
}

export const getLocalWaypoint = (id) => LOCAL_WAYPOINTS[id] ?? null
