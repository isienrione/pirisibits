import { CONTENT_TYPES } from '../../content/registry/constants.js'
import { rankHeroes } from '../rankHeroes.js'
import { TIME_BUDGETS } from '../travelContext/taxonomy.js'
import { toRankerSignals } from '../travelContext/compat.js'
import { consumerExperienceIdFor, placeFamilyFor } from '../../content/rome/consumerHeroes.js'
import { isPlausibleRomePosition, travelerFacingDistanceM } from '../geoSanity.js'
import { getDistance } from '../../utils/distance.js'
import {
  MAX_ROUTE_ITEMS,
  MIN_ROUTE_ITEMS,
  TIME_FIT_TOLERANCE,
  WALKING_LIMITS,
  WALK_METERS_PER_MIN,
} from './constants.js'
import { createProposedRoute, createRouteItem, walkingMinutesFromM } from './model.js'

function budgetMinutes(timeBudgetId) {
  return TIME_BUDGETS.find((item) => item.id === timeBudgetId)?.minutes ?? 90
}

function limitsFor(walkingTolerance) {
  return WALKING_LIMITS[walkingTolerance] || WALKING_LIMITS.moderate
}

function geoOf(item) {
  const geo = item?.geo
  if (!geo || !Number.isFinite(geo.lat) || !Number.isFinite(geo.lng)) return null
  return geo
}

function distanceBetween(a, b) {
  const ga = geoOf(a)
  const gb = geoOf(b)
  if (!ga || !gb) return null
  const facing = travelerFacingDistanceM(ga, gb)
  if (facing != null) return facing
  if (!isPlausibleRomePosition(ga) || !isPlausibleRomePosition(gb)) return null
  return getDistance(ga.lat, ga.lng, gb.lat, gb.lng)
}

function clusterOf(item) {
  return item?.clusterId || ''
}

function historicPrefer(item) {
  const scopes = item?.unlockScopes || []
  return scopes.includes('rome-free') || scopes.includes('rome-historic-center')
}

function experienceKey(item) {
  return consumerExperienceIdFor(item) || item?.id || ''
}

function markUsed(used, item) {
  if (!item) return
  used.add(item.id)
  used.add(experienceKey(item))
  used.add(placeFamilyFor(item))
  for (const id of item.waypointIds || item.playerSequence || []) used.add(id)
}

function alreadyUsed(used, item) {
  if (!item) return true
  if (used.has(item.id) || used.has(experienceKey(item))) return true
  if (item.contentType === CONTENT_TYPES.HERO && used.has(placeFamilyFor(item))) return true
  return (item.waypointIds || item.playerSequence || []).some((id) => used.has(id))
}

/**
 * Greedy geographically coherent composer on top of rankHeroes.
 * Operates on consumer Experiences, not every technical waypoint ID.
 */
export function composeProposedRoute({
  context = null,
  catalog = [],
  canAccess = () => false,
  position = null,
  completedIds = [],
  dismissedIds = [],
} = {}) {
  const signals = toRankerSignals(context, {
    position,
    completedIds,
    dismissedIds,
  })
  const budgetId = signals.timeBudgetId || '1h'
  let budget = budgetMinutes(budgetId)
  if (budget >= 999) budget = 120
  const walkingTolerance = context?.traveler?.walkingTolerance || 'moderate'
  const limits = limitsFor(walkingTolerance)
  const ranked = rankHeroes({
    catalog,
    context,
    position: isPlausibleRomePosition(position) ? position : null,
    canAccess,
    completedIds: signals.completedIds,
    dismissedIds: signals.dismissedIds,
  }).ranked.filter((item) => item.contentType === CONTENT_TYPES.HERO || item.contentType === CONTENT_TYPES.DISCOVERY)

  const used = new Set(signals.completedIds.concat(signals.dismissedIds))
  const startable = ranked.filter((item) => canAccess(item.id) && !alreadyUsed(used, item))
  const pool = ranked.filter((item) => !alreadyUsed(used, item))
  const validPosition = isPlausibleRomePosition(position) ? position : null

  let seed = null
  if (validPosition && startable.length) {
    seed = [...startable].sort((a, b) => {
      const da = a.distanceM ?? distanceBetween({ geo: validPosition }, a) ?? 99999
      const db = b.distanceM ?? distanceBetween({ geo: validPosition }, b) ?? 99999
      return da - db || (b.score || 0) - (a.score || 0)
    })[0]
  } else {
    seed =
      startable.find((item) => experienceKey(item) === 'rome:pantheon' || item.id === 'w17') ||
      startable[0] ||
      pool[0] ||
      null
  }
  if (!seed) return null

  const chosen = [seed]
  markUsed(used, seed)
  let elapsed = Number(seed.timeCostMin) || 8
  if (validPosition && geoOf(seed)) {
    const toSeed = travelerFacingDistanceM(validPosition, seed.geo)
    if (toSeed != null) elapsed += walkingMinutesFromM(toSeed)
  }
  let walked = 0
  let last = seed

  const targetCount = budget <= 35 ? 2 : budget <= 70 ? 3 : budget <= 140 ? 4 : 5
  const typesSeen = new Set([seed.contentType])

  while (chosen.length < Math.min(MAX_ROUTE_ITEMS, Math.max(MIN_ROUTE_ITEMS, targetCount))) {
    const lastType = last.contentType
    const candidates = pool.filter((item) => !alreadyUsed(used, item))
    if (!candidates.length) break

    const scored = candidates
      .map((item) => {
        const dist = distanceBetween(last, item)
        if (dist == null) return null
        if (chosen.length >= 1 && dist < 140) {
          const fartherExists = candidates.some((other) => {
            const d = distanceBetween(last, other)
            return (
              d != null &&
              d >= 140 &&
              d <= limits.maxLegM &&
              !alreadyUsed(used, other) &&
              canAccess(other.id)
            )
          })
          if (fartherExists) return null
        }
        if (dist > limits.maxLegM && candidates.some((other) => canAccess(other.id) && (distanceBetween(last, other) || 99999) <= limits.maxLegM)) {
          return null
        }
        const walkMin = walkingMinutesFromM(dist)
        const exp = Number(item.timeCostMin) || 6
        if (elapsed + walkMin + exp > budget * TIME_FIT_TOLERANCE) return null
        if (walked + dist > limits.maxTotalM) return null
        const locked = !canAccess(item.id)
        if (locked && chosen.length < 2) return null
        if (locked && chosen.filter((row) => !canAccess(row.id)).length >= 1) return null
        let score = (item.score || 0) - dist / 35
        if (clusterOf(item) && clusterOf(item) === clusterOf(last)) score += 8
        if (historicPrefer(item) && historicPrefer(last)) score += 6
        if (lastType === CONTENT_TYPES.HERO && item.contentType === CONTENT_TYPES.DISCOVERY) score += 10
        if (lastType === CONTENT_TYPES.DISCOVERY && item.contentType === CONTENT_TYPES.HERO) score += 6
        if (item.mysteryEligible && chosen.length >= 1) score += 4
        if (typesSeen.has(item.contentType) && item.contentType === CONTENT_TYPES.HERO && typesSeen.has(CONTENT_TYPES.DISCOVERY)) {
          score -= 4
        }
        if (locked) score -= 12
        return { item, dist, walkMin, exp, score }
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)

    const next = scored[0]
    if (!next) break
    chosen.push(next.item)
    markUsed(used, next.item)
    typesSeen.add(next.item.contentType)
    elapsed += next.walkMin + next.exp
    walked += next.dist
    last = next.item
    if (chosen.length >= targetCount) break
  }

  if (chosen.length === 1) {
    const extra = pool.find(
      (item) =>
        !alreadyUsed(used, item) && item.contentType === CONTENT_TYPES.DISCOVERY && canAccess(item.id),
    )
    if (extra) {
      chosen.push(extra)
      markUsed(used, extra)
    }
  }

  const hasHero = chosen.some((item) => item.contentType === CONTENT_TYPES.HERO)
  if (!hasHero && budget >= 45) {
    const hero = pool.find((item) => !alreadyUsed(used, item) && item.contentType === CONTENT_TYPES.HERO)
    if (hero && canAccess(hero.id)) {
      chosen.splice(1, 0, hero)
      markUsed(used, hero)
    }
  }

  if (!canAccess(chosen[0].id)) {
    const startIdx = chosen.findIndex((item) => canAccess(item.id))
    if (startIdx > 0) {
      const [start] = chosen.splice(startIdx, 1)
      chosen.unshift(start)
    }
  }

  const uniqueKeys = new Set()
  const uniqueChosen = chosen.filter((item) => {
    const key = experienceKey(item)
    if (uniqueKeys.has(key)) return false
    uniqueKeys.add(key)
    return true
  })

  const items = uniqueChosen.slice(0, MAX_ROUTE_ITEMS).map((item, index) => {
    const previous = index === 0 ? (validPosition ? { geo: validPosition } : null) : uniqueChosen[index - 1]
    const dist = previous ? distanceBetween(previous, item) || 0 : 0
    const mystery = Boolean(item.mysteryEligible) && index > 0 && item.contentType === CONTENT_TYPES.DISCOVERY
    return createRouteItem({
      contentId: item.id,
      contentType: item.contentType,
      position: index,
      estimatedExperienceMin: Number(item.timeCostMin) || 8,
      estimatedTransitMin: walkingMinutesFromM(dist),
      distanceFromPreviousM: dist,
      isMysteryDiscovery: mystery,
    })
  })

  const walkingM = items.reduce((sum, item) => sum + item.distanceFromPreviousM, 0)
  const walkingMin = items.reduce((sum, item) => sum + item.estimatedTransitMin, 0)
  const experienceMin = items.reduce((sum, item) => sum + item.estimatedExperienceMin, 0)

  return createProposedRoute({
    cityId: 'rome',
    contextSnapshot: context,
    title: '',
    summary: '',
    estimatedDurationMin: walkingMin + experienceMin,
    estimatedWalkingMin: walkingMin,
    estimatedWalkingDistanceM: walkingM,
    tags: [],
    items,
    rationale: [],
  })
}

export function pathZigzagRatio(items, catalogById) {
  if (!items || items.length < 3) return 1
  let path = 0
  for (let i = 1; i < items.length; i += 1) {
    path += Number(items[i].distanceFromPreviousM) || 0
  }
  const first = catalogById[items[0].contentId]
  const last = catalogById[items[items.length - 1].contentId]
  const ga = first?.geo
  const gb = last?.geo
  if (!ga || !gb) return 1
  const straight = travelerFacingDistanceM(ga, gb) || getDistance(ga.lat, ga.lng, gb.lat, gb.lng)
  if (!straight) return 1
  return path / straight
}

export function walkingMinutes(distanceM) {
  if (!Number.isFinite(distanceM)) return 0
  return Math.max(0, Math.round(distanceM / WALK_METERS_PER_MIN))
}

export function routeHasUniqueConsumerHeroes(items = [], catalogById = {}) {
  const seen = new Set()
  for (const item of items) {
    const content = catalogById[item.contentId] || { id: item.contentId }
    const key = experienceKey(content)
    if (seen.has(key)) return false
    seen.add(key)
  }
  return true
}
