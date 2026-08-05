import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import {
  clearCatalogCache,
  getPublishedCities,
  getCityById,
  getCityBySlug,
  getProductsForCity,
  getProductById,
  getProductBySlug,
  getRoutesForProduct,
  getRouteById,
  getStopsForRoute,
  getStopById,
  resolveLegacyStopId,
  resolveLegacyRoute,
  resolveLegacyWaypoint,
  resolveLegacyProductId,
  loadPublishedCityPackages,
} from '../index.js'
import { __setPublishedPackagesForTests } from '../cityRegistry.js'
import { listCityIds, listFixtureCityIds, loadCityPackage } from '../../content/cityPackage/index.js'

beforeEach(() => {
  clearCatalogCache()
})

afterEach(() => {
  __setPublishedPackagesForTests(null)
  clearCatalogCache()
})

describe('published cities', () => {
  it('exposes only Rome as a published city', () => {
    const cities = getPublishedCities()
    expect(cities.map((c) => c.cityId)).toEqual(['rome'])
    expect(cities[0].slug).toBe('rome')
    expect(cities[0].name).toBe('Rome')
  })

  it('hides harbor and other fixtures from the published registry', () => {
    expect(listFixtureCityIds()).toContain('harbor')
    expect(listCityIds()).not.toContain('harbor')
    expect(getPublishedCities().some((c) => c.cityId === 'harbor')).toBe(false)
    expect(getCityById('harbor')).toBeNull()
    expect(loadPublishedCityPackages().every((p) => !p.isFixture)).toBe(true)
  })
})

describe('city lookup', () => {
  it('gets city by id and slug', () => {
    expect(getCityById('rome')?.name).toBe('Rome')
    expect(getCityBySlug('rome')?.cityId).toBe('rome')
    expect(getCityBySlug('ROME')?.cityId).toBe('rome')
  })

  it('returns null for unknown cities', () => {
    expect(getCityById('atlantis')).toBeNull()
    expect(getCityBySlug('atlantis')).toBeNull()
    expect(getCityById('')).toBeNull()
  })
})

describe('product lookup', () => {
  it('lists and finds Rome package products', () => {
    const products = getProductsForCity('rome')
    expect(products.map((p) => p.productId)).toEqual(['rome-eternal'])
    expect(getProductById('rome-eternal')?.cityId).toBe('rome')
    expect(getProductBySlug('rome-eternal')?.name).toBe('Rome Eternal')
  })

  it('returns empty / null for unknown products', () => {
    expect(getProductsForCity('atlantis')).toEqual([])
    expect(getProductById('nope')).toBeNull()
    expect(getProductBySlug('nope')).toBeNull()
  })
})

describe('route lookup', () => {
  it('lists routes for the Rome product', () => {
    const routes = getRoutesForProduct('rome-eternal')
    expect(routes.map((r) => r.routeId).sort()).toEqual([
      'rome-eternal-main',
      'rome-eternal-path-b',
    ])
    expect(getRouteById('rome-eternal-main')?.pathKey).toBe('a')
    expect(getRouteById('rome-eternal-path-b')?.pathKey).toBe('b')
  })

  it('returns null for unknown routes', () => {
    expect(getRouteById('missing-route')).toBeNull()
    expect(getRoutesForProduct('missing-product')).toEqual([])
  })
})

describe('stop lookup', () => {
  it('finds stops by id and lists them in route display order', () => {
    expect(getStopById('w01')?.name).toBe('The Colosseum')
    expect(getStopById('pantheon')).toBeNull()

    const stops = getStopsForRoute('rome-eternal-main')
    expect(stops[0].stopId).toBe('w01')
    expect(stops[0].displayOrder).toBe(0)
    const orders = stops.map((s) => s.displayOrder)
    expect(orders).toEqual([...orders].sort((a, b) => a - b))
  })

  it('returns null / empty for unknown stops and routes', () => {
    expect(getStopById('w99')).toBeNull()
    expect(getStopsForRoute('missing-route')).toEqual([])
  })
})

describe('legacy aliases', () => {
  it('resolves kebab waypoint aliases to stopIds', () => {
    expect(resolveLegacyStopId('colosseum')).toBe('w01')
    expect(resolveLegacyWaypoint('pantheon')).toBe('w17')
    expect(resolveLegacyStopId('circus-maximus')).toBe('enc_circus')
    expect(resolveLegacyStopId('w01')).toBe('w01')
  })

  it('resolves path and tour aliases to routeIds', () => {
    expect(resolveLegacyRoute('a')).toBe('rome-eternal-main')
    expect(resolveLegacyRoute('b')).toBe('rome-eternal-path-b')
    expect(resolveLegacyRoute('rome-eternal-main')).toBe('rome-eternal-main')
    expect(resolveLegacyRoute('heart-of-ancient-rome')).toBe('rome-eternal-main')
  })

  it('resolves launch product aliases to the package product', () => {
    expect(resolveLegacyProductId('rome-complete')).toBe('rome-eternal')
    expect(resolveLegacyProductId('rome-central')).toBe('rome-eternal')
    expect(resolveLegacyProductId('rome-eternal')).toBe('rome-eternal')
  })

  it('returns null for unknown legacy ids', () => {
    expect(resolveLegacyStopId('not-a-stop')).toBeNull()
    expect(resolveLegacyRoute('path-z')).toBeNull()
    expect(resolveLegacyProductId('rome-mars')).toBeNull()
  })
})

describe('adding a second published city is data-driven', () => {
  it('includes an injected published package without code changes to callers', () => {
    const rome = loadCityPackage('rome')
    const harbor = loadCityPackage('harbor')
    // Simulate onboarding: treat a fixture-shaped package as published in-memory.
    const athensLike = {
      ...harbor,
      cityId: 'athens',
      isFixture: false,
      metadata: { ...harbor.metadata, cityId: 'athens', published: true },
      city: { ...harbor.city, cityId: 'athens', name: 'Athens', slug: 'athens' },
      products: harbor.products.map((p) => ({
        ...p,
        cityId: 'athens',
        productId: 'athens-agora',
      })),
      routes: [],
      stops: [],
    }

    __setPublishedPackagesForTests([rome, athensLike])

    const cities = getPublishedCities()
    expect(cities.map((c) => c.cityId).sort()).toEqual(['athens', 'rome'])
    expect(getCityById('athens')?.name).toBe('Athens')
    // Harbor itself remains a fixture on disk — not in the real published list after reset.
    __setPublishedPackagesForTests(null)
    clearCatalogCache()
    expect(getPublishedCities().map((c) => c.cityId)).toEqual(['rome'])
  })
})
