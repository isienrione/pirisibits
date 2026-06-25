export const CAMPO_DE_FIORI = { lat: 41.89559, lng: 12.47223 }

/** Asset Studio: http://localhost:5173/?assetStudio=true&waypoint=campo-de-fiori */

/** South edge of the square, facing north — medieval open campo ancient layer (not Theatre of Pompey). */
export const CAMPO_DE_FIORI_VIEWPOINT = {
  lat: 41.89535,
  lng: 12.47215,
  heading: 5,
  pitch: 16,
}

export const CAMPO_DE_FIORI_STREET_VIEW_URL =
  'https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=41.89535,12.47215&heading=5&pitch=16'

export const CAMPO_DE_FIORI_SLIDER_POST_ANIMATION_LOOP_MS = 10000
export const CAMPO_DE_FIORI_SLIDER_POSTER_AT_SEC = 3
export const CAMPO_DE_FIORI_GEOFENCE_ARRIVAL_THRESHOLD_M = 30
export const CAMPO_DE_FIORI_ARRIVAL_RADIUS_M = 100
export const CAMPO_DE_FIORI_DEBUG_USER_POS = { lat: CAMPO_DE_FIORI.lat, lng: CAMPO_DE_FIORI.lng }

const CAMPO_DE_FIORI_SAMPLE_AUDIO = '/waypoints/campo-de-fiori/Audio_sample.mp3'
const CAMPO_DE_FIORI_ARRIVAL_ALERT = '/waypoints/campo-de-fiori/geocache-arrival-alert.wav'
const CAMPO_DE_FIORI_MODERN_IMAGE = '/waypoints/campo-de-fiori/modern-exterior.jpg'
const CAMPO_DE_FIORI_MODERN_VIDEO = '/waypoints/campo-de-fiori/modern.mp4'
const CAMPO_DE_FIORI_MODERN_POSTER = '/waypoints/campo-de-fiori/modern-poster.jpg'
const CAMPO_DE_FIORI_ANCIENT_IMAGE = '/waypoints/campo-de-fiori/ancient-reconstruction.jpg'
const CAMPO_DE_FIORI_ANCIENT_VIDEO = '/waypoints/campo-de-fiori/ancient-reconstruction.mp4'
const CAMPO_DE_FIORI_ANCIENT_POSTER = '/waypoints/campo-de-fiori/ancient-poster.jpg'

export const CAMPO_DE_FIORI_WAYPOINT = {
  id: 'campo-de-fiori',
  title: "Campo de' Fiori",
  media_cache_version: 3,
  framingProfile: 'compact_piazza',
  arrival_headline: "You've reached Campo de' Fiori!",
  arrival_subtitle:
    'Market stalls and Bruno\'s shadow — peel back to an open campo before the baroque city closed in.',
  immersive_orientation_hint:
    'Stand on the south side of the square facing the statue and market, then begin the immersive view.',
  lat: CAMPO_DE_FIORI.lat,
  lng: CAMPO_DE_FIORI.lng,
  viewpoint: CAMPO_DE_FIORI_VIEWPOINT,
  modern_image_url: CAMPO_DE_FIORI_MODERN_IMAGE,
  modern_video_url: CAMPO_DE_FIORI_MODERN_VIDEO,
  modern_poster_url: CAMPO_DE_FIORI_MODERN_POSTER,
  ancient_image_url: CAMPO_DE_FIORI_ANCIENT_IMAGE,
  ancient_video_url: CAMPO_DE_FIORI_ANCIENT_VIDEO,
  ancient_poster_url: CAMPO_DE_FIORI_ANCIENT_POSTER,
  slider_poster_at_sec: CAMPO_DE_FIORI_SLIDER_POSTER_AT_SEC,
  slider_post_animation_loop_ms: CAMPO_DE_FIORI_SLIDER_POST_ANIMATION_LOOP_MS,
  slider_freeze_at_sec: CAMPO_DE_FIORI_SLIDER_POSTER_AT_SEC,
  ambient_url: CAMPO_DE_FIORI_SAMPLE_AUDIO,
  transit_narrative_url: CAMPO_DE_FIORI_SAMPLE_AUDIO,
  arrival_immersive_url: CAMPO_DE_FIORI_SAMPLE_AUDIO,
  arrival_alert_url: CAMPO_DE_FIORI_ARRIVAL_ALERT,
}
