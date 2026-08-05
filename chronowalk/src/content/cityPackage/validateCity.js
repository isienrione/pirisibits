/**
 * Generic city-package validation.
 */

/**
 * @typedef {Object} ValidationIssue
 * @property {'error' | 'warning'} severity
 * @property {string} code
 * @property {string} message
 * @property {string} [path]
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} ok
 * @property {ValidationIssue[]} issues
 */

/**
 * @param {import('./paths.js').CityPackage} pkg
 * @returns {ValidationResult}
 */
export function validateCity(pkg) {
  /** @type {ValidationIssue[]} */
  const issues = []
  const push = (severity, code, message, path) => {
    issues.push({ severity, code, message, path })
  }
  const error = (code, message, path) => push('error', code, message, path)
  const warn = (code, message, path) => push('warning', code, message, path)

  const { metadata, city, products, routes, stops, assets, manifest, locales, validationRules } =
    pkg

  if (!metadata || typeof metadata !== 'object') {
    error('missing_metadata', 'metadata/package.json is required')
  } else {
    if (metadata.cityPackageSchemaVersion !== 1 && metadata.schemaVersion !== 1) {
      error(
        'schema_mismatch',
        `Unsupported city package schema version: ${metadata.cityPackageSchemaVersion ?? metadata.schemaVersion}`,
        'metadata.cityPackageSchemaVersion',
      )
    }
    if (metadata.catalogSchemaVersion != null && metadata.catalogSchemaVersion !== 1) {
      error(
        'schema_mismatch',
        `Unsupported catalog schema version: ${metadata.catalogSchemaVersion}`,
        'metadata.catalogSchemaVersion',
      )
    }
    if (metadata.manifestSchemaVersion != null && metadata.manifestSchemaVersion !== 1) {
      error(
        'schema_mismatch',
        `Unsupported manifest schema version: ${metadata.manifestSchemaVersion}`,
        'metadata.manifestSchemaVersion',
      )
    }
  }

  if (!city?.cityId || typeof city.cityId !== 'string') {
    error('missing_city_id', 'city.cityId must be a non-empty string', 'city.cityId')
  }
  if (!city?.name) {
    error('missing_city_name', 'city.name is required', 'city.name')
  }

  if (!Array.isArray(products) || products.length === 0) {
    error('missing_products', 'products.json must list at least one product', 'products')
  }

  if (!Array.isArray(stops) || stops.length === 0) {
    error('missing_stops', 'stops.json must list at least one stop', 'stops')
  }

  if (!Array.isArray(routes) || routes.length === 0) {
    error('missing_routes', 'routes.json must list at least one route', 'routes')
  }

  if (!Array.isArray(assets)) {
    error('missing_assets', 'assets.json must be an array', 'assets')
  }

  const stopIds = new Set()
  for (const stop of stops ?? []) {
    if (!stop?.stopId || typeof stop.stopId !== 'string') {
      error('invalid_stop', 'stop.stopId must be a string', 'stops')
      continue
    }
    if (stopIds.has(stop.stopId)) {
      error('duplicate_id', `Duplicate stopId "${stop.stopId}"`, `stops.${stop.stopId}`)
    }
    stopIds.add(stop.stopId)

    if (stop.cityId && city?.cityId && stop.cityId !== city.cityId) {
      error(
        'city_mismatch',
        `Stop "${stop.stopId}" cityId "${stop.cityId}" does not match package city "${city.cityId}"`,
        `stops.${stop.stopId}.cityId`,
      )
    }

    const lat = stop.location?.lat ?? stop.geofence?.lat
    const lng = stop.location?.lng ?? stop.geofence?.lng
    if (validationRules?.requireCoordinates !== false) {
      if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng)) {
        error(
          'invalid_coordinates',
          `Stop "${stop.stopId}" is missing valid coordinates`,
          `stops.${stop.stopId}.location`,
        )
      } else if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        error(
          'invalid_coordinates',
          `Stop "${stop.stopId}" has out-of-range coordinates (${lat}, ${lng})`,
          `stops.${stop.stopId}.location`,
        )
      }
    }
  }

  const productIds = new Set()
  for (const product of products ?? []) {
    if (!product?.productId || typeof product.productId !== 'string') {
      error('invalid_product', 'product.productId must be a string', 'products')
      continue
    }
    if (productIds.has(product.productId)) {
      error('duplicate_id', `Duplicate productId "${product.productId}"`, `products.${product.productId}`)
    }
    productIds.add(product.productId)
    if (product.cityId && city?.cityId && product.cityId !== city.cityId) {
      error(
        'city_mismatch',
        `Product "${product.productId}" cityId mismatch`,
        `products.${product.productId}.cityId`,
      )
    }
  }

  const routeIds = new Set()
  const stopsReferencedByRoutes = new Set()
  for (const route of routes ?? []) {
    if (!route?.routeId || typeof route.routeId !== 'string') {
      error('invalid_route', 'route.routeId must be a string', 'routes')
      continue
    }
    if (routeIds.has(route.routeId)) {
      error('duplicate_id', `Duplicate routeId "${route.routeId}"`, `routes.${route.routeId}`)
    }
    routeIds.add(route.routeId)

    if (route.productId && !productIds.has(route.productId)) {
      error(
        'broken_route_reference',
        `Route "${route.routeId}" references missing product "${route.productId}"`,
        `routes.${route.routeId}.productId`,
      )
    }

    const orders = new Set()
    for (const ref of route.stops ?? []) {
      if (!ref?.stopId) {
        error('broken_route_reference', `Route "${route.routeId}" has a stop without stopId`, `routes.${route.routeId}.stops`)
        continue
      }
      if (!stopIds.has(ref.stopId)) {
        error(
          'broken_route_reference',
          `Route "${route.routeId}" references unknown stop "${ref.stopId}"`,
          `routes.${route.routeId}.stops`,
        )
      }
      stopsReferencedByRoutes.add(ref.stopId)
      if (typeof ref.displayOrder !== 'number' || !Number.isFinite(ref.displayOrder)) {
        error(
          'invalid_display_order',
          `Route "${route.routeId}" stop "${ref.stopId}" has invalid displayOrder`,
          `routes.${route.routeId}.stops`,
        )
      } else if (orders.has(ref.displayOrder)) {
        error(
          'duplicate_display_order',
          `Route "${route.routeId}" has duplicate displayOrder ${ref.displayOrder}`,
          `routes.${route.routeId}.stops`,
        )
      } else {
        orders.add(ref.displayOrder)
      }
    }

    // Full journey sequences (waypoints + transits) when present
    if (Array.isArray(route.sequence) && manifest?.transits) {
      const transitIds = new Set(Object.keys(manifest.transits))
      for (const stepId of route.sequence) {
        if (!stopIds.has(stepId) && !transitIds.has(stepId)) {
          error(
            'broken_route_reference',
            `Route "${route.routeId}" sequence references unknown step "${stepId}"`,
            `routes.${route.routeId}.sequence`,
          )
        }
      }
    }
  }

  // Live manifests may list stops in acts (or optional/reorder sets) without
  // placing them on every path sequence — still count as referenced.
  for (const act of manifest?.acts ?? []) {
    for (const stopId of act.waypoints ?? []) {
      stopsReferencedByRoutes.add(stopId)
    }
  }
  for (const reorder of Object.values(manifest?.journey?.path_reorder ?? {})) {
    for (const stopId of reorder ?? []) stopsReferencedByRoutes.add(stopId)
  }
  for (const optional of Object.values(manifest?.journey?.optional_waypoints ?? {})) {
    for (const stopId of optional ?? []) stopsReferencedByRoutes.add(stopId)
  }

  for (const stopId of stopIds) {
    if (!stopsReferencedByRoutes.has(stopId)) {
      warn('orphan_stop', `Stop "${stopId}" is not referenced by any route`, `stops.${stopId}`)
    }
  }

  const assetIds = new Set()
  let audioCount = 0
  for (const asset of assets ?? []) {
    if (!asset?.assetId || typeof asset.assetId !== 'string') {
      error('invalid_asset', 'asset.assetId must be a string', 'assets')
      continue
    }
    if (assetIds.has(asset.assetId)) {
      error('duplicate_id', `Duplicate assetId "${asset.assetId}"`, `assets.${asset.assetId}`)
    }
    assetIds.add(asset.assetId)
    if (asset.kind === 'audio') {
      audioCount += 1
      if (!asset.path && !asset.url) {
        error('missing_audio', `Audio asset "${asset.assetId}" has no path or url`, `assets.${asset.assetId}`)
      }
    }
    if (asset.stopId && !stopIds.has(asset.stopId)) {
      error(
        'broken_asset_reference',
        `Asset "${asset.assetId}" references unknown stop "${asset.stopId}"`,
        `assets.${asset.assetId}.stopId`,
      )
    }
  }

  if (audioCount === 0 && !pkg.isFixture) {
    error('missing_audio', 'City package has no audio assets', 'assets')
  }

  const requirePreview =
    validationRules?.requirePreview === true ||
    (validationRules?.requirePreview !== false && !pkg.isFixture)
  if (requirePreview) {
    const previewAsset = (assets ?? []).find(
      (a) => a.role === 'preview' || a.assetId === 'system.preview',
    )
    const previewFromManifest = manifest?.system?.preview
    if (!previewAsset && !previewFromManifest) {
      error('missing_preview', 'City package is missing preview audio', 'system.preview')
    }
  }

  if (validationRules?.requireProduct !== false && (products?.length ?? 0) === 0) {
    error('missing_products', 'City package has no products', 'products')
  }

  const defaultLocale = city?.defaultLocale ?? 'en'
  if (locales && Object.keys(locales).length > 0) {
    if (!locales[defaultLocale]) {
      error(
        'invalid_locale_reference',
        `Default locale "${defaultLocale}" is not present under locales/`,
        'city.defaultLocale',
      )
    }
    for (const [locale, bundle] of Object.entries(locales)) {
      for (const content of bundle.stops ?? []) {
        if (content.stopId && !stopIds.has(content.stopId)) {
          error(
            'invalid_locale_reference',
            `Locale "${locale}" references unknown stop "${content.stopId}"`,
            `locales.${locale}.stops`,
          )
        }
      }
    }
  }

  if (manifest) {
    if (manifest.city && city?.cityId && manifest.city !== city.cityId && manifest.id !== city.cityId) {
      error(
        'city_mismatch',
        `Live manifest city "${manifest.city}" does not match package cityId "${city.cityId}"`,
        'manifest.city',
      )
    }
    // Live Rome Zod still requires literal 'rome' — keep as package rule when set.
    if (
      validationRules?.legacyLiveManifestCityLiteral &&
      manifest.city !== validationRules.legacyLiveManifestCityLiteral
    ) {
      error(
        'schema_mismatch',
        `Live manifest.city must be "${validationRules.legacyLiveManifestCityLiteral}" for runtime compat`,
        'manifest.city',
      )
    }
  } else if (!pkg.isFixture) {
    warn('missing_manifest', 'City package has no manifest.json (live shape)', 'manifest.json')
  }

  const errors = issues.filter((i) => i.severity === 'error')
  return { ok: errors.length === 0, issues }
}

/**
 * @param {ValidationResult} result
 * @param {string} [label]
 */
export function assertValidCity(result, label = 'city package') {
  if (result.ok) return result
  const details = result.issues
    .filter((i) => i.severity === 'error')
    .map((i) => `- [${i.code}] ${i.message}`)
    .join('\n')
  throw new Error(`${label} validation failed:\n${details}`)
}
