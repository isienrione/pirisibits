export const COLOSSEUM = { lat: 41.8902, lng: 12.4922 }

// Narrative state: TRANSIT vs ARRIVAL
export const GEOFENCE_ARRIVAL_THRESHOLD_M = 30

// Visual zone on the map (broader approach area)
export const COLOSSEUM_ARRIVAL_RADIUS_M = 150

// Debug uses Colosseum coords so ARRIVAL state triggers; marker is nudged on map for visibility
export const DEBUG_USER_POS = { lat: COLOSSEUM.lat, lng: COLOSSEUM.lng }

export const COLOSSEUM_WAYPOINT = {
  id: 'colosseum',
  title: 'The Colosseum',
  lat: COLOSSEUM.lat,
  lng: COLOSSEUM.lng,
  modern_image_url:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Colosseo_2020.jpg/1280px-Colosseo_2020.jpg',
  ancient_image_url:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Colosseum_Reconstruction_by_Carl_Friedrich_Fehling%2C_1830.jpg/1280px-Colosseum_Reconstruction_by_Carl_Friedrich_Fehling%2C_1830.jpg',
  depth_map_url: null,
  transit_narrative_url: null,
  arrival_immersive_url: null,
}
