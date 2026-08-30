/**
 * Gate 1B.2 — physical route generation stays disabled.
 * Canonical inventory + provider candidates + curator review must complete
 * before any route composer may consume physical edges.
 */
export const PHYSICAL_ROUTE_GENERATION_ENABLED = false

/** Mapbox provider selection is never automatic curator approval. */
export const AUTO_CURATOR_APPROVE_FROM_MAPBOX = false

/**
 * Gate 1B.4 — multimodal physical substrate readiness.
 * Remains false until Gate 1B.4 acceptance criteria all pass; does NOT enable
 * traveler-facing route generation.
 */
export const MULTIMODAL_PHYSICAL_GRAPH_READY = true

/**
 * Gate 1B.5 — Santiago physical graph V0.1 freeze.
 * True only after Gate 1B.5 closure validators pass. Does NOT enable traveler
 * route generation (`PHYSICAL_ROUTE_GENERATION_ENABLED` remains false).
 */
export const PHYSICAL_LAYER_V0_1_READY = true

/**
 * Gate 2A.1 — node eligibility + NodeUtility readiness remains true.
 * Editorial calibration proposals are available for founder review.
 */
export const NODE_UTILITY_V0_1_READY = true

/** Proposed (not founder-approved) editorial calibration package ready. */
export const EDITORIAL_CALIBRATION_V0_1_PROPOSED_READY = true

/** Remains false until founder-approved calibration is ingested. */
export const EDITORIAL_CALIBRATION_CURATOR_APPROVED = false

/**
 * Gate 2B — engine may consume proposed editorial calibration for provisional
 * narrative artifacts. Does NOT mean curator approval or traveler routing.
 */
export const ENGINE_USING_PROVISIONAL_EDITORIAL_CALIBRATION = true

/**
 * Gate 2B — provisional narrative graph / NarrativeEdgeScore readiness.
 * Does NOT enable traveler route generation.
 */
export const NARRATIVE_GRAPH_V0_1_PROPOSED_READY = true

/**
 * Gate 2C — provisional route composer readiness for Route Lab / founder inspection.
 * Does NOT enable production traveler routing (`PHYSICAL_ROUTE_GENERATION_ENABLED` remains false).
 */
export const ROUTE_COMPOSER_V0_1_PROVISIONAL_READY = true

/**
 * Gate 2D — provisional ArcQuality + route reranker readiness.
 * Does NOT enable production traveler routing.
 */
export const ARC_QUALITY_V0_1_PROVISIONAL_READY = true

/**
 * Gate 2E — Santiago Route Lab dev/editorial tool readiness.
 * Does NOT enable production traveler routing.
 */
export const ROUTE_LAB_V0_1_READY = true

/**
 * Gate 2E.1 — Route Lab geographic QA (basemap, canonical geometry, human review).
 * Observability only — does NOT enable production traveler routing.
 */
export const ROUTE_LAB_GEOGRAPHIC_QA_READY = true

/**
 * Gate 2E.2A — parallel scoring model V0.2 foundations (diagnostic only, not production).
 */
export const SCORING_MODEL_V0_2_PARALLEL_READY = true

/** Gate 2E.2A — proposed editorial dimensions artifact for 104 nodes. */
export const EDITORIAL_DIMENSIONS_V0_2_PROPOSED_READY = true

/**
 * Gate 2E.2E — lane-neutral route arbitration (parallel only).
 * Does NOT enable production traveler routing.
 */
export const ROUTE_ARBITRATION_V0_2_PARALLEL_READY = true

/** Never true in this gate. */
export const ROUTE_ARBITRATION_V0_2_PRODUCTION = false

/** Never true in this gate. */
export const ROUTE_COMPOSER_V0_2_PRODUCTION = false

/** Never true in this gate. */
export const ARCQUALITY_V0_2_PRODUCTION = false

/**
 * Gate 2E.4 — Experience-Time Model V0.1 parallel scaffold ready.
 * Contract + evaluator only — does NOT cut into production composition.
 */
export const EXPERIENCE_TIME_MODEL_V0_1_PARALLEL_READY = true

/** Gate 2E.4 — never true in this gate (no production cutover). */
export const EXPERIENCE_TIME_MODEL_V0_1_PRODUCTION = false
