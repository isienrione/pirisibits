export const PANTHEON = { lat: 41.89885, lng: 12.47687 }

/** Asset Studio (AI prompts): http://localhost:5173/?assetStudio=true&waypoint=pantheon */

/**
 * Mid-piazza POV facing the portico — closer than the fountain-wide Street View shot.
 * Re-scouted to match Colosseum-style framing (monument fills the frame).
 *
 * Previous pass used the Maps place pin / fountain fisheye (offset ~0 m, pitch 10.5°).
 * modern-exterior.jpg cropped from a mid-piazza frontal reference (see public README).
 */
export const PANTHEON_VIEWPOINT = {
  lat: 41.89862,
  lng: 12.47687,
  heading: 3,
  pitch: 18,
}

/** Original wide fountain Street View (kept for re-scout reference). */
export const PANTHEON_STREET_VIEW_URL_FOUNTAIN =
  'https://www.google.com/maps/place/Pantheon/@41.8986108,12.4768729,3a,90y,3.07h,100.52t/data=!3m8!1e1!3m6!1sCIHM0ogKEICAgIDV6br5bg!2e10!3e11!6shttps:%2F%2Flh3.googleusercontent.com%2Fgpms-cs-s%2FABJJf51LKVR044lHUoLIGS2UMllK-HoX8kFBA0b1VF3-VWV8UitNWedQufvTx-CsnunH3hbmK2wZdTT5a3OFV_-AatIP5r9GueSQEHQQp5kJdKqdL-XJxbYbxDjVMxJEUpYcKd8hWVk%3Dw900-h600-k-no-pi-10.519274044590489-ya3.069271703843299-ro0-fo100!7i5952!8i2976!4m9!3m8!1s0x132f604f678640a9:0xcad165fa2036ce2c!8m2!3d41.8986108!4d12.4768729!10e5!14m1!1BCgIgARICCAI!16zL20vMDF4emR6'

export const PANTHEON_STREET_VIEW_URL =
  'https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=41.89862,12.47687&heading=3&pitch=18'

export const PANTHEON_SLIDER_POST_ANIMATION_LOOP_MS = 10000
export const PANTHEON_SLIDER_POSTER_AT_SEC = 3
export const PANTHEON_GEOFENCE_ARRIVAL_THRESHOLD_M = 30
export const PANTHEON_ARRIVAL_RADIUS_M = 100
export const PANTHEON_DEBUG_USER_POS = { lat: PANTHEON.lat, lng: PANTHEON.lng }

const PANTHEON_SAMPLE_AUDIO = '/waypoints/pantheon/Audio_sample.mp3'
const PANTHEON_ARRIVAL_ALERT = '/waypoints/pantheon/geocache-arrival-alert.wav'
const PANTHEON_MODERN_IMAGE = '/waypoints/pantheon/modern-exterior.jpg'
const PANTHEON_MODERN_VIDEO = '/waypoints/pantheon/modern.mp4'
const PANTHEON_MODERN_POSTER = '/waypoints/pantheon/modern-poster.jpg'
const PANTHEON_ANCIENT_IMAGE = '/waypoints/pantheon/ancient-reconstruction.jpg'
const PANTHEON_ANCIENT_VIDEO = '/waypoints/pantheon/ancient-reconstruction.mp4'
const PANTHEON_ANCIENT_POSTER = '/waypoints/pantheon/ancient-poster.jpg'

export const PANTHEON_WAYPOINT = {
  id: 'pantheon',
  title: 'The Pantheon',
  media_cache_version: 3,
  framingProfile: 'compact_piazza',
  arrival_headline: "You've reached the Pantheon!",
  arrival_subtitle: 'The temple of all gods awaits — step into imperial Rome.',
  immersive_orientation_hint:
    'Stand in Piazza della Rotonda facing the portico — partway between the fountain and the steps — then begin the immersive view.',
  lat: PANTHEON.lat,
  lng: PANTHEON.lng,
  viewpoint: PANTHEON_VIEWPOINT,
  modern_image_url: PANTHEON_MODERN_IMAGE,
  modern_video_url: PANTHEON_MODERN_VIDEO,
  modern_poster_url: PANTHEON_MODERN_POSTER,
  ancient_image_url: PANTHEON_ANCIENT_IMAGE,
  ancient_video_url: PANTHEON_ANCIENT_VIDEO,
  ancient_poster_url: PANTHEON_ANCIENT_POSTER,
  slider_poster_at_sec: PANTHEON_SLIDER_POSTER_AT_SEC,
  slider_post_animation_loop_ms: PANTHEON_SLIDER_POST_ANIMATION_LOOP_MS,
  slider_freeze_at_sec: PANTHEON_SLIDER_POSTER_AT_SEC,
  ambient_url: PANTHEON_SAMPLE_AUDIO,
  transit_narrative_url: PANTHEON_SAMPLE_AUDIO,
  arrival_immersive_url: PANTHEON_SAMPLE_AUDIO,
  arrival_alert_url: PANTHEON_ARRIVAL_ALERT,
}
