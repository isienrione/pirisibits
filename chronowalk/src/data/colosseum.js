export const COLOSSEUM = { lat: 41.8902, lng: 12.4922 }

/** Asset Studio (AI prompts): http://localhost:5173/?assetStudio=true&waypoint=colosseum */

// Visitor camera POV for the before/after slider (facade approach — near Google Street View)
export const COLOSSEUM_VIEWPOINT = {
  lat: 41.891275,
  lng: 12.491202,
  heading: 153.2,
  pitch: 18.1,
}

// Delay before the waypoint card slides up (after map + arrival chime)
export const CARD_REVEAL_DELAY_MS = 1400

// Narrative state: TRANSIT vs ARRIVAL
export const GEOFENCE_ARRIVAL_THRESHOLD_M = 30

// Visual zone on the map (broader approach area)
export const COLOSSEUM_ARRIVAL_RADIUS_M = 150

// Start buffering arrival audio when within this distance (still in TRANSIT)
export const ARRIVAL_AUDIO_PREFETCH_RADIUS_M = 200

// Debug uses Colosseum coords so ARRIVAL state triggers; marker is nudged on map for visibility
export const DEBUG_USER_POS = { lat: COLOSSEUM.lat, lng: COLOSSEUM.lng }

/*
 * SLIDER IMAGE PIPELINE — exterior subfolder (matched viewpoint)
 *
 * 1. MODERN — video preferred, still as fallback:
 *    - public/waypoints/colosseum/exterior/modern.mp4
 *    - public/waypoints/colosseum/exterior/modern-exterior.jpg
 *
 * 2. ANCIENT — matched video or still, same camera as modern:
 *    - public/waypoints/colosseum/exterior/ancient-reconstruction.mp4
 *    - public/waypoints/colosseum/exterior/ancient-reconstruction.jpg
 *
 * 3. Poster stills after animation (hero facade frame @ slider_poster_at_sec)
 *
 * 4. Interior assets live in public/waypoints/colosseum/interior/ (future stop)
 *
 * Shared audio/alert at colosseum/ root.
 */

const COLOSSEUM_SAMPLE_AUDIO = '/waypoints/colosseum/Audio_sample.mp3'
const COLOSSEUM_ARRIVAL_ALERT = '/waypoints/colosseum/geocache-arrival-alert.wav'
const COLOSSEUM_EXTERIOR = '/waypoints/colosseum/exterior'
const COLOSSEUM_MODERN_IMAGE = `${COLOSSEUM_EXTERIOR}/modern-exterior.jpg`
const COLOSSEUM_MODERN_VIDEO = `${COLOSSEUM_EXTERIOR}/modern.mp4`
const COLOSSEUM_MODERN_POSTER = `${COLOSSEUM_EXTERIOR}/modern-poster.jpg`
const COLOSSEUM_ANCIENT_IMAGE = `${COLOSSEUM_EXTERIOR}/ancient-reconstruction.jpg`
const COLOSSEUM_ANCIENT_VIDEO = `${COLOSSEUM_EXTERIOR}/ancient-reconstruction.mp4`
const COLOSSEUM_ANCIENT_POSTER = `${COLOSSEUM_EXTERIOR}/ancient-poster.jpg`

// Extra loop time after the first animation playthrough (~10s at normal speed)
export const COLOSSEUM_SLIDER_POST_ANIMATION_LOOP_MS = 10000

// Hero frame for poster stills (videos play to the end first). Tune live: ?posterAt=3
export const COLOSSEUM_SLIDER_POSTER_AT_SEC = 3

export const COLOSSEUM_WAYPOINT = {
  id: 'colosseum',
  title: 'The Colosseum',
  media_cache_version: 8,
  arrival_headline: "You've reached the Colosseum!",
  arrival_subtitle: 'Ancient Rome awaits — choose how you want to explore.',
  immersive_orientation_hint:
    'Stand facing the Colosseum facade, then tap Begin Immersive View for the best before/after reveal.',
  lat: COLOSSEUM.lat,
  lng: COLOSSEUM.lng,
  viewpoint: COLOSSEUM_VIEWPOINT,
  modern_image_url: COLOSSEUM_MODERN_IMAGE,
  modern_video_url: COLOSSEUM_MODERN_VIDEO,
  modern_poster_url: COLOSSEUM_MODERN_POSTER,
  ancient_image_url: COLOSSEUM_ANCIENT_IMAGE,
  ancient_video_url: COLOSSEUM_ANCIENT_VIDEO,
  ancient_poster_url: COLOSSEUM_ANCIENT_POSTER,
  slider_poster_at_sec: COLOSSEUM_SLIDER_POSTER_AT_SEC,
  slider_post_animation_loop_ms: COLOSSEUM_SLIDER_POST_ANIMATION_LOOP_MS,
  slider_freeze_at_sec: COLOSSEUM_SLIDER_POSTER_AT_SEC,
  ambient_url: COLOSSEUM_SAMPLE_AUDIO,
  transit_narrative_url: COLOSSEUM_SAMPLE_AUDIO,
  arrival_immersive_url: COLOSSEUM_SAMPLE_AUDIO,
  arrival_alert_url: COLOSSEUM_ARRIVAL_ALERT,
}
