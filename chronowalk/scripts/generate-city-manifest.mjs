#!/usr/bin/env node
/**
 * Generic city package generator CLI.
 *
 * Usage:
 *   node scripts/generate-city-manifest.mjs --city rome
 *   npm run generate:city -- --city rome
 */
import { generateCityManifest } from '../src/content/cityPackage/generateCityManifest.js'

function parseArgs(argv) {
  let cityId = null
  let dryRun = false
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--city' || arg === '-c') {
      cityId = argv[i + 1]
      i += 1
    } else if (arg.startsWith('--city=')) {
      cityId = arg.slice('--city='.length)
    } else if (arg === '--dry-run') {
      dryRun = true
    }
  }
  return { cityId, dryRun }
}

const { cityId, dryRun } = parseArgs(process.argv.slice(2))
if (!cityId) {
  console.error('Usage: generate-city-manifest.mjs --city <cityId> [--dry-run]')
  process.exit(1)
}

try {
  const result = generateCityManifest({ cityId, dryRun })
  console.log(`City package "${result.cityId}" OK`)
  console.log(`  schema: catalog=${result.schemaVersions.catalog} cityPackage=${result.schemaVersions.cityPackage} manifest=${result.schemaVersions.manifest}`)
  console.log(`  package manifest: ${result.packageManifestPath}`)
  if (result.runtimeManifestPath) {
    console.log(
      dryRun
        ? `  runtime compat (dry-run): ${result.runtimeManifestPath}`
        : `  wrote runtime compat: ${result.runtimeManifestPath}`,
    )
  }
  const warnings = result.validation.issues.filter((i) => i.severity === 'warning')
  if (warnings.length) {
    console.log(`  warnings: ${warnings.length}`)
    for (const w of warnings) console.log(`    - [${w.code}] ${w.message}`)
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}
