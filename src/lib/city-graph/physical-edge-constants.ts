/**
 * Gate 1B.3 — inspectable pedestrian edge classification thresholds.
 * Provider-derived duration drives class; haversine is candidate pruning only.
 */

/** Continuous pedestrian transition, generally comfortable for tourists. */
export const WALK_CLASS_GREEN_MAX_MIN = 20

/** Longer but still plausible continuous walk. */
export const WALK_CLASS_YELLOW_MAX_MIN = 35

/** Technically walkable but usually undesirable as one continuous transition. */
export const WALK_CLASS_ORANGE_MAX_MIN = 60

/** Beyond this provider duration, edge is RED / not runtime-eligible. */
export const WALK_CLASS_RED_MIN = 60

/** Sparse candidate generation — straight-line pruning only. */
export const CANDIDATE_NEAREST_NEIGHBORS = 10
export const CANDIDATE_MAX_STRAIGHT_LINE_KM = 2.0

/** Mapbox walking directions profile. */
export const MAPBOX_WALKING_PROFILE = 'mapbox/walking'
