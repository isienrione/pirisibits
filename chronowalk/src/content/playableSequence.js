import { JOURNEY_PACE } from '../data/romePacing.js'
import { buildEffectiveSequence } from './optionalPromotion.js'

/**
 * Sequence the player actually walks.
 * Own-pace / single-Hero starts (free Pantheon) keep only the selected waypoint ids
 * so guests never advance into premium stops.
 */
export function buildPlayableSequence(
  manifest,
  path,
  promotedOptionalIds = [],
  context = null,
) {
  const base = buildEffectiveSequence(manifest, path, promotedOptionalIds)
  const custom = context?.customWaypointIds
  if (context?.pace === JOURNEY_PACE.OWN && Array.isArray(custom) && custom.length > 0) {
    const allowed = new Set(custom)
    return base.filter((id) => allowed.has(id))
  }
  return base
}
