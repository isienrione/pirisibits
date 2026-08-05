import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  generateCityManifest,
  generateRomeManifestCompat,
  loadCityPackage,
  listCityIds,
  listFixtureCityIds,
  validateCity,
  validateCatalog,
  CATALOG_SCHEMA_VERSION,
  CITY_PACKAGE_SCHEMA_VERSION,
  MANIFEST_SCHEMA_VERSION,
} from '../index.js'
import { parseRomeManifest } from '../../romeManifestZod.schema.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const runtimeRomeManifestPath = join(__dirname, '../../rome/manifest.json')

describe('schema versions', () => {
  it('exposes catalog, city package, and manifest schema versions at 1', () => {
    expect(CATALOG_SCHEMA_VERSION).toBe(1)
    expect(CITY_PACKAGE_SCHEMA_VERSION).toBe(1)
    expect(MANIFEST_SCHEMA_VERSION).toBe(1)
  })
})

describe('generic city generator', () => {
  it('generateCityManifest({ cityId }) validates and returns the Rome package', () => {
    const result = generateCityManifest({ cityId: 'rome', dryRun: true })
    expect(result.cityId).toBe('rome')
    expect(result.manifest.city).toBe('rome')
    expect(result.wroteRuntime).toBe(false)
    expect(result.validation.ok).toBe(true)
    expect(result.schemaVersions).toEqual({
      catalog: 1,
      cityPackage: 1,
      manifest: 1,
    })
  })

  it('rejects missing cityId', () => {
    expect(() => generateCityManifest({ cityId: '' })).toThrow(/cityId/)
  })
})

describe('Rome compatibility', () => {
  it('keeps the runtime Rome manifest byte-compatible with the city package SSOT', () => {
    const pkg = loadCityPackage('rome')
    const runtime = JSON.parse(readFileSync(runtimeRomeManifestPath, 'utf8'))
    expect(runtime).toEqual(pkg.manifest)
  })

  it('still parses with the live Rome Zod schema', () => {
    const pkg = loadCityPackage('rome')
    expect(() => parseRomeManifest(pkg.manifest)).not.toThrow()
  })

  it('generateRomeManifestCompat aliases generateCityManifest({ cityId: "rome" })', () => {
    const viaAlias = generateRomeManifestCompat()
    expect(viaAlias.cityId).toBe('rome')
    expect(viaAlias.wroteRuntime).toBe(true)
    expect(viaAlias.runtimeManifestPath).toContain(`${join('content', 'rome', 'manifest.json')}`)

    const runtime = JSON.parse(readFileSync(runtimeRomeManifestPath, 'utf8'))
    expect(runtime).toEqual(viaAlias.manifest)
    expect(runtime.system.preview).toBe('w17_ch1.mp3')
    expect(runtime.price_fallback_cents).toBe(1499)
  })

  it('preserves Rome stop IDs, coordinates, and route sequences', () => {
    const pkg = loadCityPackage('rome')
    const stop = pkg.stops.find((s) => s.stopId === 'w01')
    expect(stop.location).toEqual({ lat: 41.8902, lng: 12.4922 })
    expect(stop.name).toBe('The Colosseum')

    const main = pkg.routes.find((r) => r.routeId === 'rome-eternal-main')
    expect(main.sequence[0]).toBe('w01')
    expect(main.stops[0]).toEqual({ stopId: 'w01', displayOrder: 0 })
  })
})

describe('schema validation', () => {
  it('validateCity accepts the Rome package', () => {
    const result = validateCity(loadCityPackage('rome'))
    const errors = result.issues.filter((i) => i.severity === 'error')
    expect(errors).toEqual([])
    expect(result.ok).toBe(true)
  })

  it('detects duplicate stop IDs', () => {
    const pkg = structuredClone(loadCityPackage('harbor'))
    pkg.stops.push({ ...pkg.stops[0] })
    const result = validateCity(pkg)
    expect(result.ok).toBe(false)
    expect(result.issues.some((i) => i.code === 'duplicate_id')).toBe(true)
  })

  it('detects duplicate display orders on a route', () => {
    const pkg = structuredClone(loadCityPackage('harbor'))
    pkg.routes[0].stops[1].displayOrder = pkg.routes[0].stops[0].displayOrder
    const result = validateCity(pkg)
    expect(result.ok).toBe(false)
    expect(result.issues.some((i) => i.code === 'duplicate_display_order')).toBe(true)
  })

  it('detects broken route references', () => {
    const pkg = structuredClone(loadCityPackage('harbor'))
    pkg.routes[0].stops.push({ stopId: 'missing-stop', displayOrder: 99 })
    const result = validateCity(pkg)
    expect(result.ok).toBe(false)
    expect(result.issues.some((i) => i.code === 'broken_route_reference')).toBe(true)
  })

  it('detects invalid coordinates', () => {
    const pkg = structuredClone(loadCityPackage('harbor'))
    pkg.stops[0].location = { lat: 999, lng: 0 }
    const result = validateCity(pkg)
    expect(result.ok).toBe(false)
    expect(result.issues.some((i) => i.code === 'invalid_coordinates')).toBe(true)
  })

  it('detects schema mismatch', () => {
    const pkg = structuredClone(loadCityPackage('harbor'))
    pkg.metadata.cityPackageSchemaVersion = 99
    pkg.metadata.schemaVersion = 99
    const result = validateCity(pkg)
    expect(result.ok).toBe(false)
    expect(result.issues.some((i) => i.code === 'schema_mismatch')).toBe(true)
  })

  it('detects missing products', () => {
    const pkg = structuredClone(loadCityPackage('harbor'))
    pkg.products = []
    const result = validateCity(pkg)
    expect(result.ok).toBe(false)
    expect(result.issues.some((i) => i.code === 'missing_products')).toBe(true)
  })

  it('detects missing preview', () => {
    const pkg = structuredClone(loadCityPackage('harbor'))
    pkg.assets = pkg.assets.filter((a) => a.role !== 'preview')
    if (pkg.manifest?.system) delete pkg.manifest.system.preview
    const result = validateCity(pkg)
    expect(result.ok).toBe(false)
    expect(result.issues.some((i) => i.code === 'missing_preview')).toBe(true)
  })

  it('detects missing audio paths', () => {
    const pkg = structuredClone(loadCityPackage('harbor'))
    pkg.assets = [{ assetId: 'broken.audio', kind: 'audio', stopId: 'quay-north' }]
    const result = validateCity(pkg)
    expect(result.ok).toBe(false)
    expect(result.issues.some((i) => i.code === 'missing_audio')).toBe(true)
  })

  it('detects orphan stops as warnings', () => {
    const pkg = structuredClone(loadCityPackage('harbor'))
    pkg.stops.push({
      stopId: 'orphan-pier',
      cityId: 'harbor',
      name: 'Orphan Pier',
      location: { lat: 44.12, lng: 9.22 },
    })
    const result = validateCity(pkg)
    expect(result.issues.some((i) => i.code === 'orphan_stop')).toBe(true)
  })

  it('detects invalid locale references', () => {
    const pkg = structuredClone(loadCityPackage('harbor'))
    pkg.locales.en.stops.push({
      contentId: 'ghost.en',
      stopId: 'ghost-stop',
      locale: 'en',
      title: 'Ghost',
    })
    const result = validateCity(pkg)
    expect(result.ok).toBe(false)
    expect(result.issues.some((i) => i.code === 'invalid_locale_reference')).toBe(true)
  })
})

describe('multiple city packages', () => {
  it('lists Rome as a published city and harbor as a fixture', () => {
    expect(listCityIds()).toContain('rome')
    expect(listCityIds()).not.toContain('harbor')
    expect(listFixtureCityIds()).toContain('harbor')
  })

  it('validateCatalog accepts Rome + harbor together', () => {
    const packages = [loadCityPackage('rome'), loadCityPackage('harbor')]
    const result = validateCatalog(packages)
    const errors = result.issues.filter((i) => i.severity === 'error')
    expect(errors).toEqual([])
    expect(result.ok).toBe(true)
    expect(new Set(packages.map((p) => p.cityId))).toEqual(new Set(['rome', 'harbor']))
  })

  it('allows the same stop on multiple routes with different displayOrder', () => {
    const harbor = loadCityPackage('harbor')
    const main = harbor.routes.find((r) => r.routeId === 'harbor-loop-main')
    const alt = harbor.routes.find((r) => r.routeId === 'harbor-loop-alt')
    const mainLighthouse = main.stops.find((s) => s.stopId === 'lighthouse')
    const altLighthouse = alt.stops.find((s) => s.stopId === 'lighthouse')
    expect(mainLighthouse.displayOrder).not.toBe(altLighthouse.displayOrder)
  })
})
