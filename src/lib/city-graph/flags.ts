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

/**
 * Gate 2E.5-QA — measurement / invariants / parallel Vnext scaffolds.
 * NON-CANONICAL branch work. Does NOT enable production cutovers.
 */
export const GATE_2E5_QA_MEASUREMENT_READY = true

/** Parallel PhysicalEfficiency Vnext — not wired into arbitration. */
export const PHYSICAL_EFFICIENCY_VNEXT_PARALLEL_READY = true
export const PHYSICAL_EFFICIENCY_VNEXT_PRODUCTION = false

/** Parallel ArcQuality Vnext (timeUtilization removed) — not wired into runtime. */
export const ARC_QUALITY_VNEXT_PARALLEL_READY = true
export const ARC_QUALITY_VNEXT_PRODUCTION = false

/** Place/Experience/Content schema parallel — Launch30 not migrated. */
export const PLACE_EXPERIENCE_SCHEMA_V0_1_PARALLEL_READY = true
export const PLACE_EXPERIENCE_SCHEMA_V0_1_PRODUCTION = false

/**
 * Gate 2E.6 — Feature-Complete Alpha (NON-CANONICAL quarantine).
 * VNext shadow pipeline is executable end-to-end. NOT production.
 */
export const ENGINE_FEATURE_COMPLETE_ALPHA = true
export const ENGINE_FEATURE_COMPLETE_ALPHA_CANONICAL = false

export const EXPERIENCE_GRAPH_VNEXT_READY = true
export const EXPERIENCE_TIME_VNEXT_READY = true
export const ARCSTATE_VNEXT_READY = true
export const COMPOSER_VNEXT_READY = true
export const ARCQUALITY_VNEXT_READY = true
export const ARBITRATION_VNEXT_READY = true
export const EXPLANATION_ENGINE_READY = true
export const LIVE_TRACE_READY = true

/** Explicit production guards remain false. */
export const EXPERIENCE_TIME_PRODUCTION = false
export const PRODUCTION_ROUTE_GENERATION = false

