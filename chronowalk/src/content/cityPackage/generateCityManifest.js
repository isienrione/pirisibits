/**
 * Generic city package generator.
 *
 * generateCityManifest({ cityId }) loads a city package, validates it, and
 * syncs the live-shape manifest to any configured runtime compatibility path
 * (Rome → src/content/rome/manifest.json).
 */

import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import {
  loadCityPackage,
  resolveRepoPath,
} from './paths.js'
import { assertValidCity, validateCity } from './validateCity.js'
import {
  CATALOG_SCHEMA_VERSION,
  CITY_PACKAGE_SCHEMA_VERSION,
  MANIFEST_SCHEMA_VERSION,
} from '../cities/schemaVersions.js'

/**
 * @typedef {Object} GenerateCityManifestOptions
 * @property {string} cityId
 * @property {boolean} [dryRun] When true, validate only — do not write files.
 * @property {boolean} [skipValidation] Escape hatch for tests; default false.
 */

/**
 * @typedef {Object} GenerateCityManifestResult
 * @property {string} cityId
 * @property {object} manifest
 * @property {string} packageManifestPath
 * @property {string | null} runtimeManifestPath
 * @property {boolean} wroteRuntime
 * @property {import('./validateCity.js').ValidationResult} validation
 * @property {{ catalog: number, cityPackage: number, manifest: number }} schemaVersions
 */

/**
 * @param {GenerateCityManifestOptions} options
 * @returns {GenerateCityManifestResult}
 */
export function generateCityManifest({ cityId, dryRun = false, skipValidation = false }) {
  if (!cityId || typeof cityId !== 'string') {
    throw new Error('generateCityManifest requires { cityId: string }')
  }

  const pkg = loadCityPackage(cityId)
  const validation = validateCity(pkg)
  if (!skipValidation) {
    assertValidCity(validation, `city package "${cityId}"`)
  }

  if (!pkg.manifest) {
    throw new Error(
      `City package "${cityId}" has no manifest.json — cannot generate a live manifest yet`,
    )
  }

  const packageManifestPath = `${pkg.root}/manifest.json`
  const runtimeRelative = pkg.metadata?.runtimeCompat?.manifestPath ?? null
  const runtimeManifestPath = runtimeRelative ? resolveRepoPath(runtimeRelative) : null

  let wroteRuntime = false
  if (!dryRun) {
    // Package manifest is already SSOT on disk; rewrite to normalize trailing newline.
    writeFileSync(packageManifestPath, `${JSON.stringify(pkg.manifest, null, 2)}\n`)

    if (runtimeManifestPath) {
      mkdirSync(dirname(runtimeManifestPath), { recursive: true })
      copyFileSync(packageManifestPath, runtimeManifestPath)
      wroteRuntime = true
    }
  }

  return {
    cityId,
    manifest: pkg.manifest,
    packageManifestPath,
    runtimeManifestPath,
    wroteRuntime,
    validation,
    schemaVersions: {
      catalog: pkg.schemaVersions?.catalog ?? CATALOG_SCHEMA_VERSION,
      cityPackage: pkg.schemaVersions?.cityPackage ?? CITY_PACKAGE_SCHEMA_VERSION,
      manifest: pkg.schemaVersions?.manifest ?? MANIFEST_SCHEMA_VERSION,
    },
  }
}

/**
 * Compatibility helper used by the generate:rome-manifest alias.
 * @returns {GenerateCityManifestResult}
 */
export function generateRomeManifestCompat() {
  return generateCityManifest({ cityId: 'rome' })
}
