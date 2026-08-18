/** Adaptive curated-route V0. Not a commercial SKU and not an LLM itinerary. */

export const ROUTE_STORAGE_KEY = 'cw_route_v1'
export const ROUTE_STORAGE_VERSION = 1
export const ROUTE_CHANGED_EVENT = 'cw-route-changed'

export const ROUTE_ITEM_STATES = Object.freeze({
  PLANNED: 'planned',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  SKIPPED: 'skipped',
  REMOVED: 'removed',
})

export const ROUTE_STATUS = Object.freeze({
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  ENDED: 'ended',
})

export const ROUTE_MUTATION_REASONS = Object.freeze({
  USER_ALTERNATIVE: 'user-alternative',
  USER_REORDER: 'user-reorder',
  USER_REMOVE: 'user-remove',
  USER_ADD: 'user-add',
  SURPRISE_CHOICE: 'surprise-choice',
  TIME_CHANGE: 'time-change',
  LOCATION_DEVIATION: 'location-deviation',
  PAUSE_RESUME: 'pause-resume',
  CONTEXT_CHANGE: 'context-change',
  STARTED: 'started',
  ITEM_COMPLETED: 'item-completed',
  ENDED: 'ended',
  ADJUST: 'adjust',
})

export const WALK_METERS_PER_MIN = 80

export const WALKING_LIMITS = Object.freeze({
  short: { maxLegM: 700, maxTotalM: 1800 },
  moderate: { maxLegM: 1400, maxTotalM: 3500 },
  long: { maxLegM: 2200, maxTotalM: 7000 },
})

export const MIN_ROUTE_ITEMS = 2
export const MAX_ROUTE_ITEMS = 5
export const TIME_FIT_TOLERANCE = 1.2

/** Evaluator exists; UI stays off unless remaining-time overrun is unambiguous. */
export const ROUTE_PROACTIVE_SUGGESTIONS = false

export const MYSTERY_COPY = Object.freeze({
  title: 'Surprise Discovery',
  teaser: 'There’s something on this street most people walk straight past.',
})
