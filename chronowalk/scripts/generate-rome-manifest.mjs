#!/usr/bin/env node
/**
 * Compatibility alias for the Rome live PWA manifest.
 *
 * Historically this script hand-assembled src/content/rome/manifest.json.
 * It now delegates to the generic city package generator:
 *
 *   generateCityManifest({ cityId: 'rome' })
 *
 * Equivalent CLI:
 *   npm run generate:city -- --city rome
 *
 * Rome package SSOT: src/content/cities/rome/
 * Runtime compat output: src/content/rome/manifest.json (unchanged load path)
 */
import { generateRomeManifestCompat } from '../src/content/cityPackage/generateCityManifest.js'

try {
  const result = generateRomeManifestCompat()
  console.log(`Wrote ${result.runtimeManifestPath ?? result.packageManifestPath}`)
  const durationCount = Object.keys(result.manifest.durations ?? {}).length
  console.log(`  durations: ${durationCount} entries`)
  console.log(`  city package: src/content/cities/rome/`)
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}
