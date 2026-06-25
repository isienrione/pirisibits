export const CASTEL_SANT_ANGELO = { lat: 41.90306, lng: 12.46627 }

/** Asset Studio: http://localhost:5173/?assetStudio=true&waypoint=castel-sant-angelo */

/** Ponte Sant'Angelo — frontal view of the castle drum (rescouted POV). */
export const CASTEL_SANT_ANGELO_VIEWPOINT = {
  lat: 41.9025034,
  lng: 12.4664057,
  heading: 15,
  pitch: 18,
}

export const CASTEL_SANT_ANGELO_STREET_VIEW_URL =
  'https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=41.9025034,12.4664057&heading=15&pitch=18'

export const CASTEL_SANT_ANGELO_SLIDER_POST_ANIMATION_LOOP_MS = 10000
export const CASTEL_SANT_ANGELO_SLIDER_POSTER_AT_SEC = 3
export const CASTEL_SANT_ANGELO_GEOFENCE_ARRIVAL_THRESHOLD_M = 30
export const CASTEL_SANT_ANGELO_ARRIVAL_RADIUS_M = 120
export const CASTEL_SANT_ANGELO_DEBUG_USER_POS = {
  lat: CASTEL_SANT_ANGELO.lat,
  lng: CASTEL_SANT_ANGELO.lng,
}

const CASTEL_SANT_ANGELO_SAMPLE_AUDIO = '/waypoints/castel-sant-angelo/Audio_sample.mp3'
const CASTEL_SANT_ANGELO_ARRIVAL_ALERT = '/waypoints/castel-sant-angelo/geocache-arrival-alert.wav'
const CASTEL_SANT_ANGELO_MODERN_IMAGE = '/waypoints/castel-sant-angelo/modern-exterior.jpg'
const CASTEL_SANT_ANGELO_MODERN_VIDEO = '/waypoints/castel-sant-angelo/modern.mp4'
const CASTEL_SANT_ANGELO_MODERN_POSTER = '/waypoints/castel-sant-angelo/modern-poster.jpg'
const CASTEL_SANT_ANGELO_ANCIENT_IMAGE = '/waypoints/castel-sant-angelo/ancient-reconstruction.jpg'
const CASTEL_SANT_ANGELO_ANCIENT_VIDEO = '/waypoints/castel-sant-angelo/ancient-reconstruction.mp4'
const CASTEL_SANT_ANGELO_ANCIENT_POSTER = '/waypoints/castel-sant-angelo/ancient-poster.jpg'

export const CASTEL_SANT_ANGELO_WAYPOINT = {
  id: 'castel-sant-angelo',
  title: "Castel Sant'Angelo",
  media_cache_version: 3,
  framingProfile: 'large_approach',
  arrival_headline: "You've reached Castel Sant'Angelo!",
  arrival_subtitle:
    "Hadrian's mausoleum became a papal fortress — drag time back to Rome's marble drum and bronze angel.",
  immersive_orientation_hint:
    'Stand on Ponte Sant\'Angelo facing the round castle, then begin the immersive view.',
  lat: CASTEL_SANT_ANGELO.lat,
  lng: CASTEL_SANT_ANGELO.lng,
  viewpoint: CASTEL_SANT_ANGELO_VIEWPOINT,
  modern_image_url: CASTEL_SANT_ANGELO_MODERN_IMAGE,
  modern_video_url: CASTEL_SANT_ANGELO_MODERN_VIDEO,
  modern_poster_url: CASTEL_SANT_ANGELO_MODERN_POSTER,
  ancient_image_url: CASTEL_SANT_ANGELO_ANCIENT_IMAGE,
  ancient_video_url: CASTEL_SANT_ANGELO_ANCIENT_VIDEO,
  ancient_poster_url: CASTEL_SANT_ANGELO_ANCIENT_POSTER,
  slider_poster_at_sec: CASTEL_SANT_ANGELO_SLIDER_POSTER_AT_SEC,
  slider_post_animation_loop_ms: CASTEL_SANT_ANGELO_SLIDER_POST_ANIMATION_LOOP_MS,
  slider_freeze_at_sec: CASTEL_SANT_ANGELO_SLIDER_POSTER_AT_SEC,
  ambient_url: CASTEL_SANT_ANGELO_SAMPLE_AUDIO,
  transit_narrative_url: CASTEL_SANT_ANGELO_SAMPLE_AUDIO,
  arrival_immersive_url: CASTEL_SANT_ANGELO_SAMPLE_AUDIO,
  arrival_alert_url: CASTEL_SANT_ANGELO_ARRIVAL_ALERT,
}
