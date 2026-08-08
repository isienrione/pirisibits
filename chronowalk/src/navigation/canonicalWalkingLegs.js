/**
 * Canonical Rome walking legs — Milestone 1 offline navigation package.
 *
 * Online: Mapbox Directions remains preferred for GPS→destination freshness.
 * Offline / no-token: packaged stop→stop legs (geometry + distance + ETA + steps).
 *
 * Geometry is authored from stop coordinates (not street-routed). That is intentional
 * for Milestone 1 — useful guidance without a dynamic offline router or paid precompute.
 */

import packageData from '../content/rome/canonicalWalkingLegs.json'

export const CANONICAL_LEGS_VERSION = packageData.version

function legKey(fromId, toId) {
  return `${fromId}->${toId}`
}

/**
 * @param {string} tourId
 * @returns {boolean}
 */
export function isCanonicalTourSupported(tourId) {
  if (!tourId) return false
  const id = String(tourId).toLowerCase()
  return id === 'rome' || id === packageData.tourId || id === packageData.cityId
}

/**
 * Lookup a packaged stop→stop leg.
 *
 * @param {{ tourId?: string, fromId?: string, toId?: string }} params
 * @returns {null | {
 *   fromId: string,
 *   toId: string,
 *   steps: object[],
 *   geometry: object,
 *   distanceM: number,
 *   durationSec: number,
 *   source: 'canonical-leg',
 *   version: string,
 * }}
 */
export function getCanonicalWalkingLeg({ tourId, fromId, toId } = {}) {
  if (!fromId || !toId) return null
  if (tourId && !isCanonicalTourSupported(tourId)) return null

  const leg = packageData.legs?.[legKey(fromId, toId)]
  if (!leg?.steps?.length) return null

  return {
    fromId: leg.fromId,
    toId: leg.toId,
    steps: leg.steps,
    geometry: leg.geometry ?? null,
    distanceM: leg.distanceM ?? 0,
    durationSec: leg.durationSec ?? 0,
    source: /** @type {const} */ ('canonical-leg'),
    version: packageData.version,
    fromTitle: leg.fromTitle,
    toTitle: leg.toTitle,
  }
}

/**
 * @returns {{ version: string, legCount: number, tourId: string }}
 */
export function getCanonicalWalkingLegsMeta() {
  return {
    version: packageData.version,
    tourId: packageData.tourId,
    legCount: Object.keys(packageData.legs ?? {}).length,
  }
}

export default {
  getCanonicalWalkingLeg,
  isCanonicalTourSupported,
  getCanonicalWalkingLegsMeta,
  CANONICAL_LEGS_VERSION,
}
