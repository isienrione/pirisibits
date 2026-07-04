import { HEART_OF_ANCIENT_ROME_TOUR } from '../data/heart-of-ancient-rome-tour'
import { buildStopFromLegacy } from './legacyStopAdapter'
import { assertManifestStopShape } from './manifest.schema'

/** @type {import('./manifest.schema.js').RomeTourManifest | null} */
let cachedManifest = null

function buildManifest() {
  const stopOrder = [...HEART_OF_ANCIENT_ROME_TOUR.stopIds]

  const stops = stopOrder.map((stopId, index) => {
    const stop = buildStopFromLegacy(stopId, index, stopOrder[index + 1] ?? null)
    assertManifestStopShape(stop)
    return stop
  })

  const stopsById = Object.fromEntries(stops.map((stop) => [stop.id, stop]))

  return {
    id: 'rome-launch',
    title: HEART_OF_ANCIENT_ROME_TOUR.title,
    subtitle: HEART_OF_ANCIENT_ROME_TOUR.subtitle,
    stopOrder,
    stops,
    stopsById,
  }
}

/** Single entry point for the Rome launch tour manifest. */
export function loadRomeTourManifest() {
  if (!cachedManifest) {
    cachedManifest = buildManifest()
  }
  return cachedManifest
}

export function clearRomeTourManifestCache() {
  cachedManifest = null
}

/** @param {import('./manifest.schema.js').RomeTourManifest} manifest */
export function getStopById(manifest, stopId) {
  if (!manifest || !stopId) return null
  return manifest.stopsById[stopId] ?? null
}

/** @param {import('./manifest.schema.js').RomeTourManifest} manifest */
export function getStopByIndex(manifest, index) {
  if (!manifest || !Number.isFinite(index)) return null
  return manifest.stops[index] ?? null
}

/**
 * Resolve the active stop from journey context.
 * @param {import('./manifest.schema.js').RomeTourManifest} manifest
 * @param {{ currentStopId?: string | null, currentStopIndex?: number }} context
 */
export function getCurrentStop(manifest, context) {
  if (!manifest || !context) return null

  if (context.currentStopId) {
    const byId = getStopById(manifest, context.currentStopId)
    if (byId) return byId
  }

  if (Number.isFinite(context.currentStopIndex)) {
    return getStopByIndex(manifest, context.currentStopIndex)
  }

  return null
}

export function getFirstStop(manifest = loadRomeTourManifest()) {
  return manifest.stops[0] ?? null
}
