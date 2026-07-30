export const LARGO_ARGENTINA = { lat: 41.89528, lng: 12.47694 }

/** Asset Studio: http://localhost:5173/?assetStudio=true&waypoint=largo-argentina */

/** Street level at Area Sacra — Theatre of Pompey / Curia (Caesar assassination site). */
export const LARGO_ARGENTINA_VIEWPOINT = {
  lat: 41.89555,
  lng: 12.47665,
  heading: 250,
  pitch: 14,
}

export const LARGO_ARGENTINA_STREET_VIEW_URL =
  'https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=41.89555,12.47665&heading=250&pitch=14'

export const LARGO_ARGENTINA_SLIDER_POST_ANIMATION_LOOP_MS = 10000
export const LARGO_ARGENTINA_SLIDER_POSTER_AT_SEC = 3
export const LARGO_ARGENTINA_GEOFENCE_ARRIVAL_THRESHOLD_M = 30
export const LARGO_ARGENTINA_ARRIVAL_RADIUS_M = 100
export const LARGO_ARGENTINA_DEBUG_USER_POS = { lat: LARGO_ARGENTINA.lat, lng: LARGO_ARGENTINA.lng }

const LARGO_ARGENTINA_SAMPLE_AUDIO = '/waypoints/largo-argentina/Audio_sample.mp3'
const LARGO_ARGENTINA_ARRIVAL_ALERT = '/waypoints/largo-argentina/geocache-arrival-alert.wav'
const LARGO_ARGENTINA_MODERN_IMAGE = '/waypoints/largo-argentina/modern-exterior.jpg'
const LARGO_ARGENTINA_MODERN_VIDEO = '/waypoints/largo-argentina/modern.mp4'
const LARGO_ARGENTINA_MODERN_POSTER = '/waypoints/largo-argentina/modern-poster.jpg'
const LARGO_ARGENTINA_ANCIENT_IMAGE = '/waypoints/largo-argentina/ancient-reconstruction.jpg'
const LARGO_ARGENTINA_ANCIENT_VIDEO = '/waypoints/largo-argentina/ancient-reconstruction.mp4'
const LARGO_ARGENTINA_ANCIENT_POSTER = '/waypoints/largo-argentina/ancient-poster.jpg'

export const LARGO_ARGENTINA_WAYPOINT = {
  id: 'largo-argentina',
  title: 'Largo di Torre Argentina',
  media_cache_version: 3,
  framingProfile: 'compact_piazza',
  arrival_headline: "You've reached Largo Argentina!",
  arrival_subtitle:
    'Beneath the cats and columns lie Pompey\'s theatre — and the room where Caesar fell.',
  immersive_orientation_hint:
    'Stand at the railing overlooking the sunken temples, then begin the immersive view.',
  lat: LARGO_ARGENTINA.lat,
  lng: LARGO_ARGENTINA.lng,
  viewpoint: LARGO_ARGENTINA_VIEWPOINT,
  modern_image_url: LARGO_ARGENTINA_MODERN_IMAGE,
  modern_video_url: LARGO_ARGENTINA_MODERN_VIDEO,
  modern_poster_url: LARGO_ARGENTINA_MODERN_POSTER,
  ancient_image_url: LARGO_ARGENTINA_ANCIENT_IMAGE,
  ancient_video_url: LARGO_ARGENTINA_ANCIENT_VIDEO,
  ancient_poster_url: LARGO_ARGENTINA_ANCIENT_POSTER,
  slider_poster_at_sec: LARGO_ARGENTINA_SLIDER_POSTER_AT_SEC,
  slider_post_animation_loop_ms: LARGO_ARGENTINA_SLIDER_POST_ANIMATION_LOOP_MS,
  slider_freeze_at_sec: LARGO_ARGENTINA_SLIDER_POSTER_AT_SEC,
  ambient_url: LARGO_ARGENTINA_SAMPLE_AUDIO,
  transit_narrative_url: LARGO_ARGENTINA_SAMPLE_AUDIO,
  arrival_immersive_url: LARGO_ARGENTINA_SAMPLE_AUDIO,
  arrival_alert_url: LARGO_ARGENTINA_ARRIVAL_ALERT,
}
