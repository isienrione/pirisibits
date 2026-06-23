export const COLOSSEUM = { lat: 41.8902, lng: 12.4922 }

// Covers the Colosseum footprint plus surrounding plaza and approach paths
export const COLOSSEUM_ARRIVAL_RADIUS_M = 150

// Debug position ~120m from center, still inside the arrival zone
export const DEBUG_USER_POS = { lat: 41.8894, lng: 12.4933 }

export const COLOSSEUM_WAYPOINT = {
  id: 'colosseum',
  title: 'The Colosseum',
  lat: COLOSSEUM.lat,
  lng: COLOSSEUM.lng,
  modern_image_url:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Colosseo_2020.jpg/1280px-Colosseo_2020.jpg',
  ancient_image_url:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Colosseum_Reconstruction_by_Carl_Friedrich_Fehling%2C_1830.jpg/1280px-Colosseum_Reconstruction_by_Carl_Friedrich_Fehling%2C_1830.jpg',
}
