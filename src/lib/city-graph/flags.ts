/**
 * Gate 1B.2 — physical route generation stays disabled.
 * Canonical inventory + provider candidates + curator review must complete
 * before any route composer may consume physical edges.
 */
export const PHYSICAL_ROUTE_GENERATION_ENABLED = false

/** Mapbox provider selection is never automatic curator approval. */
export const AUTO_CURATOR_APPROVE_FROM_MAPBOX = false
