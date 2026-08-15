import { JOURNEY_PACE, ROME_ACTS } from '../data/romePacing.js'
import { getTierActIds, getTierWaypointIds } from '../data/tourTiers.js'
import { getClassicDayBreakWaypointId } from './actBoundaries.js'
import { getManifestWaypointIds } from './mapStops.js'
import { getWaypoint, isWaypointId, resolveJourneyStep } from './manifest.js'
import { buildEffectiveSequence } from './optionalPromotion.js'
import { isVisitStop, getVisitStopIds } from './tourProductTruth.js'
import { t } from '../i18n/t.js'

const CLASSIC_DAY2_ACTS = new Set(['act5', 'act6'])

const ACT_META = Object.fromEntries(ROME_ACTS.map((act) => [act.id, act]))

/** Act ids included in the tour for each pace. */
export function getTourActIds(pace) {
  return getTierActIds(pace)
}

/** Ordered waypoint ids on the active path that belong to the chosen tour. */
export function getTourWaypointIds(manifest, context) {
  if (!manifest) return []

  const path = context.path ?? manifest.journey?.default_path ?? 'a'
  const pace = context.pace ?? JOURNEY_PACE.CENTRAL
  const allPathIds = getManifestWaypointIds(manifest, path, context.promotedOptionalIds ?? [])

  if (pace === JOURNEY_PACE.OWN) {
    const selected = new Set(context.customWaypointIds ?? [])
    return allPathIds.filter((id) => selected.has(id))
  }

  const tierIds = getTierWaypointIds(pace)
  if (tierIds) {
    const allowed = new Set(tierIds)
    return allPathIds.filter((id) => allowed.has(id))
  }

  const allowedActs = new Set(getTourActIds(pace))
  return allPathIds.filter((id) => {
    const waypoint = getWaypoint(manifest, id)
    return waypoint?.act && allowedActs.has(waypoint.act)
  })
}

export function isLastTourWaypoint(waypointId, manifest, context) {
  if (!manifest || !waypointId) return false
  const tourIds = getTourWaypointIds(manifest, context)
  return tourIds.length > 0 && tourIds[tourIds.length - 1] === waypointId
}

export function isClassicDayTwoUnlocked(context) {
  const breakId = getClassicDayBreakWaypointId()
  return Boolean(context.completedWaypointIds?.includes(breakId))
}

export function isActLockedForTour(actId, context) {
  if (context.pace !== JOURNEY_PACE.CLASSIC) return false
  if (!CLASSIC_DAY2_ACTS.has(actId)) return false
  return !isClassicDayTwoUnlocked(context)
}

function deriveStopStatus(waypointId, completed, currentId) {
  if (completed.has(waypointId)) return 'completed'
  if (waypointId === currentId) return 'current'
  return 'upcoming'
}

function deriveActStatus(stops, locked) {
  if (locked) return 'locked'
  if (!stops.length) return 'ahead'
  if (stops.every((stop) => stop.status === 'completed')) return 'done'
  if (stops.some((stop) => stop.status === 'current')) return 'current'
  if (stops.some((stop) => stop.status === 'completed')) return 'current'
  return 'ahead'
}

function actDisplayStatus(actStatus, locked) {
  if (locked) return 'ahead'
  if (actStatus === 'done') return 'done'
  if (actStatus === 'current') return 'current'
  return 'ahead'
}

/**
 * Act-grouped tour roadmap for the My Tour tab - filtered by pace and own-pace selection.
 */
export function buildMyTourActs(manifest, context) {
  if (!manifest?.acts) return []

  const tourWaypointIds = new Set(getTourWaypointIds(manifest, context))
  const completed = new Set(context.completedWaypointIds ?? [])
  const path = context.path ?? manifest.journey?.default_path ?? 'a'
  const step = resolveJourneyStep(manifest, path, context.currentSequenceIndex ?? 0, context.promotedOptionalIds ?? [])
  const currentId = step.done
    ? null
    : step.type === 'waypoint'
      ? step.id
      : step.targetWaypoint?.id ?? null

  return manifest.acts
    .map((manifestAct) => {
      const meta = ACT_META[manifestAct.id] ?? manifestAct
      const stops = manifestAct.waypoints
        .filter((waypointId) => isWaypointId(manifest, waypointId))
        .filter((waypointId) => tourWaypointIds.has(waypointId))
        .map((waypointId) => {
          const waypoint = getWaypoint(manifest, waypointId)
          return {
            id: waypointId,
            title: waypoint?.title ?? waypointId,
            hook: waypoint?.approachLine ?? waypoint?.arrivalLine ?? '',
            status: deriveStopStatus(waypointId, completed, currentId),
            waypoint,
            isVisitStop: isVisitStop(waypoint),
          }
        })

      if (!stops.length) return null

      const locked = isActLockedForTour(manifestAct.id, context)
      const actStatus = deriveActStatus(stops, locked)

      return {
        id: manifestAct.id,
        numeral: manifestAct.numeral,
        title: manifestAct.title ?? meta.title,
        promise: manifestAct.promise ?? meta.promise ?? '',
        colorKey: manifestAct.id,
        locked,
        status: actDisplayStatus(actStatus, locked),
        actStatus,
        stops,
        photoStop: stops[0]?.waypoint ?? null,
      }
    })
    .filter(Boolean)
}

export function summarizeMyTour(acts) {
  const stops = acts.flatMap((act) => act.stops).filter((stop) => stop.isVisitStop !== false)
  const completed = stops.filter((stop) => stop.status === 'completed').length
  return { completed, total: stops.length, actCount: acts.length }
}

/**
 * Ordered visit stops for the Home progress graphic.
 * Stops jumped past without completing are marked `skipped` (still counted in total).
 */
export function buildHomeProgressStops(manifest, context) {
  if (!manifest) return []

  const path = context.path ?? manifest.journey?.default_path ?? 'a'
  const promoted = context.promotedOptionalIds ?? []
  const ids = getVisitStopIds(manifest, {
    path,
    pace: context.pace ?? JOURNEY_PACE.HEROIC,
    promotedOptionalIds: promoted,
    customWaypointIds: context.customWaypointIds,
  })
  const completed = new Set(context.completedWaypointIds ?? [])
  const step = resolveJourneyStep(manifest, path, context.currentSequenceIndex ?? 0, promoted)
  const currentId = step.done
    ? null
    : step.type === 'waypoint'
      ? step.id
      : step.targetWaypoint?.id ?? null
  const currentSeq = context.currentSequenceIndex ?? 0

  return ids.map((id) => {
    const stopSeq = findSequenceIndexForWaypoint(manifest, id, path, promoted)
    let status = 'upcoming'
    if (completed.has(id)) status = 'completed'
    else if (currentId && id === currentId) status = 'current'
    else if (stopSeq >= 0 && stopSeq < currentSeq) status = 'skipped'
    return { id, status }
  })
}

export function summarizeHomeProgress(stops) {
  const total = stops.length
  const completed = stops.filter((stop) => stop.status === 'completed').length
  const skipped = stops.filter((stop) => stop.status === 'skipped').length
  const currentIndex = stops.findIndex((stop) => stop.status === 'current')
  const advanced = completed + skipped
  const positionIndex =
    currentIndex >= 0 ? currentIndex : advanced > 0 ? Math.min(advanced, total) - 1 : -1
  const percent =
    total <= 0
      ? 0
      : currentIndex >= 0
        ? Math.round(((currentIndex + 1) / total) * 100)
        : Math.round((advanced / total) * 100)

  return {
    completed,
    skipped,
    total,
    advanced,
    percent: Math.min(100, Math.max(0, percent)),
    positionIndex,
  }
}

export function currentActForTour(acts) {
  return acts.find((act) => act.status === 'current') ?? acts.find((act) => act.actStatus !== 'done' && !act.locked) ?? acts[0] ?? null
}

export function primaryCtaLabel(acts, journeyActive) {
  const current = currentActForTour(acts)
  if (!current) return t('tour.cta.beginWalk')

  const isEncore =
    current.id === 'encore' || current.numeral === 'Encore' || current.numeral === 'Bis'
  const numeralLabel = isEncore
    ? t('journeyHome.encore')
    : t('tour.actShort', { numeral: current.numeral })

  if (journeyActive) {
    return t('tour.cta.return', { title: current.title })
  }

  if (current.stops.every((stop) => stop.status === 'completed')) {
    const next = acts.find((act) => act.actStatus !== 'done' && !act.locked)
    if (next) {
      const nextEncore =
        next.id === 'encore' || next.numeral === 'Encore' || next.numeral === 'Bis'
      const nextLabel = nextEncore
        ? t('journeyHome.encore')
        : t('tour.actShort', { numeral: next.numeral })
      return t('tour.cta.beginAct', { label: nextLabel, title: next.title })
    }
  }

  return t('tour.cta.beginAct', { label: numeralLabel, title: current.title })
}

/** Flat walking-order groups for the route sheet. */
export function buildRouteSheetGroups(acts) {
  let order = 0
  return acts.map((act) => ({
    actNum: act.numeral === 'Encore' ? 'ENC' : act.numeral,
    actName: act.title,
    actId: act.id,
    stops: act.stops.map((stop) => {
      order += 1
      return {
        n: order,
        id: stop.id,
        name: stop.title,
        hook: stop.hook,
        dur: stop.waypoint?.duration ?? '',
        photo: stop.waypoint,
        status: stop.status,
      }
    }),
  }))
}

export function findSequenceIndexForWaypoint(manifest, waypointId, path, promotedOptionalIds = []) {
  const sequence = buildEffectiveSequence(manifest, path, promotedOptionalIds)
  return sequence.indexOf(waypointId)
}

/** All selectable waypoints grouped by act (for own-pace picker). */
export function buildOwnPacePickerActs(manifest, context) {
  if (!manifest?.acts) return []

  const path = context.path ?? manifest.journey?.default_path ?? 'a'
  const pathWaypointIds = new Set(getManifestWaypointIds(manifest, path, context.promotedOptionalIds ?? []))

  return manifest.acts
    .map((manifestAct) => {
      const meta = ACT_META[manifestAct.id] ?? manifestAct
      const stops = manifestAct.waypoints
        .filter((waypointId) => isWaypointId(manifest, waypointId))
        .filter((waypointId) => pathWaypointIds.has(waypointId))
        .map((waypointId) => {
          const waypoint = getWaypoint(manifest, waypointId)
          return {
            id: waypointId,
            title: waypoint?.title ?? waypointId,
            hook: waypoint?.approachLine ?? '',
            waypoint,
          }
        })

      if (!stops.length) return null

      return {
        id: manifestAct.id,
        numeral: manifestAct.numeral,
        title: manifestAct.title ?? meta.title,
        colorKey: manifestAct.id,
        stops,
      }
    })
    .filter(Boolean)
}

export function needsOwnPaceSelection(context) {
  return context.pace === JOURNEY_PACE.OWN && !(context.customWaypointIds?.length > 0)
}

/**
 * Act-grouped tour for the free-preview ghost state - one sample stop unlocked, rest locked.
 * @param {import('./manifest.js').RomeManifest} manifest
 * @param {string} previewWaypointId
 */
export function buildPreviewTourActs(manifest, previewWaypointId = 'w17') {
  if (!manifest?.acts) return []

  // Preview ghost catalog spans the full Eterna set so the free Pantheon sample
  // (w17) is present even though Classic/Antica tiers omit centro stops.
  const context = {
    pace: JOURNEY_PACE.HEROIC,
    path: manifest.journey?.default_path ?? 'a',
  }
  const tourWaypointIds = new Set(getTourWaypointIds(manifest, context))

  return manifest.acts
    .map((manifestAct) => {
      const meta = ACT_META[manifestAct.id] ?? manifestAct
      const stops = manifestAct.waypoints
        .filter((waypointId) => isWaypointId(manifest, waypointId))
        .filter((waypointId) => tourWaypointIds.has(waypointId))
        .map((waypointId) => {
          const waypoint = getWaypoint(manifest, waypointId)
          const isSample = waypointId === previewWaypointId
          return {
            id: waypointId,
            title: waypoint?.title ?? waypointId,
            hook: waypoint?.approachLine ?? waypoint?.arrivalLine ?? '',
            status: isSample ? 'sample' : 'locked',
            waypoint,
            isVisitStop: isVisitStop(waypoint),
          }
        })

      if (!stops.length) return null

      return {
        id: manifestAct.id,
        numeral: manifestAct.numeral,
        title: manifestAct.title ?? meta.title,
        promise: manifestAct.promise ?? meta.promise ?? '',
        colorKey: manifestAct.id,
        locked: false,
        status: 'ahead',
        actStatus: 'ahead',
        stops,
        photoStop: stops[0]?.waypoint ?? null,
      }
    })
    .filter(Boolean)
}

export function summarizePreviewTour(acts) {
  const stops = acts.flatMap((act) => act.stops).filter((stop) => stop.isVisitStop !== false)
  const sample = stops.filter((stop) => stop.status === 'sample').length
  const locked = stops.filter((stop) => stop.status === 'locked').length
  return { sample, locked, total: stops.length, actCount: acts.length }
}
