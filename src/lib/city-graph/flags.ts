/**
 * Gate 1B.1 — physical route generation stays disabled.
 * Geocoding / curator review must complete before any route composer
 * may consume provider coordinates.
 */
export const PHYSICAL_ROUTE_GENERATION_ENABLED = false

/** Mapbox provider selection is never automatic curator approval. */
export const AUTO_CURATOR_APPROVE_FROM_MAPBOX = false
