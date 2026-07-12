/**
 * Evaluate whether a conditional insert should play.
 * @param {object} insert manifest.inserts entry
 * @param {object} context
 * @param {Set<string>|string[]} context.completedWaypointIds
 * @param {Set<string>|string[]} context.completedTransitIds
 */
export function isInsertEligible(insert, context = {}) {
  if (!insert) return false

  const completedWaypoints = toSet(context.completedWaypointIds)
  const completedTransits = toSet(context.completedTransitIds)

  if (insert.playIfMissing?.length) {
    const missing = insert.playIfMissing.some((id) => !completedWaypoints.has(id))
    if (!missing) return false
  }

  if (insert.requiresAny?.length) {
    const anyMet = insert.requiresAny.some((id) => completedWaypoints.has(id))
    if (!anyMet) return false
  }

  if (insert.requires?.length) {
    const allMet = insert.requires.every((id) => completedWaypoints.has(id))
    if (!allMet) return false
  }

  if (insert.requiresHeard?.length) {
    const allHeard = insert.requiresHeard.every(
      (id) => completedTransits.has(id) || completedWaypoints.has(id)
    )
    if (!allHeard) return false
  }

  return true
}

function toSet(value) {
  if (value instanceof Set) return value
  return new Set(value ?? [])
}
