/**
 * Node-only city package tooling (filesystem loaders + generators).
 * Must never be imported from browser / Capacitor runtime modules.
 */

export {
  CITIES_ROOT,
  REPO_ROOT,
  cityPackageDir,
  cityPackagePath,
  listCityIds,
  listFixtureCityIds,
  loadCityPackage,
  resolveCityPackageRoot,
  resolveRepoPath,
  readJson,
} from './paths.js'

export {
  generateCityManifest,
  generateRomeManifestCompat,
} from './generateCityManifest.js'

export { validateCity, assertValidCity } from './validateCity.js'
export { validateCatalog, assertValidCatalog } from './validateCatalog.js'

export {
  CATALOG_SCHEMA_VERSION,
  CITY_PACKAGE_SCHEMA_VERSION,
  MANIFEST_SCHEMA_VERSION,
} from '../cities/schemaVersions.js'
