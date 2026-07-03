import rawManifest from './rome/manifest.json'
import { parseRomeManifest } from './manifest.schema.js'

let cachedManifest = null

export function loadRomeManifest() {
  if (cachedManifest) return cachedManifest
  cachedManifest = normalizeManifest(parseRomeManifest(rawManifest))
  return cachedManifest
}

export function clearRomeManifestCache() {
  cachedManifest = null
}

function normalizeManifest(manifest) {
  const waypointsById = manifest.waypoints
  const defaultPath = manifest.journey.default_path
  const sequence = manifest.journey.sequences[defaultPath] ?? []

  const waypointOrder = sequence.filter((id) => waypointsById[id])
  const waypoints = waypointOrder.map((id) => ({
    id,
    name: waypointsById[id].title,
    ...waypointsById[id],
  }))

  const transits = Object.entries(manifest.transits).map(([id, transit]) => ({
    id,
    ...transit,
  }))

  return {
    ...manifest,
    waypointsById,
    waypoints,
    transits,
  }
}

export function getWaypoint(manifest, waypointId) {
  const waypoint = manifest.waypointsById?.[waypointId] ?? manifest.waypoints?.find((w) => w.id === waypointId)
  if (!waypoint) return null
  return waypoint.id ? waypoint : { id: waypointId, ...waypoint }
}

export function getWaypointByIndex(manifest, index) {
  const waypoint = manifest.waypoints?.[index]
  if (!waypoint) return null
  return getWaypoint(manifest, waypoint.id ?? waypoint)
}

export function getTransitAfter(manifest, waypointId) {
  return manifest.transits?.find((transit) => transit.after === waypointId) ?? null
}

export function getTransit(manifest, transitId) {
  if (manifest.transits?.find) {
    const fromArray = manifest.transits.find((t) => t.id === transitId)
    if (fromArray) return fromArray
  }
  const raw = manifest.transits?.[transitId]
  return raw ? { id: transitId, ...raw } : null
}

export function orderedWaypointIds(manifest) {
  return manifest.waypoints?.map((waypoint) => waypoint.id) ?? []
}

export function getTraversalSequence(manifest, path = manifest.journey?.default_path ?? 'a') {
  return manifest.journey?.sequences?.[path] ?? []
}

export function isTransitId(manifest, stepId) {
  return Boolean(manifest.transits?.find?.((transit) => transit.id === stepId) ?? manifest.transits?.[stepId])
}

export function isWaypointId(manifest, stepId) {
  return Boolean(manifest.waypointsById?.[stepId] ?? manifest.waypoints?.[stepId])
}

export function getStepIdAtIndex(manifest, path, index) {
  const sequence = getTraversalSequence(manifest, path)
  return sequence[index] ?? null
}

export function resolveJourneyStep(manifest, path, sequenceIndex) {
  const stepId = getStepIdAtIndex(manifest, path, sequenceIndex)
  if (!stepId) {
    return { done: true, id: null, type: null, record: null, targetWaypoint: null }
  }

  if (isWaypointId(manifest, stepId)) {
    const record = getWaypoint(manifest, stepId)
    return {
      done: false,
      id: stepId,
      type: 'waypoint',
      record,
      targetWaypoint: record,
    }
  }

  const record = getTransit(manifest, stepId)
  const nextStepId = getStepIdAtIndex(manifest, path, sequenceIndex + 1)
  const targetWaypoint = nextStepId && isWaypointId(manifest, nextStepId)
    ? getWaypoint(manifest, nextStepId)
    : null

  return {
    done: false,
    id: stepId,
    type: 'transit',
    record,
    targetWaypoint,
    needsPathChoice: Boolean(record?.choice),
  }
}

export function getAct(manifest, actId) {
  return manifest.acts?.find((act) => act.id === actId) ?? null
}

export function getWaypointIndex(manifest, waypointId) {
  return orderedWaypointIds(manifest).indexOf(waypointId)
}

export { parseRomeManifest } from './manifest.schema.js'
export { collectManifestAudioPaths } from './audioPaths.js'
