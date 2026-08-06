/**
 * Browser / Capacitor-safe city package entry.
 * No filesystem, path, or node:url APIs.
 */

export {
  listPackagedCityIds,
  listPackagedFixtureCityIds,
  loadPackagedCityPackage,
  tryLoadPackagedCityPackage,
  getAllPackagedCityPackages,
} from './packagedCities.js'

export { validateCity, assertValidCity } from './validateCity.js'
export { validateCatalog, assertValidCatalog } from './validateCatalog.js'

export {
  CATALOG_SCHEMA_VERSION,
  CITY_PACKAGE_SCHEMA_VERSION,
  MANIFEST_SCHEMA_VERSION,
} from '../cities/schemaVersions.js'
