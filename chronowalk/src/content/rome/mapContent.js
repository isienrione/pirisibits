/**
 * MAP Day-3A content data (sibling to manifest.json).
 *
 * Production collections stay empty until later days author real metadata /
 * discoveries. Runtime defaults are applied in mapContentModel.js so legacy
 * waypoints remain valid without editing the generated manifest JSON.
 *
 * Do NOT put discoveries into Path A/B sequences, hero completion, or commerce.
 */

/** Optional per-place MAP overrides keyed by canonical placeId (wXX / enc_circus / pause). */
export const MAP_PLACE_OVERRIDES = Object.freeze({})

/**
 * Production discovery collection.
 * Empty on purpose for Day 3A — fixtures live under __fixtures__ for tests only.
 */
export const MAP_DISCOVERIES = Object.freeze([])
