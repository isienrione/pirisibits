import { getDistance } from '../utils/distance.js'
import { buildJournalTimeline } from './journalTimeline.js'
import { getWaypoint } from './manifest.js'
import { formatDistanceToNext, formatWalkingTime } from './journeyProgress.js'
import { getTourWaypointIds } from './myTourPlan.js'
import { t } from '../i18n/t.js'

function legMeta(fromWaypoint, toWaypoint) {
  if (!fromWaypoint?.geofence || !toWaypoint?.geofence) return null
  const meters = getDistance(
    fromWaypoint.geofence.lat,
    fromWaypoint.geofence.lng,
    toWaypoint.geofence.lat,
    toWaypoint.geofence.lng,
  )
  if (!Number.isFinite(meters) || meters <= 0) return null
  const distance = formatDistanceToNext(meters)
  const time = formatWalkingTime(meters)
  if (distance && time) return `${distance} · ${time}`
  return distance ?? time
}

/**
 * Flat ordered stops on the active path with visit status for the tour roadmap.
 */
export function buildTourRoadmap(
  manifest,
  { path = 'a', sequenceIndex = 0, completedWaypointIds = [] } = {},
) {
  if (!manifest) return []

  const timeline = buildJournalTimeline(manifest, {
    path,
    sequenceIndex,
    completedWaypointIds,
  })

  const onPath = timeline
    .flatMap((act) =>
      act.entries
        .filter((entry) => entry.onPath)
        .map((entry) => ({
          ...entry,
          actNumeral: act.numeral,
          actTitle: act.title,
        })),
    )

  return onPath.map((entry, index) => {
    const waypoint = getWaypoint(manifest, entry.id)
    const nextEntry = onPath[index + 1]
    const nextWaypoint = nextEntry ? getWaypoint(manifest, nextEntry.id) : null

    return {
      id: entry.id,
      title: entry.title ?? waypoint?.title ?? entry.id,
      status: entry.status,
      actNumeral: entry.actNumeral,
      actTitle: entry.actTitle,
      legToNext: legMeta(waypoint, nextWaypoint),
      isLast: index === onPath.length - 1,
    }
  })
}

/** Pace- and selection-aware roadmap - filters to the active tour itinerary. */
export function buildTourRoadmapForContext(
  manifest,
  {
    path = 'a',
    pace,
    promotedOptionalIds = [],
    customWaypointIds = null,
    sequenceIndex = 0,
    completedWaypointIds = [],
  } = {},
) {
  if (!manifest) return []

  const tourIds = new Set(
    getTourWaypointIds(manifest, {
      path,
      pace,
      promotedOptionalIds,
      customWaypointIds,
    }),
  )

  return buildTourRoadmap(manifest, { path, sequenceIndex, completedWaypointIds }).filter((stop) =>
    tourIds.has(stop.id),
  )
}

export function summarizeTourRoadmap(stops) {
  const completed = stops.filter((s) => s.status === 'completed').length
  return { completed, total: stops.length }
}

/** Dynamic headline - e.g. "You've walked the Forum - the Palatine is next." */
export function tourRoadmapHeadline(stops) {
  if (!stops.length) return t('tour.headline.await')

  const completed = stops.filter((s) => s.status === 'completed')
  const next = stops.find((s) => s.status === 'current') ?? stops.find((s) => s.status === 'upcoming')

  if (completed.length === 0 && next) {
    return t('tour.headline.first', { title: next.title })
  }

  if (completed.length === 0) {
    return t('tour.headline.await')
  }

  if (!next) {
    if (completed.length === 1) {
      return t('tour.headline.reached', { title: completed[0].title })
    }
    const last = completed[completed.length - 1]?.title
    return t('tour.headline.complete', { title: last })
  }

  const recent =
    completed.length === 1
      ? completed[0].title
      : t('letter.listAnd', {
          a: completed[completed.length - 2]?.title,
          b: completed[completed.length - 1]?.title,
        })

  return t('tour.headline.progress', { recent, next: next.title })
}
