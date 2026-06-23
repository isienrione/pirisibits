export const COLOSSEUM = { lat: 41.8902, lng: 12.4922 }

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

// Debug uses Colosseum coords so ARRIVAL state triggers; marker is nudged on map for visibility
export const DEBUG_USER_POS = { lat: COLOSSEUM.lat, lng: COLOSSEUM.lng }

/*
 * SLIDER IMAGE PIPELINE (matched viewpoint — same camera angle for both layers)
 *
 * 1. MODERN — video preferred, still as fallback:
 *    - public/waypoints/colosseum/moderncolosseum.mp4
 *    - public/waypoints/colosseum/modern-exterior.jpg
 *
 * 2. ANCIENT — matched video or still, same camera as modern:
 *    - public/waypoints/colosseum/ancient-reconstruction.mp4
 *    - public/waypoints/colosseum/ancient-reconstruction.jpg
 *
 * 3. OPTIONAL depth map from the ancient image → depth-map.png
 *
 * Do not hotlink Street View / panorama sites — export JPGs into public/ above.
 */

const COLOSSEUM_SAMPLE_AUDIO = '/waypoints/colosseum/Audio_sample.mp3'
const COLOSSEUM_ARRIVAL_ALERT = '/waypoints/colosseum/geocache-arrival-alert.wav'
const COLOSSEUM_MODERN_IMAGE = '/waypoints/colosseum/modern-exterior.jpg'
const COLOSSEUM_MODERN_VIDEO = '/waypoints/colosseum/moderncolosseum.mp4'
const COLOSSEUM_ANCIENT_IMAGE = '/waypoints/colosseum/ancient-reconstruction.jpg'
const COLOSSEUM_ANCIENT_VIDEO = '/waypoints/colosseum/ancient-reconstruction.mp4'

export const COLOSSEUM_WAYPOINT = {
  id: 'colosseum',
  title: 'The Colosseum',
  arrival_headline: "You've reached the Colosseum!",
  arrival_subtitle: 'Ancient Rome awaits — choose how you want to explore.',
  lat: COLOSSEUM.lat,
  lng: COLOSSEUM.lng,
  viewpoint: COLOSSEUM_VIEWPOINT,
  modern_image_url: COLOSSEUM_MODERN_IMAGE,
  modern_video_url: COLOSSEUM_MODERN_VIDEO,
  ancient_image_url: COLOSSEUM_ANCIENT_IMAGE,
  ancient_video_url: COLOSSEUM_ANCIENT_VIDEO,
  ambient_url: COLOSSEUM_SAMPLE_AUDIO,
  depth_map_url: '/waypoints/colosseum/depth-map.png',
  transit_narrative_url: COLOSSEUM_SAMPLE_AUDIO,
  arrival_immersive_url: COLOSSEUM_SAMPLE_AUDIO,
  arrival_alert_url: COLOSSEUM_ARRIVAL_ALERT,
}
