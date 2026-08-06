/**
 * Shared city-package types (browser-safe — no Node APIs).
 */

/**
 * @typedef {Object} CityPackage
 * @property {string} cityId
 * @property {boolean} isFixture
 * @property {string} [root] Filesystem root in Node; synthetic id in the browser bundle.
 * @property {object} metadata
 * @property {object} city
 * @property {object[]} products
 * @property {object[]} routes
 * @property {object[]} stops
 * @property {object[]} assets
 * @property {object | null} manifest Live-shape manifest when present.
 * @property {Record<string, object>} locales
 * @property {object | null} validationRules
 * @property {{ catalog: number, cityPackage: number, manifest: number }} [schemaVersions]
 */

export {}
