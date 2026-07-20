import { isWaypointId } from '../manifest.js'
import { buildEffectiveSequence, getOptionalWaypointIds } from '../optionalPromotion.js'

/** Waypoint ids visible on a path — sequence stops plus path-specific optional off-route stops. */
export function getVisibleStopIds(manifest, pathId = manifest?.journey?.default_path ?? 'a') {
  if (!manifest) return []

  const sequenceWaypointIds = buildEffectiveSequence(manifest, pathId).filter((id) =>
    isWaypointId(manifest, id),
  )
  const optionalIds = getOptionalWaypointIds(manifest, pathId).filter(
    (id) => isWaypointId(manifest, id) && !sequenceWaypointIds.includes(id),
  )

  return [...sequenceWaypointIds, ...optionalIds]
}

/**
 * Canonical visible stop counts for UI copy — counts manifest waypoints on the path,
 * including optional and encore stops (no visit-stop or pace exclusions).
 *
 * @returns {{ total: number, byAct: Record<string, number>, waypointIds: string[] }}
 */
export function getVisibleStopCounts(manifest, pathId = manifest?.journey?.default_path ?? 'a') {
  const waypointIds = getVisibleStopIds(manifest, pathId)
  const visibleIds = new Set(waypointIds)
  const byAct = {}

  for (const act of manifest?.acts ?? []) {
    byAct[act.id] = (act.waypoints ?? []).filter(
      (id) => isWaypointId(manifest, id) && visibleIds.has(id),
    ).length
  }

  return {
    total: waypointIds.length,
    byAct,
    waypointIds,
  }
}
