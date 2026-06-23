// Delay before the waypoint card slides up (after map + arrival chime)
export const CARD_REVEAL_DELAY_MS = 1400

// Narrative state: TRANSIT vs ARRIVAL
export const GEOFENCE_ARRIVAL_THRESHOLD_M = 30

// Visual zone on the map (broader approach area)
export const COLOSSEUM_ARRIVAL_RADIUS_M = 150

// Debug uses Colosseum coords so ARRIVAL state triggers; marker is nudged on map for visibility
export const DEBUG_USER_POS = { lat: COLOSSEUM.lat, lng: COLOSSEUM.lng }

// Place your file at: chronowalk/public/waypoints/colosseum/Audio_sample.mp3
const COLOSSEUM_SAMPLE_AUDIO = '/waypoints/colosseum/Audio_sample.mp3'
// Short GPS arrival chime — place at public/waypoints/colosseum/geocache-arrival-alert.wav
const COLOSSEUM_ARRIVAL_ALERT = '/waypoints/colosseum/geocache-arrival-alert.wav'

export const COLOSSEUM_WAYPOINT = {
  id: 'colosseum',
  title: 'The Colosseum',
  arrival_headline: "You've reached the Colosseum!",
  arrival_subtitle: 'Ancient Rome awaits — choose how you want to explore.',
  lat: COLOSSEUM.lat,
  lng: COLOSSEUM.lng,
  modern_image_url:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Colosseo_2020.jpg/1280px-Colosseo_2020.jpg',
  ancient_image_url:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Colosseum_Reconstruction_by_Carl_Friedrich_Fehling%2C_1830.jpg/1280px-Colosseum_Reconstruction_by_Carl_Friedrich_Fehling%2C_1830.jpg',
  ambient_url: COLOSSEUM_SAMPLE_AUDIO,
  depth_map_url: '/waypoints/colosseum/depth-map.png',
  transit_narrative_url: COLOSSEUM_SAMPLE_AUDIO,
  arrival_immersive_url: COLOSSEUM_SAMPLE_AUDIO,
  arrival_alert_url: COLOSSEUM_ARRIVAL_ALERT,
}
