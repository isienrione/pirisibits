export const OFFLINE_DB_NAME = 'chronowalk-offline'
export const OFFLINE_DB_VERSION = 2

export const STORES = {
  TOURS: 'tours',
  WAYPOINTS: 'waypoints',
  TRANSITS: 'transits',
  TRANSCRIPTS: 'transcripts',
  AUDIO_ASSETS: 'audioAssets',
  IMAGE_ASSETS: 'imageAssets',
  MEDIA_CUES: 'mediaCues',
  USER_PROGRESS: 'userProgress',
  COMPLETED_WAYPOINTS: 'completedWaypoints',
  /** Legacy package status + manifest summary for download manager compatibility */
  TOUR_PACKAGES: 'tour-packages',
}

export const AUDIO_ASSET_FIELDS = [
  'ambient_url',
  'transit_narrative_url',
  'arrival_immersive_url',
  'arrival_alert_url',
]

export const IMAGE_ASSET_FIELDS = [
  'modern_image_url',
  'modern_video_url',
  'modern_poster_url',
  'ancient_image_url',
  'ancient_video_url',
  'ancient_poster_url',
  'depth_map_url',
]

export function createStoreIndexes(store, storeName) {
  if (
    storeName === STORES.WAYPOINTS ||
    storeName === STORES.TRANSITS ||
    storeName === STORES.TRANSCRIPTS ||
    storeName === STORES.AUDIO_ASSETS ||
    storeName === STORES.IMAGE_ASSETS ||
    storeName === STORES.MEDIA_CUES ||
    storeName === STORES.COMPLETED_WAYPOINTS
  ) {
    if (!store.indexNames.contains('tourId')) {
      store.createIndex('tourId', 'tourId')
    }
  }

  if (storeName === STORES.AUDIO_ASSETS || storeName === STORES.IMAGE_ASSETS) {
    if (!store.indexNames.contains('stopId')) {
      store.createIndex('stopId', 'stopId')
    }
    if (!store.indexNames.contains('cacheKey')) {
      store.createIndex('cacheKey', 'cacheKey')
    }
  }
}

export function upgradeOfflineDatabase(db, oldVersion) {
  if (!db.objectStoreNames.contains(STORES.TOUR_PACKAGES)) {
    db.createObjectStore(STORES.TOUR_PACKAGES, { keyPath: 'tourId' })
  }

  if (oldVersion >= OFFLINE_DB_VERSION) return

  if (!db.objectStoreNames.contains(STORES.TOURS)) {
    db.createObjectStore(STORES.TOURS, { keyPath: 'tourId' })
  }

  const multiStoreNames = [
    STORES.WAYPOINTS,
    STORES.TRANSITS,
    STORES.TRANSCRIPTS,
    STORES.AUDIO_ASSETS,
    STORES.IMAGE_ASSETS,
    STORES.MEDIA_CUES,
    STORES.COMPLETED_WAYPOINTS,
  ]

  for (const storeName of multiStoreNames) {
    if (!db.objectStoreNames.contains(storeName)) {
      createStoreIndexes(db.createObjectStore(storeName, { keyPath: 'id' }), storeName)
    }
  }

  if (!db.objectStoreNames.contains(STORES.USER_PROGRESS)) {
    db.createObjectStore(STORES.USER_PROGRESS, { keyPath: 'tourId' })
  }
}
