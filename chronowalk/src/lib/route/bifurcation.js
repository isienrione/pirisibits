import { CONTENT_TYPES } from '../../content/registry/constants.js'
import { rankHeroes } from '../rankHeroes.js'
import { canAccessContentId } from '../contentAccess.js'
import { currentRouteItem, remainingItems } from './model.js'
import { getDistance } from '../../utils/distance.js'
import { walkingMinutesFromM } from './model.js'
import { trackRoute, ROUTE_TRACK_EVENTS } from './analytics.js'

function geo(item) {
  return item?.geo && Number.isFinite(item.geo.lat) ? item.geo : null
}

/**
 * Default continuation is the next planned route item.
 * Up to two alternatives from the ranker that are not already on the remaining route.
 */
export function bifurcationOptions({
  active,
  catalog = [],
  context = null,
  position = null,
  canAccess = canAccessContentId,
} = {}) {
  const current = currentRouteItem(active)
  const remaining = remainingItems(active)
  const recommendedItem = current || remaining[0] || null
  const onRoute = new Set(remaining.map((item) => item.contentId))
  const byId = Object.fromEntries(catalog.map((item) => [item.id, item]))
  const origin = position || geo(byId[current?.contentId])

  const ranked = rankHeroes({
    catalog,
    context,
    position: origin,
    canAccess,
    completedIds: (active?.items || []).filter((item) => item.state === 'completed').map((item) => item.contentId),
  }).ranked

  const alternatives = []
  for (const item of ranked) {
    if (alternatives.length >= 2) break
    if (!item?.id) continue
    if (onRoute.has(item.id)) continue
    if (current && item.id === current.contentId) continue
    alternatives.push(item)
  }

  const recommended = recommendedItem ? byId[recommendedItem.contentId] || null : ranked[0] || null
  const mysteryAlt = alternatives.find((item) => item.mysteryEligible) || catalog.find((item) => item.mysteryEligible && !onRoute.has(item.id))
  const alts = alternatives.slice(0, 2)
  if (mysteryAlt && !alts.some((item) => item.id === mysteryAlt.id) && alts.length) {
    alts[alts.length - 1] = mysteryAlt
  }

  const withWalk = (item, reason) => {
    if (!item) return null
    const dist = origin && geo(item) ? getDistance(origin.lat, origin.lng, item.geo.lat, item.geo.lng) : null
    return {
      item,
      contentId: item.id,
      contentType: item.contentType,
      reason,
      distanceM: dist,
      walkMin: walkingMinutesFromM(dist || 0),
      experienceMin: Number(item.timeCostMin) || 8,
      isMystery: Boolean(item.mysteryEligible) && item.contentType === CONTENT_TYPES.DISCOVERY,
    }
  }

  const result = {
    recommended: withWalk(recommended, 'Best continuation of your route'),
    alternatives: alts.map((item, index) =>
      withWalk(
        item,
        item.mysteryEligible
          ? 'Something almost everyone walks past'
          : index === 0
            ? 'A strong nearby detour'
            : 'Another nearby option',
      ),
    ).filter(Boolean).slice(0, 2),
  }

  return result
}

export function trackBifurcationView(active, result) {
  trackRoute(ROUTE_TRACK_EVENTS.ROUTE_ALTERNATIVE_VIEWED, {
    cityId: 'rome',
    routeId: active?.proposedRouteId,
    contentId: result?.recommended?.contentId,
    contentType: result?.recommended?.contentType,
  })
}
