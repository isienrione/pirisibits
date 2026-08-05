/**
 * Catalog-level validation across one or more city packages.
 */

import { validateCity } from './validateCity.js'

/**
 * @param {import('./paths.js').CityPackage[]} packages
 * @returns {import('./validateCity.js').ValidationResult}
 */
export function validateCatalog(packages) {
  /** @type {import('./validateCity.js').ValidationIssue[]} */
  const issues = []

  if (!Array.isArray(packages) || packages.length === 0) {
    return {
      ok: false,
      issues: [
        {
          severity: 'error',
          code: 'empty_catalog',
          message: 'Catalog must include at least one city package',
        },
      ],
    }
  }

  const cityIds = new Set()
  const productIds = new Set()
  const routeIds = new Set()
  const stopIds = new Set()

  for (const pkg of packages) {
    const cityResult = validateCity(pkg)
    for (const issue of cityResult.issues) {
      issues.push({
        ...issue,
        message: `[${pkg.cityId}] ${issue.message}`,
        path: issue.path ? `${pkg.cityId}.${issue.path}` : pkg.cityId,
      })
    }

    if (cityIds.has(pkg.cityId)) {
      issues.push({
        severity: 'error',
        code: 'duplicate_id',
        message: `Duplicate cityId "${pkg.cityId}" in catalog`,
        path: pkg.cityId,
      })
    }
    cityIds.add(pkg.cityId)

    for (const product of pkg.products ?? []) {
      if (product?.productId && productIds.has(product.productId)) {
        issues.push({
          severity: 'error',
          code: 'duplicate_id',
          message: `Duplicate productId "${product.productId}" across cities`,
          path: `${pkg.cityId}.products.${product.productId}`,
        })
      }
      if (product?.productId) productIds.add(product.productId)
    }

    for (const route of pkg.routes ?? []) {
      if (route?.routeId && routeIds.has(route.routeId)) {
        issues.push({
          severity: 'error',
          code: 'duplicate_id',
          message: `Duplicate routeId "${route.routeId}" across cities`,
          path: `${pkg.cityId}.routes.${route.routeId}`,
        })
      }
      if (route?.routeId) routeIds.add(route.routeId)
    }

    for (const stop of pkg.stops ?? []) {
      // Stop IDs are city-scoped in the domain model; collide only when cityId matches.
      const scoped = `${pkg.cityId}::${stop?.stopId}`
      if (stop?.stopId && stopIds.has(scoped)) {
        issues.push({
          severity: 'error',
          code: 'duplicate_id',
          message: `Duplicate stopId "${stop.stopId}" within city "${pkg.cityId}"`,
          path: `${pkg.cityId}.stops.${stop.stopId}`,
        })
      }
      if (stop?.stopId) stopIds.add(scoped)
    }
  }

  const errors = issues.filter((i) => i.severity === 'error')
  return { ok: errors.length === 0, issues }
}

/**
 * @param {ValidationResult} result
 */
export function assertValidCatalog(result) {
  if (result.ok) return result
  const details = result.issues
    .filter((i) => i.severity === 'error')
    .map((i) => `- [${i.code}] ${i.message}`)
    .join('\n')
  throw new Error(`Catalog validation failed:\n${details}`)
}
