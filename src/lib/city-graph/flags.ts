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
