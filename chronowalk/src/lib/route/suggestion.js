import { ROUTE_PROACTIVE_SUGGESTIONS } from './constants.js'
import { estimateRouteTotals, remainingItems } from './model.js'
import { TIME_BUDGETS } from '../travelContext/taxonomy.js'

function budgetMinutes(id) {
  return TIME_BUDGETS.find((item) => item.id === id)?.minutes ?? null
}

/**
 * Deterministic suggestion evaluator. UI is feature-flagged off by default.
 */
export function evaluateRouteSuggestion({
  active,
  context,
  position = null,
  enabled = ROUTE_PROACTIVE_SUGGESTIONS,
} = {}) {
  if (!enabled || !active) return null
  const remaining = remainingItems(active)
  if (remaining.length < 2) return null
  const totals = estimateRouteTotals(active.items)
  const budget = budgetMinutes(context?.session?.availableTimeNow || context?.timeBudgetId)
  if (budget && totals.estimatedDurationMin > budget + 25) {
    const skip = remaining[remaining.length - 2]
    const keep = remaining[remaining.length - 1]
    return {
      kind: 'time-overrun',
      skipRouteItemId: skip.routeItemId,
      message: `You're about ${Math.round(totals.estimatedDurationMin - budget)} minutes later than the original plan. I'd skip the next-to-last stop and continue to the last one.`,
      skipContentId: skip.contentId,
      keepContentId: keep.contentId,
    }
  }
  void position
  return null
}
