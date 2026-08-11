import { getManifestWaypointIds } from './mapStops.js'
import { getWaypoint, resolveJourneyStep } from './manifest.js'
import { isVisitStop } from './tourProductTruth.js'
import { t } from '../i18n/t.js'

export function pickJournalReflection(manifest, completedCount) {
  const reflections = manifest?.reflections ?? []
  if (!reflections.length) return null
  if (completedCount <= 0) return reflections[reflections.length - 1]
  return reflections[Math.min(completedCount - 1, reflections.length - 1)]
}

export function buildJournalTimeline(
  manifest,
  { path = 'a', sequenceIndex = 0, completedWaypointIds = [] } = {}
) {
  if (!manifest?.acts) return []

  const completed = new Set(completedWaypointIds)
  const step = resolveJourneyStep(manifest, path, sequenceIndex)
  const currentId = step.done
    ? null
    : step.type === 'waypoint'
      ? step.id
      : step.targetWaypoint?.id ?? null
  const pathWaypointIds = new Set(getManifestWaypointIds(manifest, path))

  return manifest.acts.map((act) => ({
    id: act.id,
    numeral: act.numeral,
    title: act.title,
    entries: act.waypoints.map((waypointId) => {
      const waypoint = getWaypoint(manifest, waypointId)
      const onPath = pathWaypointIds.has(waypointId)
      let status = 'upcoming'

      if (completed.has(waypointId)) {
        status = 'completed'
      } else if (waypointId === currentId) {
        status = 'current'
      }

      return {
        id: waypointId,
        title: waypoint?.title ?? waypointId,
        status,
        onPath,
        optional: Boolean(waypoint?.optional_on_path) && !onPath,
        isVisitStop: isVisitStop(waypoint),
      }
    }),
  }))
}

export function summarizeJournalProgress(timeline) {
  const entries = timeline.flatMap((act) => act.entries)
  const onPathEntries = entries.filter((entry) => entry.onPath && entry.isVisitStop !== false)
  const completed = onPathEntries.filter((entry) => entry.status === 'completed').length
  const total = onPathEntries.length

  return { completed, total, entries: entries.length }
}

export function journalHeadline({ completed, total }) {
  if (total === 0) return t('journal.headline.ahead')
  if (completed === 0) return t('journal.headline.ahead')
  if (completed >= total) return t('journal.headline.complete')
  return t('journal.headline.unfolding')
}
