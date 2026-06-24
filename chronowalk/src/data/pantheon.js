export const PANTHEON = { lat: 41.8986108, lng: 12.4768729 }

/**
 * Camera POV from Piazza della Rotonda fountain, facing the Pantheon portico.
 * Source: Google Street View (Mar 2024 pano)
 * https://www.google.com/maps/place/Pantheon/@41.8986108,12.4768729,3a,90y,3.07h,100.52t/...
 */
export const PANTHEON_VIEWPOINT = {
  lat: 41.8986108,
  lng: 12.4768729,
  heading: 3.07,
  pitch: 10.52,
}

export const PANTHEON_STREET_VIEW_URL =
  'https://www.google.com/maps/place/Pantheon/@41.8986108,12.4768729,3a,90y,3.07h,100.52t/data=!3m8!1e1!3m6!1sCIHM0ogKEICAgIDV6br5bg!2e10!3e11!6shttps:%2F%2Flh3.googleusercontent.com%2Fgpms-cs-s%2FABJJf51LKVR044lHUoLIGS2UMllK-HoX8kFBA0b1VF3-VWV8UitNWedQufvTx-CsnunH3hbmK2wZdTT5a3OFV_-AatIP5r9GueSQEHQQp5kJdKqdL-XJxbYbxDjVMxJEUpYcKd8hWVk%3Dw900-h600-k-no-pi-10.519274044590489-ya3.069271703843299-ro0-fo100!7i5952!8i2976!4m9!3m8!1s0x132f604f678640a9:0xcad165fa2036ce2c!8m2!3d41.8986108!4d12.4768729!10e5!14m1!1BCgIgARICCAI!16zL20vMDF4emR6'

export const PANTHEON_SLIDER_POST_ANIMATION_LOOP_MS = 10000
export const PANTHEON_SLIDER_POSTER_AT_SEC = 3

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
  arrival_headline: "You've reached the Pantheon!",
  arrival_subtitle: 'The temple of all gods awaits — step into imperial Rome.',
  immersive_orientation_hint:
    'Stand by the fountain in Piazza della Rotonda, facing the portico, then begin the immersive view.',
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
  depth_map_url: '/waypoints/pantheon/depth-map.png',
  transit_narrative_url: PANTHEON_SAMPLE_AUDIO,
  arrival_immersive_url: PANTHEON_SAMPLE_AUDIO,
  arrival_alert_url: PANTHEON_ARRIVAL_ALERT,
}
