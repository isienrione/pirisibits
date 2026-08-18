import {
  CONTEXT_INTERESTS,
  TIME_BUDGETS,
} from '../content/rome/heroRecommendationMeta.js'
import { getDistance } from '../utils/distance.js'

const INTEREST_REASON_LABEL = Object.freeze({
  'ancient-power': 'ancient Rome',
  art: 'art',
  architecture: 'architecture',
  everyday: 'everyday life',
  sacred: 'sacred Rome',
  hidden: 'hidden details',
})

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

/**
 * Transparent V0 ranker. Locked premium Heroes remain visible.
 * A lock affects START ACCESS, not whether ChronoWalk may recommend the place.
 *
 * score =
 *   max(0, 40 - distanceM/50)          if GPS
 *   + 18 per matching interest
 *   + 15 if timeCostMin <= budget, else +6 if within 1.25×
 *   − 50 if completed
 *   + intrinsicPriority / 10
 *   + 8 if currently startable
 */
export function scoreHero(hero, { interestIds = [], timeBudgetId = null, position = null, canAccess = () => false, completedIds = [] } = {}) {
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
  const matches = (interestIds || []).filter((id) => tags.includes(id))
  score += matches.length * 18
  if (matches.length > 0) {
    const cue = INTEREST_REASON_LABEL[matches[0]] || CONTEXT_INTERESTS.find((item) => item.id === matches[0])?.label
    if (cue) whyReasons.push(`Matches ${cue}`)
  }

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
  interestIds = [],
  surpriseMe = false,
  timeBudgetId = null,
  position = null,
  canAccess = () => false,
  completedIds = [],
} = {}) {
  const interests = surpriseMe ? [] : interestIds
  const ranked = catalog
    .map((hero) =>
      scoreHero(hero, {
        interestIds: interests,
        timeBudgetId,
        position,
        canAccess,
        completedIds,
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
