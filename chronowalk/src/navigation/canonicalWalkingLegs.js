/**
 * Canonical Rome walking legs — Milestone 1 offline navigation package.
 *
 * Online: Mapbox Directions remains preferred for GPS→destination freshness.
 * Offline / no-token: packaged stop→stop legs (geometry + distance + ETA + steps).
 *
 * Package completeness requires REAL Mapbox-captured walking geometry for every
 * authored leg. Temporary straight-line fallbacks may still be looked up for
 * degraded guidance, but must NOT mark navigation offline readiness as READY.
 */

import packageData from '../content/rome/canonicalWalkingLegs.json'
import {
  assessCanonicalWalkingPackage,
  isRealWalkingLeg,
  isTemporaryFallbackLeg,
} from './canonicalWalkingLegValidation.js'

export const CANONICAL_LEGS_VERSION = packageData.version

export const CANONICAL_LEG_MISSING_COPY =
  'Offline route for this leg isn’t prepared yet.'

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
 * True when the package file contains at least one stop→stop entry.
 * Does NOT mean real walking geometry is complete.
 * @returns {boolean}
 */
export function areCanonicalRomeLegsPackaged() {
  const legs = packageData.legs
  return Boolean(legs && typeof legs === 'object' && Object.keys(legs).length > 0)
}

/**
 * True only when every authored Rome leg has validated real walking geometry.
 * Straight-line-only packages return false.
 * @returns {boolean}
 */
export function areCanonicalRomeWalkingRoutesComplete() {
  if (typeof packageData.completeness?.complete === 'boolean') {
    if (!packageData.completeness.complete) return false
  }
  const assessment = assessCanonicalWalkingPackage(packageData)
  return assessment.complete
}

/**
 * @deprecated Prefer areCanonicalRomeWalkingRoutesComplete for readiness.
 * Kept as an alias of package presence for older call sites that only need
 * "is the JSON present"; readiness code must use the complete check.
 * @returns {boolean}
 */
export function areCanonicalRomeLegsPrepared() {
  return areCanonicalRomeWalkingRoutesComplete()
}

/**
 * Lookup a packaged stop→stop leg (including temporary fallbacks).
 *
 * @param {{ tourId?: string, fromId?: string, toId?: string, originStopId?: string, destinationStopId?: string }} params
 */
export function getCanonicalWalkingLeg({
  tourId,
  fromId,
  toId,
  originStopId,
  destinationStopId,
} = {}) {
  const origin = fromId || originStopId
  const destination = toId || destinationStopId
  if (!origin || !destination) return null
  if (tourId && !isCanonicalTourSupported(tourId)) return null

  const leg = packageData.legs?.[legKey(origin, destination)]
  if (!leg?.steps?.length) return null

  const distanceMeters = leg.distanceMeters ?? leg.distanceM ?? 0
  const durationSeconds = leg.durationSeconds ?? leg.durationSec ?? 0

  return {
    originStopId: leg.originStopId ?? leg.fromId,
    destinationStopId: leg.destinationStopId ?? leg.toId,
    fromId: leg.fromId ?? leg.originStopId,
    toId: leg.toId ?? leg.destinationStopId,
    steps: leg.steps,
    geometry: leg.geometry ?? null,
    distanceM: distanceMeters,
    durationSec: durationSeconds,
    distanceMeters,
    durationSeconds,
    source: /** @type {const} */ ('canonical-leg'),
    legSource: leg.source ?? null,
    version: packageData.version,
    geometryKind: leg.geometryKind ?? packageData.geometryKindDefault,
    productDebt: Boolean(leg.productDebt) || isTemporaryFallbackLeg(leg),
    validationStatus: leg.validationStatus ?? null,
    isRealWalking: isRealWalkingLeg(leg),
    fromTitle: leg.fromTitle,
    toTitle: leg.toTitle,
  }
}

/**
 * @returns {{
 *   version: string,
 *   legCount: number,
 *   tourId: string,
 *   productDebtLegCount: number,
 *   allLegsUseTemporaryFallbackGeometry: boolean,
 *   realWalkingLegCount: number,
 *   complete: boolean,
 * }}
 */
export function getCanonicalWalkingLegsMeta() {
  const assessment = assessCanonicalWalkingPackage(packageData)
  const debtKeys = packageData.productDebt?.legKeys
  return {
    version: packageData.version,
    tourId: packageData.tourId,
    legCount: assessment.legCount || Object.keys(packageData.legs ?? {}).length,
    productDebtLegCount: Array.isArray(debtKeys)
      ? debtKeys.length
      : assessment.temporaryFallbackLegCount,
    allLegsUseTemporaryFallbackGeometry: Boolean(
      packageData.productDebt?.allLegsUseTemporaryFallbackGeometry ??
        (assessment.temporaryFallbackLegCount === assessment.legCount &&
          assessment.legCount > 0),
    ),
    realWalkingLegCount: assessment.realWalkingLegCount,
    complete: assessment.complete,
  }
}

/**
 * List leg keys that still use temporary fallback geometry (product debt).
 * @returns {string[]}
 */
export function listTemporaryFallbackLegKeys() {
  if (Array.isArray(packageData.productDebt?.legKeys)) {
    return [...packageData.productDebt.legKeys]
  }
  return Object.entries(packageData.legs ?? {})
    .filter(([, leg]) => isTemporaryFallbackLeg(leg))
    .map(([key]) => key)
}

export {
  assessCanonicalWalkingPackage,
  isRealWalkingLeg,
  isTemporaryFallbackLeg,
}

export default {
  getCanonicalWalkingLeg,
  isCanonicalTourSupported,
  areCanonicalRomeLegsPackaged,
  areCanonicalRomeLegsPrepared,
  areCanonicalRomeWalkingRoutesComplete,
  getCanonicalWalkingLegsMeta,
  listTemporaryFallbackLegKeys,
  CANONICAL_LEGS_VERSION,
  CANONICAL_LEG_MISSING_COPY,
}
