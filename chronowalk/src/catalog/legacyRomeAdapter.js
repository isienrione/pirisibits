/**
 * Legacy Rome adapter — translates current runtime IDs into catalog IDs.
 *
 * Does not fork Rome journey logic. Callers still use loadRomeManifest() until
 * a later cutover; this adapter only bridges identifiers and package fields.
 *
 * Source of truth for package entities: src/content/cities/rome/
 * Runtime journey engine still reads: src/content/rome/manifest.json
 * (synced from the city package — one editable truth).
 */

import { getPublishedPackage } from './cityRegistry.js'
import { findProductById, listProductsForCity } from './productRegistry.js'
import { findRouteById, listRoutesForProduct } from './routeRegistry.js'
import { findStopById } from './stopRegistry.js'

/** City id for the first published city. */
export const ROME_CITY_ID = 'rome'

/** Canonical package product for the live Rome journey. */
export const ROME_PACKAGE_PRODUCT_ID = 'rome-eternal'

/** Path key → package routeId */
export const ROME_PATH_ROUTE_IDS = Object.freeze({
  a: 'rome-eternal-main',
  b: 'rome-eternal-path-b',
})

/**
 * Marketing / launch / entitlement product ids → package productId.
 * Commerce SKUs remain separate; this only resolves catalog identity.
 */
export const LEGACY_PRODUCT_ALIASES = Object.freeze({
  'rome-eternal': ROME_PACKAGE_PRODUCT_ID,
  'rome-complete': ROME_PACKAGE_PRODUCT_ID,
  'rome-essential': ROME_PACKAGE_PRODUCT_ID,
  'rome-central': ROME_PACKAGE_PRODUCT_ID,
  'rome-couple': ROME_PACKAGE_PRODUCT_ID,
  'rome-family': ROME_PACKAGE_PRODUCT_ID,
  'heart-of-ancient-rome': ROME_PACKAGE_PRODUCT_ID,
  'roman-forum': ROME_PACKAGE_PRODUCT_ID,
  'rome-forum-cluster': ROME_PACKAGE_PRODUCT_ID,
  'rome-city': ROME_PACKAGE_PRODUCT_ID,
})

/**
 * Legacy tour-registry ids → preferred path route.
 * Full journey cutover is PR4+; mapping is identity bridge only.
 */
export const LEGACY_TOUR_ROUTE_ALIASES = Object.freeze({
  'central-rome': ROME_PATH_ROUTE_IDS.a,
  'rome-antica': ROME_PATH_ROUTE_IDS.a,
  'rome-core': ROME_PATH_ROUTE_IDS.a,
  'roman-forum': ROME_PATH_ROUTE_IDS.a,
  'heart-of-ancient-rome': ROME_PATH_ROUTE_IDS.a,
})

/**
 * Kebab / marketing waypoint slugs → manifest stopIds.
 * Mirrors the live debug alias table for catalog resolution.
 */
export const LEGACY_STOP_ALIASES = Object.freeze({
  colosseum: 'w01',
  'colosseum-interior': 'w02',
  'arch-of-titus': 'w03',
  'arch-titus': 'w03',
  palatine: 'w04',
  'palatine-hill': 'w04',
  'basilica-of-maxentius': 'w06',
  'via-sacra': 'w07',
  'temple-of-vesta': 'w08',
  pause: 'pause',
  'forum-rest': 'pause',
  quinoa: 'pause',
  rostra: 'w10',
  bidasoa: 'w11_12',
  'heart-of-the-forum': 'w11_12',
  'capitoline-hill': 'w13',
  capitoline: 'w13',
  'trajans-market': 'w14',
  'trajan-market': 'w14',
  'spanish-steps': 'w15',
  'fontana-di-trevi': 'w16',
  trevi: 'w16',
  pantheon: 'w17',
  'pantheon-exterior': 'w17',
  'pantheon-interior': 'w23',
  'circus-maximus': 'enc_circus',
  'circus-maximus-view': 'enc_circus',
  circus: 'enc_circus',
  'piazza-navona': 'w18',
  navona: 'w18',
  'campo-de-fiori': 'w19',
  'largo-argentina': 'w20',
  argentina: 'w20',
  'castel-sant-angelo': 'w21',
  castel: 'w21',
  'via-appia': 'w22',
  'via-appia-antica': 'w22',
  'curia-julia': 'w11_12',
})

/**
 * @param {string} value
 */
function normalizeSlug(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
}

/**
 * @returns {import('../content/cityPackage/paths.js').CityPackage | null}
 */
export function getRomePackage() {
  return getPublishedPackage(ROME_CITY_ID)
}

/**
 * Live-shape manifest from the Rome city package (SSOT).
 * Identical to src/content/rome/manifest.json when packages are in sync.
 *
 * @returns {object | null}
 */
export function getRomeRuntimeManifest() {
  return getRomePackage()?.manifest ?? null
}

/**
 * Resolve a legacy or canonical stop / waypoint id to a package stopId.
 *
 * @param {string} legacyId
 * @returns {string | null}
 */
export function resolveLegacyStopId(legacyId) {
  if (!legacyId) return null
  if (findStopById(legacyId, ROME_CITY_ID)) return legacyId

  const slug = normalizeSlug(legacyId)
  const aliased = LEGACY_STOP_ALIASES[slug]
  if (aliased && findStopById(aliased, ROME_CITY_ID)) return aliased

  return null
}

/** @type {typeof resolveLegacyStopId} */
export const resolveLegacyWaypoint = resolveLegacyStopId

/**
 * Resolve legacy path/tour/route references to a package routeId.
 *
 * @param {string} legacyRef
 * @returns {string | null}
 */
export function resolveLegacyRoute(legacyRef) {
  if (!legacyRef) return null
  if (findRouteById(legacyRef)) return legacyRef

  const key = normalizeSlug(legacyRef)

  if (key === 'a' || key === 'path-a' || key === 'main' || key === 'default') {
    return ROME_PATH_ROUTE_IDS.a
  }
  if (key === 'b' || key === 'path-b') {
    return ROME_PATH_ROUTE_IDS.b
  }

  if (ROME_PATH_ROUTE_IDS[key]) return ROME_PATH_ROUTE_IDS[key]

  if (LEGACY_TOUR_ROUTE_ALIASES[key]) return LEGACY_TOUR_ROUTE_ALIASES[key]

  const products = listProductsForCity(ROME_CITY_ID)
  for (const product of products) {
    const routes = listRoutesForProduct(product.productId)
    const match = routes.find(
      (r) =>
        r.routeId === legacyRef ||
        r.pathKey === key ||
        normalizeSlug(r.name) === key,
    )
    if (match) return match.routeId
  }

  return null
}

/**
 * Resolve launch / landing / entitlement product ids to the package productId.
 *
 * @param {string} legacyProductId
 * @returns {string | null}
 */
export function resolveLegacyProductId(legacyProductId) {
  if (!legacyProductId) return null
  if (findProductById(legacyProductId)) return legacyProductId

  const key = normalizeSlug(legacyProductId)
  const aliased = LEGACY_PRODUCT_ALIASES[key]
  if (aliased && findProductById(aliased)) return aliased

  return null
}

/**
 * Preview narration file from the Rome package/system block.
 * @returns {string | null}
 */
export function getRomePreviewAudio() {
  const pkg = getRomePackage()
  return pkg?.city?.system?.preview ?? pkg?.manifest?.system?.preview ?? null
}

/**
 * Preview is Pantheon exterior (w17) — derived from preview audio `w17_ch1.mp3`
 * and the live free-sample stop. Not a forked rule: package asset naming + stop id.
 *
 * @returns {string | null}
 */
export function getRomePreviewStopId() {
  const audio = getRomePreviewAudio()
  if (!audio) return null
  const match = /^([a-z0-9_]+)_ch/i.exec(audio)
  if (match && findStopById(match[1], ROME_CITY_ID)) return match[1]
  // Stable fallback used by the live free Pantheon preview.
  if (findStopById('w17', ROME_CITY_ID)) return 'w17'
  return null
}

/**
 * Optional stop ids for a journey path (from live manifest journey.optional_waypoints).
 *
 * @param {string} [pathKey='a']
 * @returns {string[]}
 */
export function getRomeOptionalStopIds(pathKey = 'a') {
  const manifest = getRomeRuntimeManifest()
  const optional = manifest?.journey?.optional_waypoints?.[pathKey]
  return Array.isArray(optional) ? [...optional] : []
}

/**
 * Progress keys use stopIds — same strings as the live journey.
 * Adapter documents the bridge; no remapping required for Rome today.
 *
 * @param {string} progressStopRef
 * @returns {string | null}
 */
export function resolveLegacyProgressStopRef(progressStopRef) {
  return resolveLegacyStopId(progressStopRef)
}
