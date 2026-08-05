/**
 * Sample multi-city catalog fixtures for domain contract tests.
 * Rome values are sample data only — not production imports.
 */

/** @type {import('../catalog/types.js').City[]} */
export const SAMPLE_CITIES = [
  { cityId: 'rome', name: 'Rome', defaultLocale: 'en' },
  { cityId: 'florence', name: 'Florence', defaultLocale: 'en' },
]

/** @type {import('../catalog/types.js').TourProduct[]} */
export const SAMPLE_PRODUCTS = [
  {
    productId: 'rome-eternal',
    cityId: 'rome',
    name: 'Rome Eternal',
    routeIds: ['rome-eternal-main', 'rome-eternal-forum-loop'],
  },
  {
    productId: 'florence-heart',
    cityId: 'florence',
    name: 'Heart of Florence',
    routeIds: ['florence-heart-main'],
  },
]

/** @type {import('../catalog/types.js').Stop[]} */
export const SAMPLE_STOPS = [
  { stopId: 'curia-julia', cityId: 'rome', name: 'Curia Julia' },
  { stopId: 'pantheon-exterior', cityId: 'rome', name: 'Pantheon exterior' },
  {
    stopId: 'piazza-della-signoria',
    cityId: 'florence',
    name: 'Piazza della Signoria',
  },
]

/** @type {import('../catalog/types.js').Route[]} */
export const SAMPLE_ROUTES = [
  {
    routeId: 'rome-eternal-main',
    cityId: 'rome',
    productId: 'rome-eternal',
    name: 'Rome Eternal — main path',
    stops: [
      { stopId: 'curia-julia', displayOrder: 0 },
      { stopId: 'pantheon-exterior', displayOrder: 1 },
    ],
  },
  {
    routeId: 'rome-eternal-forum-loop',
    cityId: 'rome',
    productId: 'rome-eternal',
    name: 'Rome Eternal — forum loop',
    // Same stop, different display order — identity is stopId, not position.
    stops: [
      { stopId: 'pantheon-exterior', displayOrder: 0 },
      { stopId: 'curia-julia', displayOrder: 1 },
    ],
  },
  {
    routeId: 'florence-heart-main',
    cityId: 'florence',
    productId: 'florence-heart',
    name: 'Heart of Florence — main path',
    stops: [{ stopId: 'piazza-della-signoria', displayOrder: 0 }],
  },
]

/**
 * Field names that must never appear on domain contracts.
 * Kept as a living denylist for architecture tests.
 */
export const FORBIDDEN_ROME_SPECIFIC_FIELDS = Object.freeze([
  'hasRomeAccess',
  'romeRoute',
  'romeStops',
  'waypoint12',
  'romeWaypoint',
  'romeOnly',
])
