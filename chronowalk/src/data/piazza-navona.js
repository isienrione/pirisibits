export const PIAZZA_NAVONA = { lat: 41.89918, lng: 12.47306 }

/** Asset Studio (AI prompts): http://localhost:5173/?assetStudio=true&waypoint=piazza-navona */

/**
 * South edge of the oval piazza, facing north toward Bernini's central fountain.
 * Ancient layer: Stadium of Domitian (Circus Agonalis) — same camera, era swap only.
 *
 * Street View scout: walk from Corso del Rinascimento into the piazza until
 * the baroque facades and fountain fill the frame (compact_piazza band).
 */
export const PIAZZA_NAVONA_VIEWPOINT = {
  lat: 41.89878,
  lng: 12.47302,
  heading: 2,
  pitch: 18,
}

export const PIAZZA_NAVONA_STREET_VIEW_URL =
  'https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=41.89878,12.47302&heading=2&pitch=18'

export const PIAZZA_NAVONA_SLIDER_POST_ANIMATION_LOOP_MS = 10000
export const PIAZZA_NAVONA_SLIDER_POSTER_AT_SEC = 3
export const PIAZZA_NAVONA_GEOFENCE_ARRIVAL_THRESHOLD_M = 30
export const PIAZZA_NAVONA_ARRIVAL_RADIUS_M = 110
export const PIAZZA_NAVONA_DEBUG_USER_POS = { lat: PIAZZA_NAVONA.lat, lng: PIAZZA_NAVONA.lng }

const PIAZZA_NAVONA_SAMPLE_AUDIO = '/waypoints/piazza-navona/Audio_sample.mp3'
const PIAZZA_NAVONA_ARRIVAL_ALERT = '/waypoints/piazza-navona/geocache-arrival-alert.wav'
const PIAZZA_NAVONA_MODERN_IMAGE = '/waypoints/piazza-navona/modern-exterior.jpg'
const PIAZZA_NAVONA_MODERN_VIDEO = '/waypoints/piazza-navona/modern.mp4'
const PIAZZA_NAVONA_MODERN_POSTER = '/waypoints/piazza-navona/modern-poster.jpg'
const PIAZZA_NAVONA_ANCIENT_IMAGE = '/waypoints/piazza-navona/ancient-reconstruction.jpg'
const PIAZZA_NAVONA_ANCIENT_VIDEO = '/waypoints/piazza-navona/ancient-reconstruction.mp4'
const PIAZZA_NAVONA_ANCIENT_POSTER = '/waypoints/piazza-navona/ancient-poster.jpg'

export const PIAZZA_NAVONA_WAYPOINT = {
  id: 'piazza-navona',
  title: 'Piazza Navona',
  framingProfile: 'compact_piazza',
  arrival_headline: "You've reached Piazza Navona!",
  arrival_subtitle:
    "Bernini's fountains and baroque palaces cover the bones of Domitian's stadium — peel back the centuries.",
  immersive_orientation_hint:
    'Stand on the southern edge of the oval piazza, facing north toward the central fountain, then begin the immersive view.',
  lat: PIAZZA_NAVONA.lat,
  lng: PIAZZA_NAVONA.lng,
  viewpoint: PIAZZA_NAVONA_VIEWPOINT,
  modern_image_url: PIAZZA_NAVONA_MODERN_IMAGE,
  modern_video_url: PIAZZA_NAVONA_MODERN_VIDEO,
  modern_poster_url: PIAZZA_NAVONA_MODERN_POSTER,
  ancient_image_url: PIAZZA_NAVONA_ANCIENT_IMAGE,
  ancient_video_url: PIAZZA_NAVONA_ANCIENT_VIDEO,
  ancient_poster_url: PIAZZA_NAVONA_ANCIENT_POSTER,
  slider_poster_at_sec: PIAZZA_NAVONA_SLIDER_POSTER_AT_SEC,
  slider_post_animation_loop_ms: PIAZZA_NAVONA_SLIDER_POST_ANIMATION_LOOP_MS,
  slider_freeze_at_sec: PIAZZA_NAVONA_SLIDER_POSTER_AT_SEC,
  ambient_url: PIAZZA_NAVONA_SAMPLE_AUDIO,
  transit_narrative_url: PIAZZA_NAVONA_SAMPLE_AUDIO,
  arrival_immersive_url: PIAZZA_NAVONA_SAMPLE_AUDIO,
  arrival_alert_url: PIAZZA_NAVONA_ARRIVAL_ALERT,
}
