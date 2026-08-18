import { CONTEXT_INTERESTS, INTEREST_REASON_LABEL, TIME_BUDGETS } from './travelContext/taxonomy.js'
import { expandInterestIds } from './travelContext/taxonomy.js'
import { toRankerSignals } from './travelContext/compat.js'
import { getDistance } from '../utils/distance.js'

const WALK_METERS_PER_MIN = 80

function budgetMinutes(timeBudgetId) {
  return TIME_BUDGETS.find((item) => item.id === timeBudgetId)?.minutes ?? 999
}

function budgetLabel(timeBudgetId) {
  return TIME_BUDGETS.find((item) => item.id === timeBudgetId)?.label ?? null
}

function walkingMinutes(distanceM) {
  if (!Number.isFinite(distanceM) || distanceM < 0) return null
  return Math.max(1, Math.round(distanceM / WALK_METERS_PER_MIN))
}

function distanceScore(distanceM) {
  if (!Number.isFinite(distanceM)) return 0
  return Math.max(0, 40 - distanceM / 50)
}

function matchingUserIds(interestIds, heroTags) {
  const heroExpanded = expandInterestIds(heroTags)
  return (interestIds || []).filter((id) => {
    const userExpanded = expandInterestIds([id])
    for (const tag of userExpanded) {
      if (heroExpanded.has(tag)) return true
    }
    return false
  })
}

function intersects(a, b) {
  for (const value of a) {
    if (b.has(value)) return true
  }
  return false
}

/**
 * Transparent V0 ranker. Locked premium Heroes remain visible.
 * A lock affects START ACCESS, not whether ChronoWalk may recommend the place.
 *
 * Accepts a full TravelContext via `context` but only scores reliable signals:
 * interests, avoid (light), availableTimeNow, location, completed, iconic/hidden.
 * Does not score tripHorizon, dates, anchors, or mealIntent and does not
 * generate an itinerary.
 *
 * score =
 *   max(0, 40 - distanceM/50)          if GPS
 *   + 18 per matching interest
 *   + 15 if timeCostMin <= budget, else +6 if within 1.25×
 *   − 50 if completed
 *   − 12 if hero matches an avoid interest
 *   + 6 iconic/hidden preference when tagged
 *   + intrinsicPriority / 10
 *   + 8 if currently startable
 */
export function scoreHero(
  hero,
  {
    interestIds = [],
    timeBudgetId = null,
    position = null,
    canAccess = () => false,
    completedIds = [],
    avoidInterestIds = [],
    iconicVsHidden = null,
  } = {},
) {
  let score = 0
  const whyReasons = []

  let distanceM = null
  if (position && hero.geo) {
    distanceM = getDistance(position.lat, position.lng, hero.geo.lat, hero.geo.lng)
    score += distanceScore(distanceM)
    const mins = walkingMinutes(distanceM)
    if (mins != null && Number.isFinite(distanceM)) {
      whyReasons.push(`${mins} min away`)
    }
  }

  const tags = Array.isArray(hero.interestTags) ? hero.interestTags : []
  const matches = matchingUserIds(interestIds, tags)
  score += matches.length * 18
  if (matches.length > 0) {
    const cue =
      INTEREST_REASON_LABEL[matches[0]] || CONTEXT_INTERESTS.find((item) => item.id === matches[0])?.label
    if (cue) whyReasons.push(`Matches ${cue}`)
  }

  if (avoidInterestIds.length > 0 && intersects(expandInterestIds(avoidInterestIds), expandInterestIds(tags))) {
    score -= 12
  }

  if (iconicVsHidden === 'hidden' && tags.includes('hidden-places')) score += 6
  if (iconicVsHidden === 'iconic' && tags.includes('iconic-sights')) score += 6

  const minutes = budgetMinutes(timeBudgetId)
  const cost = Number(hero.timeCostMin) || 0
  if (cost <= minutes) {
    score += 15
    if (timeBudgetId === '30min') {
      whyReasons.push('Fits your 30 minutes')
    } else {
      const label = budgetLabel(timeBudgetId)
      if (label && minutes < 999) {
        whyReasons.push(`Fits your ${label.toLowerCase()}`)
      }
    }
  } else if (cost <= minutes * 1.25) {
    score += 6
  }

  const completed = (completedIds || []).includes(hero.heroId)
  if (completed) score -= 50

  score += (Number(hero.intrinsicPriority) || 0) / 10

  const accessible = Boolean(canAccess?.(hero.heroId))
  if (accessible) score += 8

  return {
    ...hero,
    score,
    distanceM,
    whyReasons,
    completed,
    locked: !accessible,
  }
}

export function rankHeroes({
  catalog = [],
  context = null,
  interestIds,
  surpriseMe,
  timeBudgetId,
  position,
  canAccess = () => false,
  completedIds,
} = {}) {
  const overrides = {}
  if (interestIds !== undefined) overrides.interestIds = interestIds
  if (surpriseMe !== undefined) overrides.surpriseMe = surpriseMe
  if (timeBudgetId !== undefined) overrides.timeBudgetId = timeBudgetId
  if (position !== undefined) overrides.position = position
  if (completedIds !== undefined) overrides.completedIds = completedIds
  const signals = toRankerSignals(context, overrides)
  const ranked = catalog
    .map((hero) =>
      scoreHero(hero, {
        interestIds: signals.interestIds,
        timeBudgetId: signals.timeBudgetId,
        position: signals.position,
        canAccess,
        completedIds: signals.completedIds,
        avoidInterestIds: signals.avoidInterestIds,
        iconicVsHidden: signals.iconicVsHidden,
      }),
    )
    .sort((a, b) => b.score - a.score || a.heroId.localeCompare(b.heroId))

  return {
    primary: ranked[0] ?? null,
    alternatives: ranked.slice(1, 3),
    ranked,
  }
}

export function discoverCards(rankedResult) {
  const primary = rankedResult?.primary ?? null
  const alternatives = (rankedResult?.alternatives ?? []).slice(0, 2)
  return { primary, alternatives }
}
