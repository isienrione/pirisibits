import { CONTENT_TYPES } from '../../content/registry/constants.js'
import { ROUTE_ITEM_STATES, ROUTE_MUTATION_REASONS, ROUTE_STATUS, WALK_METERS_PER_MIN } from './constants.js'

function uid(prefix) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`
  }
  return `${prefix}_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`
}

export function walkingMinutesFromM(distanceM) {
  if (!Number.isFinite(distanceM) || distanceM <= 0) return 0
  return Math.max(1, Math.round(distanceM / WALK_METERS_PER_MIN))
}

export function durationBucket(minutes) {
  const value = Number(minutes) || 0
  if (value <= 30) return '0-30'
  if (value <= 60) return '30-60'
  if (value <= 120) return '60-120'
  return '120+'
}

export function distanceBucket(meters) {
  const value = Number(meters) || 0
  if (value <= 400) return '0-400'
  if (value <= 900) return '400-900'
  if (value <= 1500) return '900-1500'
  return '1500+'
}

export function emptyMysteryPresentation() {
  return {
    hidden: true,
    revealedEarly: false,
    revealedAtArrival: false,
  }
}

export function createRouteItem({
  contentId,
  contentType,
  position,
  estimatedExperienceMin = 8,
  estimatedTransitMin = 0,
  distanceFromPreviousM = 0,
  isMysteryDiscovery = false,
  alternatives = [],
  tripDay = null,
  scheduledDate = null,
  anchorId = null,
  legKind = null,
} = {}) {
  return {
    routeItemId: uid('ri'),
    contentId,
    contentType: contentType === CONTENT_TYPES.DISCOVERY ? CONTENT_TYPES.DISCOVERY : CONTENT_TYPES.HERO,
    position: Number(position) || 0,
    state: ROUTE_ITEM_STATES.PLANNED,
    estimatedExperienceMin: Number(estimatedExperienceMin) || 0,
    estimatedTransitMin: Number(estimatedTransitMin) || 0,
    distanceFromPreviousM: Number(distanceFromPreviousM) || 0,
    isMysteryDiscovery: Boolean(isMysteryDiscovery),
    mysteryPresentation: Boolean(isMysteryDiscovery) ? emptyMysteryPresentation() : null,
    alternatives: Array.isArray(alternatives) ? alternatives : [],
    tripDay,
    scheduledDate,
    anchorId,
    /** `traveler` = traveler→first stop; `route` = Rome item→item geometry. */
    legKind: legKind === 'traveler' || legKind === 'route' ? legKind : null,
  }
}

export function createMutation({ reason, previousItems = [], nextItems = [] } = {}) {
  return {
    id: uid('rm'),
    timestamp: new Date().toISOString(),
    reason: reason || ROUTE_MUTATION_REASONS.ADJUST,
    previousItems,
    nextItems,
  }
}

export function createProposedRoute({
  cityId = 'rome',
  contextSnapshot = null,
  title = '',
  summary = '',
  estimatedDurationMin = 0,
  estimatedWalkingMin = 0,
  estimatedWalkingDistanceM = 0,
  tags = [],
  items = [],
  rationale = [],
  tripDay = null,
  scheduledDate = null,
  anchorId = null,
  inventoryLimited = false,
  timeBudgetId = null,
  planningRemote = false,
} = {}) {
  return {
    id: uid('pr'),
    cityId,
    createdAt: new Date().toISOString(),
    contextSnapshot,
    title,
    summary,
    estimatedDurationMin,
    estimatedWalkingMin,
    estimatedWalkingDistanceM,
    tags,
    items,
    rationale,
    tripDay,
    scheduledDate,
    anchorId,
    inventoryLimited: Boolean(inventoryLimited),
    timeBudgetId: timeBudgetId || null,
    planningRemote: Boolean(planningRemote),
  }
}

export function createActiveRoute({ proposedRouteId, contextSnapshot = null, items = [] } = {}) {
  const now = new Date().toISOString()
  const cloned = items.map((item, index) => ({
    ...item,
    position: index,
    state: index === 0 ? ROUTE_ITEM_STATES.ACTIVE : ROUTE_ITEM_STATES.PLANNED,
  }))
  return {
    proposedRouteId,
    status: ROUTE_STATUS.ACTIVE,
    startedAt: now,
    updatedAt: now,
    pausedAt: null,
    currentRouteItemId: cloned[0]?.routeItemId || null,
    items: cloned,
    mutations: [
      createMutation({
        reason: ROUTE_MUTATION_REASONS.STARTED,
        previousItems: [],
        nextItems: cloned.map((item) => item.contentId),
      }),
    ],
    originalContextSnapshot: contextSnapshot,
    tripDay: null,
    scheduledDate: null,
    anchorId: null,
  }
}

export function liveItems(route) {
  return (route?.items || []).filter((item) => item.state !== ROUTE_ITEM_STATES.REMOVED)
}

export function remainingItems(route) {
  return liveItems(route).filter(
    (item) => item.state === ROUTE_ITEM_STATES.PLANNED || item.state === ROUTE_ITEM_STATES.ACTIVE,
  )
}

export function currentRouteItem(route) {
  if (!route) return null
  return liveItems(route).find((item) => item.routeItemId === route.currentRouteItemId) || remainingItems(route)[0] || null
}

export function isMysteryHidden(item) {
  if (!item?.isMysteryDiscovery) return false
  const mystery = item.mysteryPresentation
  if (!mystery) return true
  return mystery.hidden && !mystery.revealedEarly && !mystery.revealedAtArrival
}

export function estimateRouteTotals(items = []) {
  const live = items.filter((item) => item.state !== ROUTE_ITEM_STATES.REMOVED)
  const remaining = live.filter((item) => item.state !== ROUTE_ITEM_STATES.COMPLETED && item.state !== ROUTE_ITEM_STATES.SKIPPED)
  const estimatedWalkingDistanceM = remaining.reduce((sum, item) => sum + (Number(item.distanceFromPreviousM) || 0), 0)
  const estimatedWalkingMin = remaining.reduce((sum, item) => sum + (Number(item.estimatedTransitMin) || 0), 0)
  const estimatedExperienceMin = remaining.reduce((sum, item) => sum + (Number(item.estimatedExperienceMin) || 0), 0)
  return {
    estimatedWalkingDistanceM,
    estimatedWalkingMin,
    estimatedDurationMin: estimatedWalkingMin + estimatedExperienceMin,
    completedCount: live.filter((item) => item.state === ROUTE_ITEM_STATES.COMPLETED).length,
    totalCount: live.length,
  }
}

export function snapshotIds(items = []) {
  return items.map((item) => item.contentId)
}

export function isRouteLive(route) {
  return Boolean(route && (route.status === ROUTE_STATUS.ACTIVE || route.status === ROUTE_STATUS.PAUSED))
}
