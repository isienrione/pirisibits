/**
 * Gate 1B.3 / 1B.4 — inspectable physical-edge and multimodal policy constants.
 * Provider-derived duration drives walk class; haversine is candidate pruning only.
 * ENGINE POLICY constants are generalized-cost frictions — NEVER observed travel time.
 */

/** Continuous pedestrian transition, generally comfortable for tourists. */
export const WALK_CLASS_GREEN_MAX_MIN = 20

/** Longer but still plausible continuous walk. */
export const WALK_CLASS_YELLOW_MAX_MIN = 35

/** Technically walkable but usually undesirable as one continuous transition. */
export const WALK_CLASS_ORANGE_MAX_MIN = 60

/** Beyond this provider duration, edge is RED / not runtime-eligible. */
export const WALK_CLASS_RED_MIN = 60

/** Sparse candidate generation — straight-line pruning only (Gate 1B.3). */
export const CANDIDATE_NEAREST_NEIGHBORS = 10
export const CANDIDATE_MAX_STRAIGHT_LINE_KM = 2.0

/** Mapbox walking directions profile. */
export const MAPBOX_WALKING_PROFILE = 'mapbox/walking'

// --- Gate 1B.4 sparse operational adjacency ---

/**
 * Always keep very short local walks (minutes). Preserves plaza/block adjacency.
 * Rationale: local tourist hops should never be sparsified away.
 */
export const SPARSE_ALWAYS_KEEP_MAX_MIN = 8

/**
 * Cap nearest operational neighbors retained per node (by provider duration).
 * Rationale: avoid dense nearly-complete graph while keeping local options.
 */
export const SPARSE_NEAREST_NEIGHBORS = 4

/**
 * Direct walks longer than this are candidates for sparsification if a local
 * chain still connects the component. Rationale: long direct edges duplicate
 * multi-hop paths and inflate operational degree.
 */
export const SPARSE_REDUNDANT_DIRECT_MIN = 18

/**
 * Maximum provider walk minutes retained as operational adjacency unless the
 * edge is a connectivity bridge. Rationale: operational preference ≠ reachability.
 */
export const SPARSE_MAX_OPERATIONAL_MIN = 25

// --- Gate 1B.4 POI ↔ Metro access ---

/**
 * Consider Metro stations within this straight-line km for access candidacy.
 * Haversine pruning only — runtime access cost comes from Mapbox walking.
 */
export const METRO_ACCESS_CANDIDATE_MAX_KM = 1.2

/**
 * Max Mapbox-walk minutes for a useful POI→Metro access edge.
 * Longer walks are recorded in QA but not marked runtime-preferred.
 */
export const METRO_ACCESS_USEFUL_MAX_MIN = 15

/**
 * Keep at most this many runtime Metro access stations per POI (nearest useful).
 */
export const METRO_ACCESS_MAX_PER_POI = 2

// --- Gate 1B.4 ENGINE POLICY generalized-cost frictions (NOT observed time) ---

/** Engine policy: boarding/entry friction (seconds of generalized cost). */
export const ENGINE_POLICY_METRO_ENTRY_FRICTION_S = 180

/** Engine policy: interchange transfer friction (seconds of generalized cost). */
export const ENGINE_POLICY_METRO_TRANSFER_FRICTION_S = 240

/** Engine policy: mode-change friction beyond entry (seconds). */
export const ENGINE_POLICY_MODE_CHANGE_FRICTION_S = 60

/** Engine policy: rideshare invocation friction (seconds). */
export const ENGINE_POLICY_RIDESHARE_INVOCATION_FRICTION_S = 300

/**
 * Engine policy: long-walk discomfort multiplier applied to walk duration
 * above SPARSE_ALWAYS_KEEP_MAX_MIN when computing generalized cost only.
 * 1.0 = no extra discomfort. Observed physical duration is never multiplied.
 */
export const ENGINE_POLICY_LONG_WALK_DISCOMFORT_FACTOR = 1.15

/**
 * When observed Metro segment duration is unresolved, use this topology-only
 * generalized cost per consecutive station hop (NOT labeled as observed time).
 * Gate 1B.4.1: operational rides prefer SCHEDULED_GTFS_DURATION medians instead.
 */
export const ENGINE_POLICY_METRO_HOP_FALLBACK_S = 120

/**
 * Engine policy estimated wait when boarding Metro (seconds).
 * Half of a typical ~6 min headway. NOT scheduled ride time and NOT physical observation.
 */
export const ENGINE_POLICY_METRO_WAIT_FALLBACK_S = 180
