import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  clearCatalogCache,
  getPublishedCities,
  getProductsForCity,
} from '../catalogService.js'
import { clearCityRegistryCache, loadPublishedCityPackages } from '../cityRegistry.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

describe('runtime catalog import boundary', () => {
  it('cityRegistry imports runtime city packages, not Node loaders', () => {
    const source = readFileSync(join(__dirname, '../cityRegistry.js'), 'utf8')
    expect(source).toMatch(/cityPackage\/runtime\.js/)
    expect(source).not.toMatch(/cityPackage\/(node|paths|index)\.js/)
    expect(source).not.toMatch(/node:fs|node:path|node:url|fileURLToPath/)
  })

  it('loads published catalog without Node globals', () => {
    clearCityRegistryCache()
    clearCatalogCache()
    expect(typeof globalThis.process?.versions?.node).toBe('string')
    // Catalog must not require process, Buffer, or fs at call time.
    const cities = getPublishedCities()
    expect(cities.map((c) => c.cityId)).toEqual(['rome'])
    const products = getProductsForCity('rome')
    expect(products.some((p) => p.productId === 'rome-eternal')).toBe(true)
    expect(loadPublishedCityPackages()).toHaveLength(1)
  })
})
