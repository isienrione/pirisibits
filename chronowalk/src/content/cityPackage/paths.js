import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  CATALOG_SCHEMA_VERSION,
  CITY_PACKAGE_SCHEMA_VERSION,
  MANIFEST_SCHEMA_VERSION,
} from '../cities/schemaVersions.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** Absolute path to `src/content/cities`. */
export const CITIES_ROOT = join(__dirname, '../cities')

/** Repo root (`chronowalk/`). */
export const REPO_ROOT = join(__dirname, '../../..')

/**
 * @param {string} cityId
 * @returns {string}
 */
export function cityPackageDir(cityId) {
  return join(CITIES_ROOT, cityId)
}

/**
 * @param {string} cityId
 * @param {...string} parts
 * @returns {string}
 */
export function cityPackagePath(cityId, ...parts) {
  return join(cityPackageDir(cityId), ...parts)
}

/**
 * @param {string} relativePath path relative to chronowalk repo root
 * @returns {string}
 */
export function resolveRepoPath(relativePath) {
  return join(REPO_ROOT, relativePath)
}

/**
 * @param {string} path
 * @returns {unknown}
 */
export function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

/**
 * List published (and fixture) city package directories under cities/.
 * Skips `_`-prefixed and non-directory entries; `__fixtures__` is excluded
 * from published lists but available via {@link listFixtureCityIds}.
 *
 * @returns {string[]}
 */
export function listCityIds({ includeFixtures = false } = {}) {
  if (!existsSync(CITIES_ROOT)) return []
  const ids = []
  for (const name of readdirSync(CITIES_ROOT)) {
    if (name.startsWith('_') || name === '__fixtures__') continue
    if (name === 'schemaVersions.js' || name.endsWith('.md')) continue
    const full = join(CITIES_ROOT, name)
    if (!statSync(full).isDirectory()) continue
    if (!existsSync(join(full, 'metadata', 'package.json'))) continue
    ids.push(name)
  }
  if (includeFixtures) {
    ids.push(...listFixtureCityIds())
  }
  return ids.sort()
}

/**
 * @returns {string[]}
 */
export function listFixtureCityIds() {
  const fixturesRoot = join(CITIES_ROOT, '__fixtures__')
  if (!existsSync(fixturesRoot)) return []
  return readdirSync(fixturesRoot)
    .filter((name) => {
      const full = join(fixturesRoot, name)
      return (
        statSync(full).isDirectory() &&
        existsSync(join(full, 'metadata', 'package.json'))
      )
    })
    .sort()
}

/**
 * @param {string} cityId
 * @returns {{ root: string, isFixture: boolean }}
 */
export function resolveCityPackageRoot(cityId) {
  const published = cityPackageDir(cityId)
  if (existsSync(join(published, 'metadata', 'package.json'))) {
    return { root: published, isFixture: false }
  }
  const fixture = join(CITIES_ROOT, '__fixtures__', cityId)
  if (existsSync(join(fixture, 'metadata', 'package.json'))) {
    return { root: fixture, isFixture: true }
  }
  throw new Error(`Unknown city package: ${cityId}`)
}

/**
 * @typedef {Object} CityPackage
 * @property {string} cityId
 * @property {boolean} isFixture
 * @property {object} metadata
 * @property {object} city
 * @property {object[]} products
 * @property {object[]} routes
 * @property {object[]} stops
 * @property {object[]} assets
 * @property {object | null} manifest Live-shape manifest when present.
 * @property {Record<string, object>} locales
 * @property {object | null} validationRules
 */

/**
 * @param {string} cityId
 * @returns {CityPackage}
 */
export function loadCityPackage(cityId) {
  const { root, isFixture } = resolveCityPackageRoot(cityId)
  const metadata = readJson(join(root, 'metadata', 'package.json'))
  const city = readJson(join(root, 'city.json'))
  const products = readJson(join(root, 'products.json'))
  const routes = readJson(join(root, 'routes.json'))
  const stops = readJson(join(root, 'stops.json'))
  const assets = readJson(join(root, 'assets.json'))
  const manifestPath = join(root, 'manifest.json')
  const manifest = existsSync(manifestPath) ? readJson(manifestPath) : null
  const rulesPath = join(root, 'validation', 'rules.json')
  const validationRules = existsSync(rulesPath) ? readJson(rulesPath) : null

  /** @type {Record<string, object>} */
  const locales = {}
  const localesRoot = join(root, 'locales')
  if (existsSync(localesRoot)) {
    for (const locale of readdirSync(localesRoot)) {
      const localeDir = join(localesRoot, locale)
      if (!statSync(localeDir).isDirectory()) continue
      const entry = {}
      const stopsLocale = join(localeDir, 'stops.json')
      const reflectionsLocale = join(localeDir, 'reflections.json')
      if (existsSync(stopsLocale)) entry.stops = readJson(stopsLocale)
      if (existsSync(reflectionsLocale)) entry.reflections = readJson(reflectionsLocale)
      locales[locale] = entry
    }
  }

  return {
    cityId: metadata.cityId ?? city.cityId ?? cityId,
    isFixture,
    root,
    metadata,
    city,
    products,
    routes,
    stops,
    assets,
    manifest,
    locales,
    validationRules,
    schemaVersions: {
      catalog: metadata.catalogSchemaVersion ?? CATALOG_SCHEMA_VERSION,
      cityPackage: metadata.cityPackageSchemaVersion ?? CITY_PACKAGE_SCHEMA_VERSION,
      manifest: metadata.manifestSchemaVersion ?? MANIFEST_SCHEMA_VERSION,
    },
  }
}
