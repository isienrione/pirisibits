import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  CATALOG_SCHEMA_VERSION,
  CITY_PACKAGE_SCHEMA_VERSION,
  CATALOG_ID_FIELDS,
  isCity,
  isTourProduct,
  isRoute,
  isStop,
} from '../catalog/index.js'
import {
  SAMPLE_CITIES,
  SAMPLE_PRODUCTS,
  SAMPLE_ROUTES,
  SAMPLE_STOPS,
  FORBIDDEN_ROME_SPECIFIC_FIELDS,
} from './fixtures.js'

describe('multi-city catalog contracts', () => {
  it('allows two different cities to coexist in the same catalog', () => {
    expect(SAMPLE_CITIES.every(isCity)).toBe(true)
    const cityIds = SAMPLE_CITIES.map((c) => c.cityId)
    expect(new Set(cityIds).size).toBe(2)
    expect(cityIds).toContain('rome')
    expect(cityIds).toContain('florence')
    expect(CATALOG_SCHEMA_VERSION).toBe(1)
    expect(CITY_PACKAGE_SCHEMA_VERSION).toBe(1)
  })

  it('requires products to belong to cities', () => {
    expect(SAMPLE_PRODUCTS.every(isTourProduct)).toBe(true)
    const cityIds = new Set(SAMPLE_CITIES.map((c) => c.cityId))
    for (const product of SAMPLE_PRODUCTS) {
      expect(cityIds.has(product.cityId)).toBe(true)
    }
    expect(
      SAMPLE_PRODUCTS.find((p) => p.productId === 'rome-eternal')?.cityId,
    ).toBe('rome')
    expect(
      SAMPLE_PRODUCTS.find((p) => p.productId === 'florence-heart')?.cityId,
    ).toBe('florence')
  })

  it('lets routes reference stops generically via stopId', () => {
    expect(SAMPLE_ROUTES.every(isRoute)).toBe(true)
    expect(SAMPLE_STOPS.every(isStop)).toBe(true)

    const stopIds = new Set(SAMPLE_STOPS.map((s) => s.stopId))
    for (const route of SAMPLE_ROUTES) {
      expect(typeof route.routeId).toBe('string')
      expect(typeof route.cityId).toBe('string')
      for (const ref of route.stops) {
        expect(stopIds.has(ref.stopId)).toBe(true)
        expect(ref).not.toHaveProperty('waypointIndex')
        expect(ref).not.toHaveProperty('romeStop')
      }
    }
  })

  it('allows the same stop to appear in more than one route', () => {
    const routesWithCuria = SAMPLE_ROUTES.filter((route) =>
      route.stops.some((ref) => ref.stopId === 'curia-julia'),
    )
    expect(routesWithCuria.map((r) => r.routeId)).toEqual([
      'rome-eternal-main',
      'rome-eternal-forum-loop',
    ])
  })

  it('keeps route display order separate from stop identity', () => {
    const main = SAMPLE_ROUTES.find((r) => r.routeId === 'rome-eternal-main')
    const loop = SAMPLE_ROUTES.find(
      (r) => r.routeId === 'rome-eternal-forum-loop',
    )

    const mainCuria = main.stops.find((s) => s.stopId === 'curia-julia')
    const loopCuria = loop.stops.find((s) => s.stopId === 'curia-julia')

    expect(mainCuria.stopId).toBe(loopCuria.stopId)
    expect(mainCuria.displayOrder).toBe(0)
    expect(loopCuria.displayOrder).toBe(1)
    expect(mainCuria.displayOrder).not.toBe(loopCuria.displayOrder)
  })

  it('exposes only generic catalog ID field names', () => {
    expect(CATALOG_ID_FIELDS).toEqual([
      'cityId',
      'productId',
      'routeId',
      'stopId',
      'contentId',
      'assetId',
    ])
    for (const field of FORBIDDEN_ROME_SPECIFIC_FIELDS) {
      expect(CATALOG_ID_FIELDS).not.toContain(field)
    }
  })
})

describe('domain contract Rome independence', () => {
  const domainRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

  function listJsFiles(dir) {
    const out = []
    for (const name of readdirSync(dir)) {
      const full = join(dir, name)
      if (statSync(full).isDirectory()) {
        if (name === '__tests__') continue
        out.push(...listJsFiles(full))
      } else if (name.endsWith('.js')) {
        out.push(full)
      }
    }
    return out
  }

  it('does not define Rome-specific identifier fields on domain contracts', () => {
    const sources = listJsFiles(domainRoot).map((path) => ({
      path,
      text: readFileSync(path, 'utf8'),
    }))

    expect(sources.length).toBeGreaterThan(0)

    for (const { path, text } of sources) {
      for (const forbidden of FORBIDDEN_ROME_SPECIFIC_FIELDS) {
        expect(text, `${path} must not mention ${forbidden}`).not.toContain(
          forbidden,
        )
      }
      // Contracts must not hard-code Rome as a required axis.
      expect(text, `${path} must not use hasRome* accessors`).not.toMatch(
        /hasRome[A-Z]/,
      )
    }
  })
})
