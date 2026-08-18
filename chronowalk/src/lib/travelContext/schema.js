/**
 * Travel Context Profile — reusable for Rome now and future cities (Santiago).
 *
 * Four persisted layers:
 *   traveler  — stable preferences
 *   trip      — this visit / residency / dates / scheduled anchors
 *   session   — now: location, availableTimeNow, meal/end intent
 *   history   — completed / saved / dismissed / liked (signals only, no ML)
 *
 * availableTimeNow and tripHorizon are DIFFERENT fields.
 * This is not an itinerary engine.
 */

import {
  ANCHOR_TYPES,
  AVAILABLE_TIME_NOW,
  CROWD_TOLERANCE,
  DEPTH_VS_BREADTH,
  EVENING_COMFORT,
  EXPLORATION_STYLES,
  HISTORY_EVENT_TYPES,
  ICONIC_VS_HIDDEN,
  INDOOR_OUTDOOR,
  LOCATION_STATUSES,
  MEAL_INTENTS,
  TIME_BUDGET_ALIASES,
  TIME_OF_DAY,
  TRANSPORT_MODES,
  TRIP_HORIZONS,
  URBAN_COMFORT,
  WALKING_TOLERANCE,
} from './taxonomy.js'

export const TRAVEL_CONTEXT_VERSION = 2
export const MAX_POSITIVE_INTERESTS = 4
export const MAX_HISTORY_EVENTS = 200

/** @typedef {'structured'|'mix'|'spontaneous'|null} ExplorationStyle */
/** @typedef {'iconic'|'mix'|'hidden'|null} IconicVsHidden */
/** @typedef {'depth'|'mix'|'breadth'|null} DepthVsBreadth */
/** @typedef {'avoid'|'neutral'|'ok'|null} CrowdTolerance */
/** @typedef {'indoor'|'mix'|'outdoor'|null} IndoorOutdoor */
/** @typedef {'wander-anywhere'|'off-trail'|'lively'|'visitor-areas'|null} UrbanComfort */
/** @typedef {'yes'|'limited'|'daytime'|null} EveningComfort */
/** @typedef {'short'|'moderate'|'long'|null} WalkingTolerance */
/** @typedef {'walk'|'transit'|'rideshare'} TransportMode */
/** @typedef {'local'|'today'|'2-3d'|'4-7d'|'week-plus'|'unsure'|null} TripHorizon */
/** @typedef {'ticket'|'reservation'|'meal'|'must-do'} TripAnchorType */
/** @typedef {'30min'|'1h'|'2h'|'halfday'|'allday'|'exploring'|null} AvailableTimeNow */
/** @typedef {'morning'|'afternoon'|'evening'|'night'|null} TimeOfDay */
/** @typedef {'lunch'|'dinner'|'aperitivo'|'none'|null} MealIntent */
/** @typedef {'granted'|'denied'|'timeout'|'unavailable'|null} LocationStatus */
/** @typedef {'completed'|'saved'|'dismissed'|'liked'} HistoryEventType */

/**
 * @typedef {{
 *   positiveInterestIds: string[],
 *   surpriseMe: boolean,
 *   avoidInterestIds: string[],
 *   avoidSubInterestIds: string[],
 *   explorationStyle: ExplorationStyle,
 *   iconicVsHidden: IconicVsHidden,
 *   depthVsBreadth: DepthVsBreadth,
 *   crowdTolerance: CrowdTolerance,
 *   indoorOutdoor: IndoorOutdoor,
 *   urbanComfort: UrbanComfort,
 *   eveningComfort: EveningComfort,
 *   walkingTolerance: WalkingTolerance,
 *   transportModes: TransportMode[],
 * }} TravelerProfile
 */

/**
 * @typedef {{
 *   id: string,
 *   type: TripAnchorType,
 *   title: string,
 *   placeId?: string|null,
 *   startsAt?: string|null,
 *   endsAt?: string|null,
 *   notes?: string|null,
 * }} TripAnchor
 */

/**
 * @typedef {{
 *   cityId: string|null,
 *   residency: 'local'|'visitor'|null,
 *   tripHorizon: TripHorizon,
 *   dates: { start: string, end: string }|null,
 *   accommodationArea: string|null,
 *   anchors: TripAnchor[],
 * }} TripContext
 */

/**
 * @typedef {{
 *   location: { lat: number, lng: number, accuracy: number|null, timestamp: number }|null,
 *   locationStatus: LocationStatus,
 *   availableTimeNow: AvailableTimeNow,
 *   timeOfDay: TimeOfDay,
 *   desiredEndTime: string|null,
 *   desiredEndArea: string|null,
 *   mealIntent: MealIntent,
 *   transportPreferenceNow: TransportMode[]|null,
 * }} SessionContext
 */

/**
 * @typedef {{
 *   type: HistoryEventType,
 *   experienceId: string,
 *   at: string,
 * }} HistoryEvent
 */

/**
 * @typedef {{
 *   completedExperienceIds: string[],
 *   savedExperienceIds: string[],
 *   dismissedExperienceIds: string[],
 *   likedExperienceIds: string[],
 *   events: HistoryEvent[],
 * }} BehavioralHistory
 */

/**
 * @typedef {{
 *   version: number,
 *   traveler: TravelerProfile,
 *   trip: TripContext,
 *   session: SessionContext,
 *   history: BehavioralHistory,
 *   interestIds: string[],
 *   surpriseMe: boolean,
 *   timeBudgetId: string|null,
 *   locationStatus: LocationStatus,
 *   lastPosition: SessionContext['location'],
 *   completedAt: string|null,
 * }} TravelContext
 */

function inSet(value, allowed) {
  return allowed.includes(value) ? value : null
}

export function uniqueStrings(values, max = Infinity) {
  const out = []
  const seen = new Set()
  for (const value of values || []) {
    if (typeof value !== 'string' || !value || seen.has(value)) continue
    seen.add(value)
    out.push(value)
    if (out.length >= max) break
  }
  return out
}

export function normalizePosition(value) {
  if (!value || typeof value !== 'object') return null
  const lat = Number(value.lat)
  const lng = Number(value.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return {
    lat,
    lng,
    accuracy: Number.isFinite(Number(value.accuracy)) ? Number(value.accuracy) : null,
    timestamp: Number(value.timestamp) || Date.now(),
  }
}

export function inferTimeOfDay(date = new Date()) {
  const hour = date.getHours()
  if (hour < 5) return 'night'
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  if (hour < 21) return 'evening'
  return 'night'
}

export function normalizeAvailableTimeNow(value) {
  if (typeof value !== 'string' || !value) return null
  const aliased = TIME_BUDGET_ALIASES[value] || value
  return inSet(aliased, AVAILABLE_TIME_NOW)
}

export function emptyTraveler() {
  return {
    positiveInterestIds: [],
    surpriseMe: false,
    avoidInterestIds: [],
    avoidSubInterestIds: [],
    explorationStyle: null,
    iconicVsHidden: null,
    depthVsBreadth: null,
    crowdTolerance: null,
    indoorOutdoor: null,
    urbanComfort: null,
    eveningComfort: null,
    walkingTolerance: null,
    transportModes: [],
  }
}

export function emptyTrip() {
  return {
    cityId: null,
    residency: null,
    tripHorizon: null,
    dates: null,
    accommodationArea: null,
    anchors: [],
  }
}

export function emptySession() {
  return {
    location: null,
    locationStatus: null,
    availableTimeNow: null,
    timeOfDay: null,
    desiredEndTime: null,
    desiredEndArea: null,
    mealIntent: null,
    transportPreferenceNow: null,
  }
}

export function emptyHistory() {
  return {
    completedExperienceIds: [],
    savedExperienceIds: [],
    dismissedExperienceIds: [],
    likedExperienceIds: [],
    events: [],
  }
}

export function emptyTravelContext() {
  return withLegacyMirrors({
    version: TRAVEL_CONTEXT_VERSION,
    traveler: emptyTraveler(),
    trip: emptyTrip(),
    session: emptySession(),
    history: emptyHistory(),
    completedAt: null,
  })
}

export function normalizeAnchor(raw) {
  if (!raw || typeof raw !== 'object') return null
  const type = inSet(raw.type, ANCHOR_TYPES)
  const title = typeof raw.title === 'string' ? raw.title.trim() : ''
  if (!type || !title) return null
  const id =
    typeof raw.id === 'string' && raw.id.length > 0 ? raw.id : `anchor_${Date.now().toString(36)}`
  return {
    id,
    type,
    title: title.slice(0, 160),
    placeId: typeof raw.placeId === 'string' && raw.placeId ? raw.placeId : null,
    startsAt: typeof raw.startsAt === 'string' && raw.startsAt ? raw.startsAt : null,
    endsAt: typeof raw.endsAt === 'string' && raw.endsAt ? raw.endsAt : null,
    notes: typeof raw.notes === 'string' && raw.notes ? raw.notes.slice(0, 280) : null,
  }
}

export function normalizeTraveler(raw) {
  const source = raw && typeof raw === 'object' ? raw : {}
  const transportModes = uniqueStrings(source.transportModes).filter((id) =>
    TRANSPORT_MODES.includes(id),
  )
  return {
    positiveInterestIds: uniqueStrings(source.positiveInterestIds, MAX_POSITIVE_INTERESTS),
    surpriseMe: source.surpriseMe === true,
    avoidInterestIds: uniqueStrings(source.avoidInterestIds, 12),
    avoidSubInterestIds: uniqueStrings(source.avoidSubInterestIds, 24),
    explorationStyle: inSet(source.explorationStyle, EXPLORATION_STYLES),
    iconicVsHidden: inSet(source.iconicVsHidden, ICONIC_VS_HIDDEN),
    depthVsBreadth: inSet(source.depthVsBreadth, DEPTH_VS_BREADTH),
    crowdTolerance: inSet(source.crowdTolerance, CROWD_TOLERANCE),
    indoorOutdoor: inSet(source.indoorOutdoor, INDOOR_OUTDOOR),
    urbanComfort: inSet(source.urbanComfort, URBAN_COMFORT),
    eveningComfort: inSet(source.eveningComfort, EVENING_COMFORT),
    walkingTolerance: inSet(source.walkingTolerance, WALKING_TOLERANCE),
    transportModes,
  }
}

export function inferResidency(tripHorizon, explicit) {
  if (explicit === 'local' || explicit === 'visitor') return explicit
  if (tripHorizon === 'local') return 'local'
  if (tripHorizon && tripHorizon !== 'unsure') return 'visitor'
  return null
}

export function normalizeTrip(raw) {
  const source = raw && typeof raw === 'object' ? raw : {}
  const tripHorizon = inSet(source.tripHorizon, TRIP_HORIZONS)
  const dates =
    source.dates &&
    typeof source.dates === 'object' &&
    typeof source.dates.start === 'string' &&
    typeof source.dates.end === 'string'
      ? { start: source.dates.start, end: source.dates.end }
      : null
  return {
    cityId: typeof source.cityId === 'string' && source.cityId ? source.cityId : null,
    residency: inferResidency(tripHorizon, source.residency),
    tripHorizon,
    dates,
    accommodationArea:
      typeof source.accommodationArea === 'string' && source.accommodationArea
        ? source.accommodationArea.slice(0, 80)
        : null,
    anchors: Array.isArray(source.anchors)
      ? source.anchors.map(normalizeAnchor).filter(Boolean).slice(0, 20)
      : [],
  }
}

export function normalizeSession(raw) {
  const source = raw && typeof raw === 'object' ? raw : {}
  const transportPreferenceNow = Array.isArray(source.transportPreferenceNow)
    ? uniqueStrings(source.transportPreferenceNow).filter((id) => TRANSPORT_MODES.includes(id))
    : null
  return {
    location: normalizePosition(source.location),
    locationStatus: inSet(source.locationStatus, LOCATION_STATUSES),
    availableTimeNow: normalizeAvailableTimeNow(source.availableTimeNow),
    timeOfDay: inSet(source.timeOfDay, TIME_OF_DAY),
    desiredEndTime: typeof source.desiredEndTime === 'string' ? source.desiredEndTime : null,
    desiredEndArea: typeof source.desiredEndArea === 'string' ? source.desiredEndArea : null,
    mealIntent: inSet(source.mealIntent, MEAL_INTENTS),
    transportPreferenceNow: transportPreferenceNow && transportPreferenceNow.length > 0 ? transportPreferenceNow : null,
  }
}

export function normalizeHistory(raw) {
  const source = raw && typeof raw === 'object' ? raw : {}
  const events = Array.isArray(source.events)
    ? source.events
        .filter(
          (event) =>
            event &&
            HISTORY_EVENT_TYPES.includes(event.type) &&
            typeof event.experienceId === 'string' &&
            event.experienceId &&
            typeof event.at === 'string',
        )
        .slice(-MAX_HISTORY_EVENTS)
    : []
  return {
    completedExperienceIds: uniqueStrings(source.completedExperienceIds, 200),
    savedExperienceIds: uniqueStrings(source.savedExperienceIds, 200),
    dismissedExperienceIds: uniqueStrings(source.dismissedExperienceIds, 200),
    likedExperienceIds: uniqueStrings(source.likedExperienceIds, 200),
    events,
  }
}

/**
 * Flat V0 fields remain on the blob so Discover and existing tests keep working.
 */
export function withLegacyMirrors(context) {
  const traveler = context.traveler || emptyTraveler()
  const session = context.session || emptySession()
  return {
    ...context,
    version: TRAVEL_CONTEXT_VERSION,
    interestIds: traveler.positiveInterestIds,
    surpriseMe: traveler.surpriseMe === true,
    timeBudgetId: session.availableTimeNow,
    locationStatus: session.locationStatus,
    lastPosition: session.location,
  }
}

export function isNestedContext(value) {
  return Boolean(value && typeof value === 'object' && value.traveler && typeof value.traveler === 'object')
}

/**
 * Upgrade a v1 `{ interestIds, timeBudgetId, ... }` blob to nested v2.
 */
export function migrateLegacyContext(raw) {
  const source = raw && typeof raw === 'object' ? raw : {}
  return withLegacyMirrors({
    version: TRAVEL_CONTEXT_VERSION,
    traveler: normalizeTraveler({
      positiveInterestIds: source.interestIds,
      surpriseMe: source.surpriseMe,
    }),
    trip: emptyTrip(),
    session: normalizeSession({
      location: source.lastPosition,
      locationStatus: source.locationStatus,
      availableTimeNow: source.timeBudgetId,
      timeOfDay: inferTimeOfDay(),
    }),
    history: emptyHistory(),
    completedAt: typeof source.completedAt === 'string' ? source.completedAt : null,
  })
}

export function normalizeTravelContext(raw) {
  if (!raw || typeof raw !== 'object') return emptyTravelContext()
  if (!isNestedContext(raw)) return migrateLegacyContext(raw)

  const traveler = normalizeTraveler(raw.traveler)
  const trip = normalizeTrip(raw.trip)
  const session = normalizeSession({
    ...raw.session,
    location: raw.session?.location ?? raw.lastPosition,
    locationStatus: raw.session?.locationStatus ?? raw.locationStatus,
    availableTimeNow: raw.session?.availableTimeNow ?? raw.timeBudgetId,
  })
  if (Array.isArray(raw.interestIds) && traveler.positiveInterestIds.length === 0) {
    traveler.positiveInterestIds = uniqueStrings(raw.interestIds, MAX_POSITIVE_INTERESTS)
  }
  if (raw.surpriseMe === true) traveler.surpriseMe = true
  if (!session.availableTimeNow && raw.timeBudgetId) {
    session.availableTimeNow = normalizeAvailableTimeNow(raw.timeBudgetId)
  }

  return withLegacyMirrors({
    version: TRAVEL_CONTEXT_VERSION,
    traveler,
    trip,
    session,
    history: normalizeHistory(raw.history),
    completedAt: typeof raw.completedAt === 'string' ? raw.completedAt : null,
  })
}

function mergeDefined(base, patch) {
  if (!patch || typeof patch !== 'object') return base
  const next = { ...base }
  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined) next[key] = value
  }
  return next
}

/**
 * Merge a completeNativeContext payload (nested and/or flat) onto current context.
 */
export function applyContextPatch(current, patch = {}) {
  const base = normalizeTravelContext(current)
  const hasTraveler = patch.traveler && typeof patch.traveler === 'object'
  const hasTrip = patch.trip && typeof patch.trip === 'object'
  const hasSession = patch.session && typeof patch.session === 'object'
  const hasHistory = patch.history && typeof patch.history === 'object'

  const travelerPatch = hasTraveler
    ? patch.traveler
    : {
        positiveInterestIds: Array.isArray(patch.interestIds) ? patch.interestIds : undefined,
        surpriseMe: patch.surpriseMe,
      }

  const sessionPatch = mergeDefined(hasSession ? patch.session : {}, {
    location: patch.lastPosition,
    locationStatus: patch.locationStatus,
    availableTimeNow: patch.timeBudgetId,
  })

  const next = normalizeTravelContext({
    ...base,
    traveler: mergeDefined(base.traveler, travelerPatch),
    trip: mergeDefined(base.trip, hasTrip ? patch.trip : undefined),
    session: mergeDefined(base.session, sessionPatch),
    history: mergeDefined(base.history, hasHistory ? patch.history : undefined),
    completedAt:
      typeof patch.completedAt === 'string' ? patch.completedAt : new Date().toISOString(),
  })
  return next
}

const HISTORY_LIST_KEY = {
  completed: 'completedExperienceIds',
  saved: 'savedExperienceIds',
  dismissed: 'dismissedExperienceIds',
  liked: 'likedExperienceIds',
}

export function appendHistoryEvent(history, type, experienceId, at = new Date().toISOString()) {
  if (!HISTORY_EVENT_TYPES.includes(type) || typeof experienceId !== 'string' || !experienceId) {
    return normalizeHistory(history)
  }
  const current = normalizeHistory(history)
  const listKey = HISTORY_LIST_KEY[type]
  if (current[listKey].includes(experienceId)) return current
  const ids = uniqueStrings([...current[listKey], experienceId], 200)
  const events = [...current.events, { type, experienceId, at }].slice(-MAX_HISTORY_EVENTS)
  return { ...current, [listKey]: ids, events }
}
