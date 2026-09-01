import { expandInterestIds } from './taxonomy.js'
import { normalizeTravelContext, uniqueStrings } from './schema.js'

/**
 * Recommendation V0 reads only signals that are reliable today.
 * The function accepts the full TravelContext so later planning layers
 * do not need another migration. It does NOT consume tripHorizon, dates,
 * anchors, or mealIntent.
 */
export function toRankerSignals(context, overrides = {}) {
  const normalized = context ? normalizeTravelContext(context) : null
  const traveler = normalized?.traveler
  const session = normalized?.session
  const history = normalized?.history

  const interestIds = uniqueStrings(
    overrides.interestIds ?? traveler?.positiveInterestIds ?? normalized?.interestIds ?? [],
  )
  const surpriseMe =
    overrides.surpriseMe !== undefined
      ? overrides.surpriseMe === true
      : traveler?.surpriseMe === true || normalized?.surpriseMe === true
  const timeBudgetId =
    overrides.timeBudgetId !== undefined
      ? overrides.timeBudgetId
      : session?.availableTimeNow ?? normalized?.timeBudgetId ?? null
  const position =
    overrides.position !== undefined
      ? overrides.position
      : session?.location ?? normalized?.lastPosition ?? null
  const completedIds = uniqueStrings([
    ...(overrides.completedIds || []),
    ...(history?.completedExperienceIds || []),
  ])
  const avoidInterestIds = uniqueStrings([
    ...(traveler?.avoidInterestIds || []),
    ...(traveler?.avoidSubInterestIds || []),
  ])

  return {
    interestIds: surpriseMe ? [] : interestIds,
    surpriseMe,
    timeBudgetId: timeBudgetId || null,
    position: position || null,
    completedIds,
    dismissedIds: uniqueStrings([
      ...(overrides.dismissedIds || []),
      ...(history?.dismissedExperienceIds || []),
    ]),
    avoidInterestIds,
    iconicVsHidden: traveler?.iconicVsHidden ?? null,
    expandedInterestIds: expandInterestIds(surpriseMe ? [] : interestIds),
    expandedAvoidIds: expandInterestIds(avoidInterestIds),
  }
}
