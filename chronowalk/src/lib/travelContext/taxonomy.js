/**
 * City-agnostic traveler interest taxonomy.
 * Rome-specific flavor belongs on Rome content metadata, not these ids.
 */

export const INTEREST_IDS = Object.freeze({
  HISTORY: 'history',
  ARCHITECTURE_DESIGN: 'architecture-design',
  ART: 'art',
  FOOD_LOCAL_LIFE: 'food-local-life',
  POLITICS_POWER: 'politics-power',
  RELIGION_BELIEF: 'religion-belief',
  ENGINEERING: 'engineering',
  PEOPLE_EVERYDAY: 'people-everyday',
  HIDDEN_PLACES: 'hidden-places',
  ICONIC_SIGHTS: 'iconic-sights',
  NATURE_LANDSCAPE: 'nature-landscape',
  CONTEMPORARY_CULTURE: 'contemporary-culture',
})

/** @type {ReadonlyArray<{ id: string, label: string }>} */
export const GLOBAL_INTERESTS = Object.freeze([
  { id: INTEREST_IDS.HISTORY, label: 'History' },
  { id: INTEREST_IDS.ARCHITECTURE_DESIGN, label: 'Architecture & design' },
  { id: INTEREST_IDS.ART, label: 'Art' },
  { id: INTEREST_IDS.FOOD_LOCAL_LIFE, label: 'Food & local life' },
  { id: INTEREST_IDS.POLITICS_POWER, label: 'Politics & power' },
  { id: INTEREST_IDS.RELIGION_BELIEF, label: 'Religion & belief' },
  { id: INTEREST_IDS.ENGINEERING, label: 'Engineering' },
  { id: INTEREST_IDS.PEOPLE_EVERYDAY, label: 'People & everyday life' },
  { id: INTEREST_IDS.HIDDEN_PLACES, label: 'Hidden places' },
  { id: INTEREST_IDS.ICONIC_SIGHTS, label: 'Iconic sights' },
  { id: INTEREST_IDS.NATURE_LANDSCAPE, label: 'Nature & landscape' },
  { id: INTEREST_IDS.CONTEMPORARY_CULTURE, label: 'Contemporary culture' },
])

/** Onboarding list — same city-agnostic set. */
export const CONTEXT_INTERESTS = GLOBAL_INTERESTS

/**
 * Optional first-run refinements. Selecting a parent does not imply equal
 * interest in every child; “less interested in” stores avoidSubInterestIds.
 */
export const SUB_INTERESTS_BY_PARENT = Object.freeze({
  [INTEREST_IDS.HISTORY]: Object.freeze([
    { id: 'archaeology', label: 'Archaeology' },
    { id: 'social-history', label: 'Social history' },
    { id: 'politics', label: 'Politics' },
    { id: 'warfare', label: 'Warfare' },
  ]),
  [INTEREST_IDS.ARCHITECTURE_DESIGN]: Object.freeze([
    { id: 'interiors', label: 'Interiors' },
    { id: 'urban-form', label: 'Urban form' },
    { id: 'engineering-detail', label: 'Engineering detail' },
  ]),
  [INTEREST_IDS.ART]: Object.freeze([
    { id: 'painting', label: 'Painting' },
    { id: 'sculpture', label: 'Sculpture' },
    { id: 'contemporary-art', label: 'Contemporary art' },
  ]),
  [INTEREST_IDS.RELIGION_BELIEF]: Object.freeze([
    { id: 'churches', label: 'Churches & temples' },
    { id: 'ritual', label: 'Ritual' },
    { id: 'mythology', label: 'Mythology' },
  ]),
  [INTEREST_IDS.POLITICS_POWER]: Object.freeze([
    { id: 'empire', label: 'Empire' },
    { id: 'republic', label: 'Republic & civic life' },
    { id: 'modern-politics', label: 'Modern politics' },
  ]),
  [INTEREST_IDS.FOOD_LOCAL_LIFE]: Object.freeze([
    { id: 'markets', label: 'Markets' },
    { id: 'restaurants', label: 'Restaurants' },
    { id: 'coffee-aperitivo', label: 'Coffee & aperitivo' },
  ]),
  [INTEREST_IDS.PEOPLE_EVERYDAY]: Object.freeze([
    { id: 'street-life', label: 'Street life' },
    { id: 'neighborhoods', label: 'Neighborhoods' },
    { id: 'work', label: 'Work & trades' },
  ]),
  [INTEREST_IDS.ENGINEERING]: Object.freeze([
    { id: 'infrastructure', label: 'Infrastructure' },
    { id: 'materials', label: 'Materials' },
    { id: 'water', label: 'Water systems' },
  ]),
  [INTEREST_IDS.CONTEMPORARY_CULTURE]: Object.freeze([
    { id: 'living-city', label: 'Living city' },
    { id: 'design-now', label: 'Design now' },
    { id: 'nightlife', label: 'Nightlife' },
  ]),
})

/**
 * Legacy Rome-flavored ids → global concepts.
 * Ranker expands both user selections and hero tags through this map.
 */
export const LEGACY_INTEREST_ALIASES = Object.freeze({
  architecture: Object.freeze([INTEREST_IDS.ARCHITECTURE_DESIGN, INTEREST_IDS.ENGINEERING]),
  'ancient-power': Object.freeze([INTEREST_IDS.HISTORY, INTEREST_IDS.POLITICS_POWER]),
  sacred: Object.freeze([INTEREST_IDS.RELIGION_BELIEF]),
  everyday: Object.freeze([INTEREST_IDS.PEOPLE_EVERYDAY]),
  hidden: Object.freeze([INTEREST_IDS.HIDDEN_PLACES]),
  art: Object.freeze([INTEREST_IDS.ART]),
})

export const EXPLORATION_STYLES = Object.freeze(['structured', 'mix', 'spontaneous'])
export const ICONIC_VS_HIDDEN = Object.freeze(['iconic', 'mix', 'hidden'])
export const DEPTH_VS_BREADTH = Object.freeze(['depth', 'mix', 'breadth'])
export const CROWD_TOLERANCE = Object.freeze(['avoid', 'neutral', 'ok'])
export const INDOOR_OUTDOOR = Object.freeze(['indoor', 'mix', 'outdoor'])
export const URBAN_COMFORT = Object.freeze(['wander-anywhere', 'off-trail', 'lively', 'visitor-areas'])
export const EVENING_COMFORT = Object.freeze(['yes', 'limited', 'daytime'])
export const WALKING_TOLERANCE = Object.freeze(['short', 'moderate', 'long'])
export const TRANSPORT_MODES = Object.freeze(['walk', 'transit', 'rideshare'])

export const TRIP_HORIZONS = Object.freeze(['local', 'today', '2-3d', '4-7d', 'week-plus', 'unsure'])
export const ANCHOR_TYPES = Object.freeze(['ticket', 'reservation', 'meal', 'must-do'])
export const RESIDENCY = Object.freeze(['local', 'visitor'])

export const AVAILABLE_TIME_NOW = Object.freeze(['30min', '1h', '2h', 'halfday', 'allday', 'exploring'])
export const TIME_OF_DAY = Object.freeze(['morning', 'afternoon', 'evening', 'night'])
export const MEAL_INTENTS = Object.freeze(['lunch', 'dinner', 'aperitivo', 'none'])
export const LOCATION_STATUSES = Object.freeze([
  'granted',
  'denied',
  'timeout',
  'unavailable',
  'skipped',
])

export const HISTORY_EVENT_TYPES = Object.freeze(['completed', 'saved', 'dismissed', 'liked'])

/** Session availability — distinct from tripHorizon. */
export const TIME_BUDGETS = Object.freeze([
  { id: '30min', minutes: 30, label: '30 min' },
  { id: '1h', minutes: 60, label: '1 hour' },
  { id: '2h', minutes: 120, label: '2 hours' },
  { id: 'halfday', minutes: 240, label: 'Half day' },
  { id: 'allday', minutes: 480, label: 'All day' },
  { id: 'exploring', minutes: 999, label: 'Just exploring' },
])

/** Old Context V0 id → current availableTimeNow. */
export const TIME_BUDGET_ALIASES = Object.freeze({
  norush: 'exploring',
})

export const INTEREST_REASON_LABEL = Object.freeze({
  'ancient-power': 'ancient Rome',
  art: 'art',
  architecture: 'architecture',
  everyday: 'everyday life',
  sacred: 'sacred Rome',
  hidden: 'hidden details',
  history: 'history',
  'architecture-design': 'architecture',
  'food-local-life': 'food & local life',
  'politics-power': 'politics & power',
  'religion-belief': 'religion & belief',
  engineering: 'engineering',
  'people-everyday': 'everyday life',
  'hidden-places': 'hidden places',
  'iconic-sights': 'iconic sights',
  'nature-landscape': 'nature',
  'contemporary-culture': 'contemporary culture',
})

const GLOBAL_ID_SET = new Set(GLOBAL_INTERESTS.map((item) => item.id))
const SUB_ID_SET = new Set(
  Object.values(SUB_INTERESTS_BY_PARENT).flatMap((list) => list.map((item) => item.id)),
)

export function isGlobalInterestId(id) {
  return GLOBAL_ID_SET.has(id)
}

export function isSubInterestId(id) {
  return SUB_ID_SET.has(id)
}

export function subInterestsForParents(parentIds) {
  return (parentIds || []).flatMap((parentId) => {
    const children = SUB_INTERESTS_BY_PARENT[parentId]
    if (!children) return []
    return children.map((child) => ({ ...child, parentId }))
  })
}

/**
 * Expand a list of interest ids (user or content) so legacy Rome tags and
 * global tags can match each other.
 * @param {string[]} ids
 * @returns {Set<string>}
 */
export function expandInterestIds(ids) {
  const out = new Set()
  for (const id of ids || []) {
    if (typeof id !== 'string' || !id) continue
    out.add(id)
    const mapped = LEGACY_INTEREST_ALIASES[id]
    if (mapped) {
      for (const canonical of mapped) out.add(canonical)
    }
  }
  for (const [alias, canonicals] of Object.entries(LEGACY_INTEREST_ALIASES)) {
    for (const canonical of canonicals) {
      if (out.has(canonical)) out.add(alias)
    }
  }
  return out
}
