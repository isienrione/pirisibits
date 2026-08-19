import { getRomeRankableCatalog, getRegistryItem } from '../../content/rome/registry.js'
import { canAccessContentId } from '../contentAccess.js'
import { readGuestContext } from '../guestSession.js'
import { composeProposedRoute } from './composer.js'
import { explainProposedRoute, formatDurationLabel, formatKm, routeRationale, routeTags } from './why.js'
import { getProposedRoute, saveProposedRoute } from './store.js'
import { walkingMinutesFromM } from './model.js'
import { isPlausibleRomePosition, travelerFacingDistanceM } from '../geoSanity.js'

export function annotateProposedRoute(proposed, { context, catalog, position } = {}) {
  if (!proposed) return null
  const byId = Object.fromEntries((catalog || []).map((item) => [item.id, item]))
  const first = byId[proposed.items[0]?.contentId]
  const remote = Boolean(proposed.planningRemote) || !isPlausibleRomePosition(position)
  let minutesAway = null
  if (!remote && position && first?.geo) {
    const dist = travelerFacingDistanceM(position, first.geo)
    if (dist != null) minutesAway = walkingMinutesFromM(dist)
  }
  const explained = explainProposedRoute({
    proposed,
    context,
    minutesAway,
    inventoryLimited: proposed.inventoryLimited,
    planningRemote: remote,
  })
  return {
    ...proposed,
    title: explained.headline,
    summary: explained.body,
    tags: routeTags({ context, items: proposed.items, catalogById: byId }),
    rationale: routeRationale({ items: proposed.items, catalogById: byId }),
    homeHeadline: explained.homeHeadline,
    contextLine: explained.contextLine,
    greeting: explained.greeting,
    minutesAway: remote ? null : minutesAway,
    planningRemote: remote,
  }
}

export function ensureProposedRoute({ context, catalog, position, canAccess } = {}) {
  const existing = getProposedRoute()
  if (existing?.items?.length) return existing
  return composeAndSave({ context, catalog, position, canAccess })
}

export function composeAndSave({ context, catalog, position, canAccess } = {}) {
  const guest = context || readGuestContext()
  const list = catalog || getRomeRankableCatalog()
  const access = canAccess || ((id) => canAccessContentId(id))
  const here = position || guest?.lastPosition || guest?.session?.location || null
  const raw = composeProposedRoute({
    context: guest,
    catalog: list,
    canAccess: access,
    position: here,
    completedIds: guest?.history?.completedExperienceIds || [],
    dismissedIds: guest?.history?.dismissedExperienceIds || [],
  })
  const annotated = annotateProposedRoute(raw, { context: guest, catalog: list, position: here })
  return saveProposedRoute(annotated)
}

export function hydrateRouteItem(item, catalogById = null) {
  if (!item) return null
  const content = catalogById?.[item.contentId] || getRegistryItem(item.contentId)
  return { ...item, content }
}

export * from './constants.js'
export * from './model.js'
export * from './store.js'
export * from './composer.js'
export * from './why.js'
export * from './bifurcation.js'
export * from './suggestion.js'
export * from './analytics.js'
export * from './complete.js'
