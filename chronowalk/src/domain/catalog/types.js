/**
 * Catalog domain contracts — city, product, route, stop, and asset identity.
 * All IDs are opaque strings. Rome is one published city, not a hard-coded axis.
 */

/**
 * @typedef {Object} City
 * @property {string} cityId Stable city identity (e.g. "rome").
 * @property {string} name Human-readable city name.
 * @property {string} [defaultLocale] BCP-47 locale for default content.
 * @property {string} [slug] URL/path slug when distinct from cityId.
 * @property {number} [schemaVersion] City package schema version when packaged.
 */

/**
 * @typedef {Object} TourProduct
 * @property {string} productId Stable purchasable product identity.
 * @property {string} cityId Owning city.
 * @property {string} name Human-readable product name.
 * @property {string[]} [routeIds] Routes included with this product.
 * @property {string} [description]
 */

/**
 * A stop's place on a route. Display order is not identity.
 *
 * @typedef {Object} RouteStopReference
 * @property {string} stopId Referenced stop identity.
 * @property {number} displayOrder Zero-based order for this route only.
 * @property {boolean} [optional] Whether the stop may be skipped.
 */

/**
 * @typedef {Object} Route
 * @property {string} routeId Stable route identity.
 * @property {string} cityId Owning city.
 * @property {string} [productId] Primary product that sells this route.
 * @property {string} name Human-readable route name.
 * @property {RouteStopReference[]} stops Ordered stop references for this route.
 */

/**
 * @typedef {Object} Stop
 * @property {string} stopId Stable stop identity (independent of route position).
 * @property {string} cityId Owning city.
 * @property {string} [name] Default display name.
 * @property {{ lat: number, lng: number }} [location] Approximate coordinates.
 */

/**
 * Localized narrative / copy for a stop.
 *
 * @typedef {Object} StopLocaleContent
 * @property {string} contentId Stable content identity.
 * @property {string} stopId Parent stop.
 * @property {string} locale BCP-47 locale.
 * @property {string} [title]
 * @property {string} [body]
 * @property {string[]} [assetIds] Related assets for this locale.
 */

/**
 * @typedef {Object} AssetReference
 * @property {string} assetId Stable asset identity.
 * @property {string} kind Asset kind (e.g. "audio", "image", "video", "transcript").
 * @property {string} [url] Remote or CDN URL when known.
 * @property {string} [path] Package-relative path when known.
 * @property {string} [mimeType]
 */

/** Generic ID field names used by catalog contracts (no city-specific fields). */
export const CATALOG_ID_FIELDS = Object.freeze([
  'cityId',
  'productId',
  'routeId',
  'stopId',
  'contentId',
  'assetId',
])

/**
 * @param {City} city
 * @returns {city is City}
 */
export function isCity(city) {
  return (
    !!city &&
    typeof city === 'object' &&
    typeof city.cityId === 'string' &&
    city.cityId.length > 0 &&
    typeof city.name === 'string'
  )
}

/**
 * @param {TourProduct} product
 * @returns {product is TourProduct}
 */
export function isTourProduct(product) {
  return (
    !!product &&
    typeof product === 'object' &&
    typeof product.productId === 'string' &&
    product.productId.length > 0 &&
    typeof product.cityId === 'string' &&
    product.cityId.length > 0 &&
    typeof product.name === 'string'
  )
}

/**
 * @param {RouteStopReference} ref
 * @returns {ref is RouteStopReference}
 */
export function isRouteStopReference(ref) {
  return (
    !!ref &&
    typeof ref === 'object' &&
    typeof ref.stopId === 'string' &&
    ref.stopId.length > 0 &&
    typeof ref.displayOrder === 'number' &&
    Number.isFinite(ref.displayOrder)
  )
}

/**
 * @param {Route} route
 * @returns {route is Route}
 */
export function isRoute(route) {
  return (
    !!route &&
    typeof route === 'object' &&
    typeof route.routeId === 'string' &&
    route.routeId.length > 0 &&
    typeof route.cityId === 'string' &&
    route.cityId.length > 0 &&
    typeof route.name === 'string' &&
    Array.isArray(route.stops) &&
    route.stops.every(isRouteStopReference)
  )
}

/**
 * @param {Stop} stop
 * @returns {stop is Stop}
 */
export function isStop(stop) {
  return (
    !!stop &&
    typeof stop === 'object' &&
    typeof stop.stopId === 'string' &&
    stop.stopId.length > 0 &&
    typeof stop.cityId === 'string' &&
    stop.cityId.length > 0
  )
}

/**
 * @param {StopLocaleContent} content
 * @returns {content is StopLocaleContent}
 */
export function isStopLocaleContent(content) {
  return (
    !!content &&
    typeof content === 'object' &&
    typeof content.contentId === 'string' &&
    content.contentId.length > 0 &&
    typeof content.stopId === 'string' &&
    content.stopId.length > 0 &&
    typeof content.locale === 'string' &&
    content.locale.length > 0
  )
}

/**
 * @param {AssetReference} asset
 * @returns {asset is AssetReference}
 */
export function isAssetReference(asset) {
  return (
    !!asset &&
    typeof asset === 'object' &&
    typeof asset.assetId === 'string' &&
    asset.assetId.length > 0 &&
    typeof asset.kind === 'string' &&
    asset.kind.length > 0
  )
}
