import {
  ROUTE_CHANGED_EVENT,
  ROUTE_ITEM_STATES,
  ROUTE_MUTATION_REASONS,
  ROUTE_STATUS,
  ROUTE_STORAGE_KEY,
  ROUTE_STORAGE_VERSION,
} from './constants.js'
import { getRegistryItem } from '../../content/rome/registry.js'
import {
  createActiveRoute,
  createMutation,
  createRouteItem,
  currentRouteItem,
  estimateRouteTotals,
  isRouteLive,
  liveItems,
  remainingItems,
  snapshotIds,
  walkingMinutesFromM,
} from './model.js'
import { getDistance } from '../../utils/distance.js'
import { trackRoute, ROUTE_TRACK_EVENTS } from './analytics.js'

export { isRouteLive }

function emit() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(ROUTE_CHANGED_EVENT))
}

function emptyState() {
  return {
    version: ROUTE_STORAGE_VERSION,
    proposed: null,
    active: null,
  }
}

export function readRouteState() {
  if (typeof window === 'undefined') return emptyState()
  try {
    const raw = window.localStorage.getItem(ROUTE_STORAGE_KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return emptyState()
    return {
      version: ROUTE_STORAGE_VERSION,
      proposed: parsed.proposed || null,
      active: parsed.active || null,
    }
  } catch {
    return emptyState()
  }
}

function writeState(next) {
  if (typeof window === 'undefined') return next
  try {
    window.localStorage.setItem(ROUTE_STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* quota */
  }
  emit()
  return next
}

export function clearRouteState() {
  if (typeof window === 'undefined') return emptyState()
  try {
    window.localStorage.removeItem(ROUTE_STORAGE_KEY)
  } catch {
    /* ignore */
  }
  emit()
  return emptyState()
}

export function getProposedRoute() {
  return readRouteState().proposed
}

export function getActiveRoute() {
  const active = readRouteState().active
  if (!active) return null
  if (active.status === ROUTE_STATUS.ENDED || active.status === ROUTE_STATUS.COMPLETED) return active
  return active
}


export function saveProposedRoute(proposed) {
  const current = readRouteState()
  writeState({ ...current, proposed })
  if (proposed) {
    trackRoute(ROUTE_TRACK_EVENTS.ROUTE_PROPOSED, {
      cityId: proposed.cityId,
      routeId: proposed.id,
      durationMin: proposed.estimatedDurationMin,
      distanceM: proposed.estimatedWalkingDistanceM,
    })
  }
  return proposed
}

function touch(active, extra = {}) {
  return { ...active, ...extra, updatedAt: new Date().toISOString() }
}

export function startRoute(proposed = getProposedRoute()) {
  if (!proposed?.items?.length) return null
  const active = createActiveRoute({
    proposedRouteId: proposed.id,
    contextSnapshot: proposed.contextSnapshot,
    items: proposed.items,
  })
  writeState({ proposed, active })
  trackRoute(ROUTE_TRACK_EVENTS.ROUTE_STARTED, {
    cityId: proposed.cityId,
    routeId: proposed.id,
    durationMin: proposed.estimatedDurationMin,
    distanceM: proposed.estimatedWalkingDistanceM,
  })
  const current = currentRouteItem(active)
  if (current) {
    trackRoute(ROUTE_TRACK_EVENTS.ROUTE_ITEM_STARTED, {
      cityId: 'rome',
      routeId: proposed.id,
      contentId: current.contentId,
      contentType: current.contentType,
      position: current.position,
    })
  }
  return active
}

function commitActive(active, reason, previous, extraProps = {}) {
  const next = touch(active, {
    mutations: [
      ...(active.mutations || []),
      createMutation({ reason, previousItems: previous, nextItems: snapshotIds(liveItems(active)) }),
    ],
  })
  const current = readRouteState()
  writeState({ ...current, active: next })
  trackRoute(ROUTE_TRACK_EVENTS.ROUTE_ADJUSTED, {
    cityId: 'rome',
    routeId: next.proposedRouteId,
    reason,
    ...extraProps,
  })
  return next
}

function geoFor(item) {
  if (item?.geo?.lat) return item.geo
  return getRegistryItem(item?.contentId)?.geo || null
}

function resolveContent(content) {
  if (!content) return null
  if (typeof content === 'string') return getRegistryItem(content)
  return getRegistryItem(content.id) || content
}

function relinkDistances(items, origin = null) {
  return items.map((item, index) => {
    const prev = index === 0 ? origin : items[index - 1]
    const from = prev?.lat ? prev : geoFor(prev)
    const to = geoFor(item)
    let dist = Number(item.distanceFromPreviousM) || 0
    if (from?.lat && to?.lat) {
      dist = getDistance(from.lat, from.lng, to.lat, to.lng)
    }
    return {
      ...item,
      position: index,
      distanceFromPreviousM: dist,
      estimatedTransitMin: walkingMinutesFromM(dist),
    }
  })
}

function totalsFor(items) {
  const walkingM = items.reduce((sum, item) => sum + (Number(item.distanceFromPreviousM) || 0), 0)
  const walkingMin = items.reduce((sum, item) => sum + (Number(item.estimatedTransitMin) || 0), 0)
  const experienceMin = items.reduce((sum, item) => sum + (Number(item.estimatedExperienceMin) || 0), 0)
  return {
    estimatedWalkingDistanceM: walkingM,
    estimatedWalkingMin: walkingMin,
    estimatedDurationMin: walkingMin + experienceMin,
  }
}

export function completeCurrentItem() {
  const state = readRouteState()
  const active = state.active
  if (!isRouteLive(active)) return null
  const previous = snapshotIds(liveItems(active))
  const current = currentRouteItem(active)
  if (!current) return active
  const items = active.items.map((item) =>
    item.routeItemId === current.routeItemId ? { ...item, state: ROUTE_ITEM_STATES.COMPLETED } : item,
  )
  const nextLive = items.filter((item) => item.state === ROUTE_ITEM_STATES.PLANNED)
  const nextCurrent = nextLive[0] || null
  const done = !nextCurrent
  let next = touch(active, {
    items,
    currentRouteItemId: nextCurrent?.routeItemId || null,
    status: done ? ROUTE_STATUS.COMPLETED : active.status,
    mutations: [
      ...(active.mutations || []),
      createMutation({ reason: ROUTE_MUTATION_REASONS.ITEM_COMPLETED, previousItems: previous, nextItems: snapshotIds(items) }),
    ],
  })
  writeState({ ...state, active: next })
  trackRoute(ROUTE_TRACK_EVENTS.ROUTE_ITEM_COMPLETED, {
    cityId: 'rome',
    routeId: next.proposedRouteId,
    contentId: current.contentId,
    contentType: current.contentType,
    position: current.position,
  })
  if (done) {
    trackRoute(ROUTE_TRACK_EVENTS.ROUTE_COMPLETED, { cityId: 'rome', routeId: next.proposedRouteId })
  } else {
    trackRoute(ROUTE_TRACK_EVENTS.ROUTE_ITEM_STARTED, {
      cityId: 'rome',
      routeId: next.proposedRouteId,
      contentId: nextCurrent.contentId,
      contentType: nextCurrent.contentType,
      position: nextCurrent.position,
    })
  }
  return next
}

export function skipCurrentItem() {
  const state = readRouteState()
  const active = state.active
  if (!isRouteLive(active)) return null
  const current = currentRouteItem(active)
  if (!current) return active
  const items = active.items.map((item) =>
    item.routeItemId === current.routeItemId ? { ...item, state: ROUTE_ITEM_STATES.SKIPPED } : item,
  )
  const nextCurrent = items.find((item) => item.state === ROUTE_ITEM_STATES.PLANNED) || null
  const next = commitActive(
    { ...active, items, currentRouteItemId: nextCurrent?.routeItemId || null },
    ROUTE_MUTATION_REASONS.USER_REMOVE,
    snapshotIds(liveItems(active)),
  )
  trackRoute(ROUTE_TRACK_EVENTS.ROUTE_ITEM_SKIPPED, {
    cityId: 'rome',
    routeId: next.proposedRouteId,
    contentId: current.contentId,
    contentType: current.contentType,
    position: current.position,
  })
  return next
}

export function replaceCurrentWith(content, { reason = ROUTE_MUTATION_REASONS.USER_ALTERNATIVE } = {}) {
  const state = readRouteState()
  const active = state.active
  if (!isRouteLive(active) || !content) return null
  const previous = snapshotIds(liveItems(active))
  const current = currentRouteItem(active)
  const resolved = resolveContent(content)
  if (!resolved) return null
  const replacement = createRouteItem({
    contentId: resolved.id,
    contentType: resolved.contentType,
    position: current?.position || 0,
    estimatedExperienceMin: Number(resolved.timeCostMin) || 8,
    isMysteryDiscovery: Boolean(resolved.forceMystery || resolved.mysteryEligible),
  })
  replacement.state = ROUTE_ITEM_STATES.ACTIVE
  const items = []
  for (const item of active.items) {
    if (current && item.routeItemId === current.routeItemId) {
      items.push(replacement)
      continue
    }
    if (item.contentId === resolved.id && item.routeItemId !== current?.routeItemId) continue
    items.push(item)
  }
  const next = {
    ...active,
    items: items.map((item, index) => ({ ...item, position: index })),
    currentRouteItemId: replacement.routeItemId,
  }
  const committed = commitActive(next, reason, previous)
  trackRoute(ROUTE_TRACK_EVENTS.ROUTE_ALTERNATIVE_SELECTED, {
    cityId: 'rome',
    routeId: committed.proposedRouteId,
    contentId: resolved.id,
    contentType: resolved.contentType,
    reason,
  })
  return committed
}

export function reorderActiveItems(orderedRouteItemIds) {
  const state = readRouteState()
  const active = state.active
  if (!isRouteLive(active)) return null
  const previous = snapshotIds(liveItems(active))
  const byId = Object.fromEntries(active.items.map((item) => [item.routeItemId, item]))
  const reordered = orderedRouteItemIds.map((id) => byId[id]).filter(Boolean)
  const leftover = active.items.filter((item) => !orderedRouteItemIds.includes(item.routeItemId))
  const items = [...reordered, ...leftover].map((item, index) => ({ ...item, position: index }))
  const current = items.find((item) => item.state === ROUTE_ITEM_STATES.ACTIVE) || items.find((item) => item.state === ROUTE_ITEM_STATES.PLANNED)
  return commitActive({ ...active, items, currentRouteItemId: current?.routeItemId || active.currentRouteItemId }, ROUTE_MUTATION_REASONS.USER_REORDER, previous)
}

export function removeRouteItem(routeItemId) {
  const state = readRouteState()
  const active = state.active
  if (!isRouteLive(active)) return null
  const previous = snapshotIds(liveItems(active))
  const items = active.items.map((item) =>
    item.routeItemId === routeItemId ? { ...item, state: ROUTE_ITEM_STATES.REMOVED } : item,
  )
  const current = items.find((item) => item.routeItemId === active.currentRouteItemId && item.state !== ROUTE_ITEM_STATES.REMOVED)
    || items.find((item) => item.state === ROUTE_ITEM_STATES.PLANNED || item.state === ROUTE_ITEM_STATES.ACTIVE)
  return commitActive({ ...active, items, currentRouteItemId: current?.routeItemId || null }, ROUTE_MUTATION_REASONS.USER_REMOVE, previous)
}

export function addContentToRoute(content, { mystery = false } = {}) {
  const state = readRouteState()
  const active = state.active
  const resolved = resolveContent(content)
  if (!isRouteLive(active) || !resolved) return null
  if (liveItems(active).some((item) => item.contentId === resolved.id)) return active
  const previous = snapshotIds(liveItems(active))
  const item = createRouteItem({
    contentId: resolved.id,
    contentType: resolved.contentType,
    position: liveItems(active).length,
    estimatedExperienceMin: Number(resolved.timeCostMin) || 8,
    isMysteryDiscovery: mystery || Boolean(resolved.mysteryEligible),
  })
  return commitActive({ ...active, items: [...active.items, item] }, ROUTE_MUTATION_REASONS.USER_ADD, previous)
}

export function pauseRoute() {
  const state = readRouteState()
  const active = state.active
  if (!active || active.status !== ROUTE_STATUS.ACTIVE) return active
  const next = touch(active, { status: ROUTE_STATUS.PAUSED, pausedAt: new Date().toISOString() })
  writeState({ ...state, active: next })
  trackRoute(ROUTE_TRACK_EVENTS.ROUTE_PAUSED, { cityId: 'rome', routeId: next.proposedRouteId, reason: ROUTE_MUTATION_REASONS.PAUSE_RESUME })
  return next
}

export function resumeRoute({ position = null } = {}) {
  const state = readRouteState()
  const active = state.active
  if (!active || active.status !== ROUTE_STATUS.PAUSED) return active
  let items = active.items
  if (position?.lat) {
    const remaining = remainingItems(active)
    const relinked = relinkDistances(remaining, position)
    const byId = Object.fromEntries(relinked.map((item) => [item.routeItemId, item]))
    items = active.items.map((item) => byId[item.routeItemId] || item)
  }
  const next = touch(active, { status: ROUTE_STATUS.ACTIVE, pausedAt: null, items })
  writeState({ ...state, active: next })
  trackRoute(ROUTE_TRACK_EVENTS.ROUTE_RESUMED, { cityId: 'rome', routeId: next.proposedRouteId, reason: ROUTE_MUTATION_REASONS.PAUSE_RESUME })
  return next
}

export function endRoute() {
  const state = readRouteState()
  const active = state.active
  if (!active) return null
  const next = touch(active, { status: ROUTE_STATUS.ENDED, currentRouteItemId: null })
  writeState({ ...state, active: next })
  trackRoute(ROUTE_TRACK_EVENTS.ROUTE_ENDED, { cityId: 'rome', routeId: next.proposedRouteId, reason: ROUTE_MUTATION_REASONS.ENDED })
  return next
}

export function revealMystery(routeItemId, { early = false, arrival = false } = {}) {
  const state = readRouteState()
  const active = state.active
  if (!active) return null
  const items = active.items.map((item) => {
    if (item.routeItemId !== routeItemId) return item
    return {
      ...item,
      mysteryPresentation: {
        hidden: false,
        revealedEarly: early || Boolean(item.mysteryPresentation?.revealedEarly),
        revealedAtArrival: arrival || Boolean(item.mysteryPresentation?.revealedAtArrival),
      },
    }
  })
  const next = touch(active, { items })
  writeState({ ...state, active: next })
  if (early) {
    trackRoute(ROUTE_TRACK_EVENTS.MYSTERY_DISCOVERY_REVEALED_EARLY, {
      cityId: 'rome',
      routeId: next.proposedRouteId,
      contentId: items.find((item) => item.routeItemId === routeItemId)?.contentId,
      contentType: 'discovery',
    })
  }
  return next
}

export function acceptMystery(routeItemId) {
  const state = readRouteState()
  const item = state.active?.items.find((row) => row.routeItemId === routeItemId)
  if (item) {
    trackRoute(ROUTE_TRACK_EVENTS.MYSTERY_DISCOVERY_ACCEPTED, {
      cityId: 'rome',
      routeId: state.active.proposedRouteId,
      contentId: item.contentId,
      contentType: 'discovery',
      position: item.position,
    })
  }
  return state.active
}

export function replaceProposedItems(proposed) {
  return saveProposedRoute(proposed)
}

export function reorderRouteItems(orderedRouteItemIds) {
  if (isRouteLive(getActiveRoute())) return reorderActiveItems(orderedRouteItemIds)
  const proposed = getProposedRoute()
  if (!proposed) return null
  const byId = Object.fromEntries(proposed.items.map((item) => [item.routeItemId, item]))
  const items = relinkDistances(orderedRouteItemIds.map((id) => byId[id]).filter(Boolean))
  return saveProposedRoute({ ...proposed, items, ...totalsFor(items) })
}

export function removeAnyRouteItem(routeItemId) {
  if (isRouteLive(getActiveRoute())) return removeRouteItem(routeItemId)
  const proposed = getProposedRoute()
  if (!proposed) return null
  const items = relinkDistances(proposed.items.filter((item) => item.routeItemId !== routeItemId))
  return saveProposedRoute({ ...proposed, items, ...totalsFor(items) })
}

export function addContentAnywhere(content) {
  if (isRouteLive(getActiveRoute())) return addContentToRoute(content)
  const proposed = getProposedRoute()
  const resolved = resolveContent(content)
  if (!proposed || !resolved) return null
  if (proposed.items.some((item) => item.contentId === resolved.id)) return proposed
  const item = createRouteItem({
    contentId: resolved.id,
    contentType: resolved.contentType,
    position: proposed.items.length,
    estimatedExperienceMin: Number(resolved.timeCostMin) || 8,
    isMysteryDiscovery: false,
  })
  const items = relinkDistances([...proposed.items, item]).slice(0, 5)
  return saveProposedRoute({ ...proposed, items, ...totalsFor(items) })
}

export function recomposeActiveFromProposed(proposed = getProposedRoute()) {
  const state = readRouteState()
  const active = state.active
  if (!proposed?.items?.length) return active
  if (!isRouteLive(active)) return startRoute(proposed)
  const kept = liveItems(active).filter(
    (item) => item.state === ROUTE_ITEM_STATES.COMPLETED || item.state === ROUTE_ITEM_STATES.SKIPPED,
  )
  const keptIds = new Set(kept.map((item) => item.contentId))
  const incoming = proposed.items
    .filter((item) => !keptIds.has(item.contentId))
    .map((item) => ({ ...item, state: ROUTE_ITEM_STATES.PLANNED }))
  const items = relinkDistances([...kept, ...incoming])
  const current = items.find((item) => item.state === ROUTE_ITEM_STATES.ACTIVE)
    || items.find((item) => item.state === ROUTE_ITEM_STATES.PLANNED)
  if (current && current.state === ROUTE_ITEM_STATES.PLANNED) current.state = ROUTE_ITEM_STATES.ACTIVE
  return commitActive(
    { ...active, items, currentRouteItemId: current?.routeItemId || null },
    ROUTE_MUTATION_REASONS.CONTEXT_CHANGE,
    snapshotIds(liveItems(active)),
  )
}

export { currentRouteItem, estimateRouteTotals, liveItems, remainingItems, relinkDistances, totalsFor }
