export const CAPITOLINE_HILL = { lat: 41.89324, lng: 12.48275 }

/** Asset Studio: http://localhost:5173/?assetStudio=true&waypoint=capitoline-hill */

/** Piazza del Campidoglio edge — Forum overlook (Capitoline vista ~100 AD). */
export const CAPITOLINE_HILL_VIEWPOINT = {
  lat: 41.89305,
  lng: 12.4825,
  heading: 120,
  pitch: 14,
}

export const CAPITOLINE_HILL_STREET_VIEW_URL =
  'https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=41.89305,12.48250&heading=120&pitch=14'

export const CAPITOLINE_HILL_SLIDER_POST_ANIMATION_LOOP_MS = 10000
export const CAPITOLINE_HILL_SLIDER_POSTER_AT_SEC = 3
export const CAPITOLINE_HILL_GEOFENCE_ARRIVAL_THRESHOLD_M = 30
export const CAPITOLINE_HILL_ARRIVAL_RADIUS_M = 120
export const CAPITOLINE_HILL_DEBUG_USER_POS = {
  lat: CAPITOLINE_HILL.lat,
  lng: CAPITOLINE_HILL.lng,
}

const CAPITOLINE_HILL_SAMPLE_AUDIO = '/waypoints/capitoline-hill/Audio_sample.mp3'
const CAPITOLINE_HILL_ARRIVAL_ALERT = '/waypoints/capitoline-hill/geocache-arrival-alert.wav'
const CAPITOLINE_HILL_MODERN_IMAGE = '/waypoints/capitoline-hill/modern-exterior.jpg'
const CAPITOLINE_HILL_MODERN_VIDEO = '/waypoints/capitoline-hill/modern.mp4'
const CAPITOLINE_HILL_MODERN_POSTER = '/waypoints/capitoline-hill/modern-poster.jpg'
const CAPITOLINE_HILL_ANCIENT_IMAGE = '/waypoints/capitoline-hill/ancient-reconstruction.jpg'
const CAPITOLINE_HILL_ANCIENT_VIDEO = '/waypoints/capitoline-hill/ancient-reconstruction.mp4'
const CAPITOLINE_HILL_ANCIENT_POSTER = '/waypoints/capitoline-hill/ancient-poster.jpg'

export const CAPITOLINE_HILL_WAYPOINT = {
  id: 'capitoline-hill',
  title: 'Capitoline Hill',
  media_cache_version: 1,
  framingProfile: 'large_approach',
  arrival_headline: "You've reached the Capitoline Hill!",
  arrival_subtitle:
    'From Rome\'s sacred hill, the Forum spreads below — temples, triumph, and empire in one vista.',
  immersive_orientation_hint:
    'Stand at the edge of Piazza del Campidoglio overlooking the Forum, then begin the immersive view.',
  lat: CAPITOLINE_HILL.lat,
  lng: CAPITOLINE_HILL.lng,
  viewpoint: CAPITOLINE_HILL_VIEWPOINT,
  modern_image_url: CAPITOLINE_HILL_MODERN_IMAGE,
  modern_video_url: CAPITOLINE_HILL_MODERN_VIDEO,
  modern_poster_url: CAPITOLINE_HILL_MODERN_POSTER,
  ancient_image_url: CAPITOLINE_HILL_ANCIENT_IMAGE,
  ancient_video_url: CAPITOLINE_HILL_ANCIENT_VIDEO,
  ancient_poster_url: CAPITOLINE_HILL_ANCIENT_POSTER,
  slider_poster_at_sec: CAPITOLINE_HILL_SLIDER_POSTER_AT_SEC,
  slider_post_animation_loop_ms: CAPITOLINE_HILL_SLIDER_POST_ANIMATION_LOOP_MS,
  slider_freeze_at_sec: CAPITOLINE_HILL_SLIDER_POSTER_AT_SEC,
  ambient_url: CAPITOLINE_HILL_SAMPLE_AUDIO,
  transit_narrative_url: CAPITOLINE_HILL_SAMPLE_AUDIO,
  arrival_immersive_url: CAPITOLINE_HILL_SAMPLE_AUDIO,
  arrival_alert_url: CAPITOLINE_HILL_ARRIVAL_ALERT,
}
