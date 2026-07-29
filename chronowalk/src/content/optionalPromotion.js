import { getTraversalSequence } from './manifest.js'

/** Steps inserted when an optional waypoint is GPS-promoted on a path. */
const OPTIONAL_PROMOTION_CONFIG = {
  w04: {
    a: { steps: ['t02', 'w04', 't03'], before: 'w06', afterCompleted: 'w03' },
  },
}

export function getOptionalWaypointIds(manifest, path) {
  return manifest.journey?.optional_waypoints?.[path] ?? []
}

export function getPromotionConfig(manifest, waypointId, path) {
  return OPTIONAL_PROMOTION_CONFIG[waypointId]?.[path] ?? null
}

export function getPromotionInsertSteps(manifest, waypointId, path) {
  return getPromotionConfig(manifest, waypointId, path)?.steps ?? []
}

export function buildEffectiveSequence(manifest, path, promotedOptionalIds = []) {
  const base = [...getTraversalSequence(manifest, path)]
  const promoted = Array.isArray(promotedOptionalIds) ? promotedOptionalIds : []
  if (!promoted.length) return base

  let sequence = base
  for (const waypointId of promoted) {
    const config = getPromotionConfig(manifest, waypointId, path)
    if (!config) continue

    const anchorIndex = sequence.indexOf(config.before)
    if (anchorIndex < 0) continue

    const existingIndex = sequence.indexOf(waypointId)
    if (existingIndex >= 0) {
      if (existingIndex < anchorIndex) continue
      sequence = sequence.filter((id) => id !== waypointId)
    }

    const insertAt = sequence.indexOf(config.before)
    if (insertAt < 0) continue

    sequence = [
      ...sequence.slice(0, insertAt),
      ...config.steps,
      ...sequence.slice(insertAt),
    ]
  }

  return sequence
}

export function canPromoteOptionalWaypoint(
  manifest,
  { path, waypointId, promotedOptionalIds = [], completedWaypointIds = [], currentSequenceIndex = 0 }
) {
  const optionalIds = getOptionalWaypointIds(manifest, path)
  if (!optionalIds.includes(waypointId)) return false
  if (promotedOptionalIds.includes(waypointId)) return false
  if (completedWaypointIds.includes(waypointId)) return false

  const config = getPromotionConfig(manifest, waypointId, path)
  if (!config) return false
  if (completedWaypointIds.includes(config.before)) return false

  const baseSequence = getTraversalSequence(manifest, path)
  const predecessorIndex = baseSequence.indexOf(config.afterCompleted)
  if (predecessorIndex < 0) return false

  return (
    completedWaypointIds.includes(config.afterCompleted) ||
    currentSequenceIndex > predecessorIndex
  )
}
