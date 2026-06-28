export const FONTANA_DI_TREVI = { lat: 41.90094, lng: 12.48331 }

/** Asset Studio: http://localhost:5173/?assetStudio=true&waypoint=fontana-di-trevi */

/** Narrow-alley reveal POV — fountain fills frame at end of Via delle Muratte. */
export const FONTANA_DI_TREVI_VIEWPOINT = {
  lat: 41.90085,
  lng: 12.48345,
  heading: 180,
  pitch: 12,
}

export const FONTANA_DI_TREVI_GEOFENCE_ARRIVAL_THRESHOLD_M = 25
export const FONTANA_DI_TREVI_ARRIVAL_RADIUS_M = 80
export const FONTANA_DI_TREVI_DEBUG_USER_POS = {
  lat: FONTANA_DI_TREVI.lat,
  lng: FONTANA_DI_TREVI.lng,
}

const FONTANA_DI_TREVI_SAMPLE_AUDIO = '/waypoints/fontana-di-trevi/Audio_sample.mp3'
const FONTANA_DI_TREVI_ARRIVAL_ALERT = '/waypoints/fontana-di-trevi/geocache-arrival-alert.wav'
const FONTANA_DI_TREVI_MODERN_IMAGE = '/waypoints/fontana-di-trevi/modern-exterior.jpg'
const FONTANA_DI_TREVI_MODERN_VIDEO = '/waypoints/fontana-di-trevi/modern.mp4'
const FONTANA_DI_TREVI_MODERN_POSTER = '/waypoints/fontana-di-trevi/modern-poster.jpg'

export const FONTANA_DI_TREVI_WAYPOINT = {
  id: 'fontana-di-trevi',
  title: 'Fontana di Trevi',
  media_cache_version: 1,
  immersive_mode: 'modern_video',
  framingProfile: 'narrow_reveal',
  arrival_headline: "You've reached the Trevi Fountain!",
  arrival_subtitle:
    'Baroque Rome bursts into view at the end of the alley — watch the modern scene come alive.',
  immersive_orientation_hint:
    'Stand at the basin rail facing the fountain facade, then begin the immersive view.',
  lat: FONTANA_DI_TREVI.lat,
  lng: FONTANA_DI_TREVI.lng,
  viewpoint: FONTANA_DI_TREVI_VIEWPOINT,
  modern_image_url: FONTANA_DI_TREVI_MODERN_IMAGE,
  modern_video_url: FONTANA_DI_TREVI_MODERN_VIDEO,
  modern_poster_url: FONTANA_DI_TREVI_MODERN_POSTER,
  ambient_url: FONTANA_DI_TREVI_SAMPLE_AUDIO,
  transit_narrative_url: FONTANA_DI_TREVI_SAMPLE_AUDIO,
  arrival_immersive_url: FONTANA_DI_TREVI_SAMPLE_AUDIO,
  arrival_alert_url: FONTANA_DI_TREVI_ARRIVAL_ALERT,
}
