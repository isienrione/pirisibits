/**
 * Browser-safe packaged city data from static JSON imports.
 * No node:fs, node:path, or node:url.
 */

import {
  CATALOG_SCHEMA_VERSION,
  CITY_PACKAGE_SCHEMA_VERSION,
  MANIFEST_SCHEMA_VERSION,
} from '../cities/schemaVersions.js'

/** @type {Record<string, unknown>} */
const jsonModules = import.meta.glob('../cities/**/*.json', {
  eager: true,
  import: 'default',
})

/**
 * @param {string} path
 * @returns {{ cityKey: string, isFixture: boolean, rel: string } | null}
 */
function parseCityJsonPath(path) {
  const normalized = path.replace(/\\/g, '/')
  const fixture = normalized.match(/\/cities\/__fixtures__\/([^/]+)\/(.+)$/)
  if (fixture) {
    return { cityKey: fixture[1], isFixture: true, rel: fixture[2] }
  }
  const published = normalized.match(/\/cities\/([^/]+)\/(.+)$/)
  if (!published) return null
  if (published[1] === '__fixtures__') return null
  return { cityKey: published[1], isFixture: false, rel: published[2] }
}

/**
 * @returns {Map<string, import('./types.js').CityPackage>}
 */
function assemblePackages() {
  /** @type {Map<string, { cityId: string, isFixture: boolean, files: Map<string, unknown> }>} */
  const buckets = new Map()

  for (const [path, data] of Object.entries(jsonModules)) {
    const parsed = parseCityJsonPath(path)
    if (!parsed) continue
    const bucketKey = `${parsed.isFixture ? 'fixture' : 'city'}:${parsed.cityKey}`
    let bucket = buckets.get(bucketKey)
    if (!bucket) {
      bucket = {
        cityId: parsed.cityKey,
        isFixture: parsed.isFixture,
        files: new Map(),
      }
      buckets.set(bucketKey, bucket)
    }
    bucket.files.set(parsed.rel, data)
  }

  /** @type {Map<string, import('./types.js').CityPackage>} */
  const packages = new Map()

  for (const bucket of buckets.values()) {
    const metadata = bucket.files.get('metadata/package.json')
    if (!metadata || typeof metadata !== 'object') continue

    /** @type {Record<string, object>} */
    const locales = {}
    for (const [rel, data] of bucket.files) {
      const match = /^locales\/([^/]+)\/(stops|reflections)\.json$/.exec(rel)
      if (!match) continue
      const [, locale, kind] = match
      if (!locales[locale]) locales[locale] = {}
      locales[locale][kind] = data
    }

    const cityJson = /** @type {{ cityId?: string } | null} */ (
      bucket.files.get('city.json') ?? null
    )
    const meta = /** @type {Record<string, unknown>} */ (metadata)
    const cityId =
      (typeof meta.cityId === 'string' && meta.cityId) ||
      cityJson?.cityId ||
      bucket.cityId

    /** @type {import('./types.js').CityPackage} */
    const pkg = {
      cityId,
      isFixture: bucket.isFixture,
      root: bucket.isFixture
        ? `packaged:__fixtures__/${bucket.cityId}`
        : `packaged:${bucket.cityId}`,
      metadata: meta,
      city: cityJson ?? {},
      products: /** @type {object[]} */ (bucket.files.get('products.json') ?? []),
      routes: /** @type {object[]} */ (bucket.files.get('routes.json') ?? []),
      stops: /** @type {object[]} */ (bucket.files.get('stops.json') ?? []),
      assets: /** @type {object[]} */ (bucket.files.get('assets.json') ?? []),
      manifest: /** @type {object | null} */ (bucket.files.get('manifest.json') ?? null),
      locales,
      validationRules: /** @type {object | null} */ (
        bucket.files.get('validation/rules.json') ?? null
      ),
      schemaVersions: {
        catalog: /** @type {number} */ (meta.catalogSchemaVersion ?? CATALOG_SCHEMA_VERSION),
        cityPackage: /** @type {number} */ (
          meta.cityPackageSchemaVersion ?? CITY_PACKAGE_SCHEMA_VERSION
        ),
        manifest: /** @type {number} */ (meta.manifestSchemaVersion ?? MANIFEST_SCHEMA_VERSION),
      },
    }
    packages.set(cityId, pkg)
  }

  return packages
}

const PACKAGE_MAP = assemblePackages()

/**
 * Published (non-fixture) city ids available in the browser bundle.
 * @returns {string[]}
 */
export function listPackagedCityIds() {
  return [...PACKAGE_MAP.values()]
    .filter((pkg) => !pkg.isFixture)
    .map((pkg) => pkg.cityId)
    .sort()
}

/**
 * Fixture city ids available in the browser bundle (tests / offline tooling).
 * @returns {string[]}
 */
export function listPackagedFixtureCityIds() {
  return [...PACKAGE_MAP.values()]
    .filter((pkg) => pkg.isFixture)
    .map((pkg) => pkg.cityId)
    .sort()
}

/**
 * @param {string} cityId
 * @returns {import('./types.js').CityPackage}
 */
export function loadPackagedCityPackage(cityId) {
  const pkg = PACKAGE_MAP.get(cityId)
  if (!pkg) {
    throw new Error(`Unknown city package: ${cityId}`)
  }
  return pkg
}

/**
 * @param {string} cityId
 * @returns {import('./types.js').CityPackage | null}
 */
export function tryLoadPackagedCityPackage(cityId) {
  return PACKAGE_MAP.get(cityId) ?? null
}

/**
 * @returns {import('./types.js').CityPackage[]}
 */
export function getAllPackagedCityPackages() {
  return [...PACKAGE_MAP.values()]
}
