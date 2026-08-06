/**
 * Native vs web root-entry decision helpers.
 * Does not replace AppRouter — callers wrap the `/` route only.
 */

import { isNativePlatform, isNativeIOS } from '../platform/runtime/index.js'
import { getPublishedCities, getCityById, getRomePreviewStopId } from '../catalog/index.js'
import {
  listCommerceProducts,
  getCityIdForProduct,
  getSkuEntitlementShape,
} from '../commerce/commerceCatalog.js'
import { getActiveWalkPath } from '../lib/appEntry.js'
import { isResumableJourney, getJourneySnapshot } from '../state/journey.js'

/** Preferred display order for Rome solo SKUs on the native product list. */
const SOLO_PRODUCT_ORDER = Object.freeze([
  'rome-complete',
  'rome-essential',
  'rome-central',
])

/**
 * True when the Capacitor native shell should use the app home instead of
 * the public marketing landing page.
 *
 * @returns {boolean}
 */
export function shouldUseNativeAppEntry() {
  return isNativePlatform()
}

/**
 * @returns {boolean}
 */
export function isNativeIosAppEntry() {
  return isNativeIOS()
}

/**
 * Free Pantheon (or city preview) path for a published city.
 * Rome uses the existing `/preview` journey preview (Pantheon).
 *
 * @param {string} cityId
 * @returns {string | null}
 */
export function getNativeFreePreviewPath(cityId) {
  if (!cityId) return null
  // Rome preview stop is Pantheon exterior (w17) — live path is `/preview`.
  if (cityId === 'rome' && getRomePreviewStopId()) {
    return '/preview'
  }
  // Future cities: no free-preview route until catalog declares one.
  return null
}

/**
 * Solo commerce products for a city (excludes Couple/Family bundles).
 * Derived from the launch catalog + city id — not a hard-coded Rome list.
 *
 * @param {string} cityId
 * @returns {object[]}
 */
export function listNativeSoloProductsForCity(cityId) {
  if (!cityId) return []
  const products = listCommerceProducts().filter((product) => {
    if (product.kind && product.kind !== 'solo') return false
    return getCityIdForProduct(product.productId) === cityId
  })

  return [...products].sort((a, b) => {
    const ai = SOLO_PRODUCT_ORDER.indexOf(a.productId)
    const bi = SOLO_PRODUCT_ORDER.indexOf(b.productId)
    const ao = ai === -1 ? 999 : ai
    const bo = bi === -1 ? 999 : bi
    if (ao !== bo) return ao - bo
    return String(a.productId).localeCompare(String(b.productId))
  })
}

/**
 * Build the native entry view-model from the runtime catalog.
 *
 * @param {{
 *   cities?: ReturnType<typeof getPublishedCities>,
 *   journeySnapshot?: object | null,
 *   selectedCityId?: string | null,
 * }} [options]
 */
export function getNativeEntryModel(options = {}) {
  const cities = options.cities ?? getPublishedCities()
  const published = Array.isArray(cities) ? cities.filter(Boolean) : []

  if (published.length === 0) {
    return {
      ok: false,
      code: 'no_published_cities',
      mode: 'empty',
      cities: [],
      city: null,
      products: [],
      continueWalk: null,
      freePreviewPath: null,
      message: 'No published cities are available yet.',
    }
  }

  // One city → present it directly (Rome today). Multiple → city picker mode
  // without Rome-specific branching.
  let city = null
  let mode = 'city_home'

  if (published.length === 1) {
    city = published[0]
    mode = 'city_home'
  } else if (options.selectedCityId) {
    city =
      published.find((c) => c.cityId === options.selectedCityId) ??
      getCityById(options.selectedCityId)
    mode = city ? 'city_home' : 'city_list'
    if (!city) {
      return {
        ok: false,
        code: 'unknown_city',
        mode: 'city_list',
        cities: published,
        city: null,
        products: [],
        continueWalk: null,
        freePreviewPath: null,
        message: `Unknown city: ${options.selectedCityId}`,
      }
    }
  } else {
    mode = 'city_list'
  }

  if (mode === 'city_list') {
    return {
      ok: true,
      code: null,
      mode: 'city_list',
      cities: published,
      city: null,
      products: [],
      continueWalk: null,
      freePreviewPath: null,
      message: null,
    }
  }

  const products = listNativeSoloProductsForCity(city.cityId)
  const journeySnapshot =
    options.journeySnapshot !== undefined
      ? options.journeySnapshot
      : typeof window === 'undefined'
        ? null
        : getJourneySnapshot()

  const resumable = isResumableJourney(journeySnapshot ?? { state: 'idle', context: {} })
  const continueWalk = resumable
    ? {
        available: true,
        path: getActiveWalkPath({ journeySnapshot }),
        cityId: city.cityId,
      }
    : { available: false, path: null, cityId: city.cityId }

  return {
    ok: true,
    code: null,
    mode: 'city_home',
    cities: published,
    city,
    products,
    continueWalk,
    freePreviewPath: getNativeFreePreviewPath(city.cityId),
    message: null,
  }
}

/**
 * Resolve a product row for display (name from commerce SKU shape).
 *
 * @param {string} productId
 */
export function describeNativeProduct(productId) {
  const sku = getSkuEntitlementShape(productId)
  if (!sku) return null
  const catalog = listCommerceProducts().find((p) => p.productId === productId)
  return {
    productId: sku.productId,
    contentProductId: sku.contentProductId,
    name: catalog?.name ?? productId,
    kind: sku.kind,
    seatLimit: sku.seatLimit,
    // Never treat catalog cents as StoreKit localized price.
    amountCents: null,
    marketingAmountCents: catalog?.amountCents ?? null,
  }
}
