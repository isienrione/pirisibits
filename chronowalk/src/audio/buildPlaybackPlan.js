import { AUDIO_CATEGORIES } from '../content/audioPaths.js'
import { isInsertEligible } from './insertEligibility.js'
import { INSERT_AFTER_CHAPTER, INSERT_ON_TRANSIT_START } from './insertTiming.js'

function narrationItem(file) {
  return { type: 'narration', file, category: AUDIO_CATEGORIES.NARRATION }
}

function insertItem(insertId, insert) {
  return {
    type: 'insert',
    insertId,
    file: insert.audio,
    category: AUDIO_CATEGORIES.INSERTS,
  }
}

function eligibleInserts(manifest, insertIds, context) {
  const items = []
  for (const insertId of insertIds ?? []) {
    const insert = manifest.inserts?.[insertId]
    if (isInsertEligible(insert, context)) {
      items.push(insertItem(insertId, insert))
    }
  }
  return items
}

function getWaypointRecord(manifest, waypointId) {
  return manifest.waypointsById?.[waypointId] ?? manifest.waypoints?.[waypointId] ?? null
}

function getTransitRecord(manifest, transitId) {
  if (manifest.transits?.find) {
    return manifest.transits.find((t) => t.id === transitId) ?? null
  }
  const raw = manifest.transits?.[transitId]
  return raw ? { id: transitId, ...raw } : null
}

/**
 * Build ordered narration + insert playback plan for a waypoint.
 */
export function buildWaypointPlan(manifest, waypointId, path, context) {
  const waypoint = getWaypointRecord(manifest, waypointId)
  if (!waypoint) return []

  const plan = []
  const chapterInserts = INSERT_AFTER_CHAPTER[waypointId] ?? {}

  waypoint.chapters.forEach((chapter, index) => {
    plan.push(narrationItem(chapter))
    plan.push(...eligibleInserts(manifest, chapterInserts[index], context))
  })

  for (const insertId of waypoint.alt_inserts ?? []) {
    const insert = manifest.inserts?.[insertId]
    if (isInsertEligible(insert, context)) {
      plan.push(insertItem(insertId, insert))
    }
  }

  const outro = waypoint.outro_variants?.[path]
  if (outro) plan.push(narrationItem(outro))

  return plan
}

/**
 * Build playback plan for a transit (shared audio + path variant).
 */
export function buildTransitPlan(manifest, transitId, path, context) {
  const transit = getTransitRecord(manifest, transitId)
  if (!transit) return []

  const plan = [...eligibleInserts(manifest, INSERT_ON_TRANSIT_START[transitId], context)]

  if (transit.audio) plan.push(narrationItem(transit.audio))

  const variant = transit.variants?.[path]
  if (variant) plan.push(narrationItem(variant))

  return plan
}

export function resolveActiveZone(waypointOrTransit, options = {}) {
  if (options.pantheonInterior && waypointOrTransit?.interior_zone) {
    return waypointOrTransit.interior_zone
  }
  return waypointOrTransit?.zone ?? null
}
