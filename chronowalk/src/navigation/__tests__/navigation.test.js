import { describe, expect, it, beforeEach } from 'vitest'
import {
  getPublishedCities,
  listNavigableCities,
  getCityRoute,
  resolveCitySlug,
  getProductRoute,
  resolveProductSlug,
  getJourneyRoute,
  resolveRouteSlug,
  getLegacyPublicJourneyRoute,
  resolveLegacyRomeRoute,
  listLegacyRomePathnames,
  resolveDeepLink,
  getPlatformNavigationTree,
  isLegacyPublicPath,
  normalizeSlug,
} from '../index.js'
import { clearCatalogCache } from '../../catalog/index.js'
import { __setPublishedPackagesForTests } from '../../catalog/cityRegistry.js'
import { loadPackagedCityPackage } from '../../content/cityPackage/runtime.js'

beforeEach(() => {
  __setPublishedPackagesForTests(null)
  clearCatalogCache()
})

describe('published city routes', () => {
  it('exposes only Rome and builds a future city hub path', () => {
    expect(getPublishedCities().map((c) => c.cityId)).toEqual(['rome'])
    expect(listNavigableCities().map((c) => c.cityId)).toEqual(['rome'])
    const route = getCityRoute('rome')
    expect(route).toMatchObject({
      kind: 'city',
      cityId: 'rome',
      pathname: '/rome',
      isFuture: true,
    })
    expect(getPlatformNavigationTree().cities[0].cityId).toBe('rome')
  })

  it('resolves city slugs', () => {
    expect(resolveCitySlug('rome')?.cityId).toBe('rome')
    expect(resolveCitySlug('ROME')?.cityId).toBe('rome')
    expect(resolveCitySlug('atlantis')).toBeNull()
  })
})

describe('legacy Rome URLs', () => {
  it('resolves current public paths exactly', () => {
    expect(resolveLegacyRomeRoute('/')).toMatchObject({ kind: 'landing', pathname: '/' })
    expect(resolveLegacyRomeRoute('/landing')).toMatchObject({
      kind: 'landing',
      pathname: '/',
      legacyPath: '/landing',
    })
    expect(resolveLegacyRomeRoute('/begin')).toMatchObject({
      kind: 'begin',
      cityId: 'rome',
      productId: 'rome-eternal',
      pathname: '/begin',
      isLegacy: true,
    })
    expect(resolveLegacyRomeRoute('/journey')).toMatchObject({
      kind: 'journey',
      pathname: '/journey',
      isLegacy: true,
    })
    expect(resolveLegacyRomeRoute('/letter')).toMatchObject({ kind: 'complete', pathname: '/letter' })
    expect(resolveLegacyRomeRoute('/complete')).toMatchObject({
      kind: 'complete',
      pathname: '/letter',
      legacyPath: '/complete',
    })
    expect(resolveLegacyRomeRoute('/free-pantheon')?.stopId).toBe('w17')
    expect(resolveLegacyRomeRoute('/purchase?tier=rome-complete')).toMatchObject({
      kind: 'purchase',
      productId: 'rome-complete',
    })
    expect(resolveLegacyRomeRoute('/access?token=abc')).toMatchObject({
      kind: 'access',
      query: expect.objectContaining({ token: 'abc' }),
    })
    expect(resolveLegacyRomeRoute('/invite?code=seat1')).toMatchObject({
      kind: 'invite',
      query: expect.objectContaining({ code: 'seat1' }),
    })
    expect(resolveLegacyRomeRoute('/checkout')?.pathname).toBe('/purchase')
    expect(isLegacyPublicPath('/journey')).toBe(true)
  })

  it('lists known legacy pathnames including purchase and access flows', () => {
    const paths = listLegacyRomePathnames()
    for (const required of [
      '/',
      '/begin',
      '/journey',
      '/letter',
      '/purchase',
      '/access',
      '/invite',
      '/free-pantheon',
      '/preview',
    ]) {
      expect(paths).toContain(required)
    }
  })
})

describe('product and route navigation', () => {
  it('builds future product and journey routes for Rome Eternal', () => {
    expect(getProductRoute('rome-eternal')).toMatchObject({
      kind: 'product',
      pathname: '/rome/eterna',
      isFuture: true,
    })
    expect(getJourneyRoute('rome-eternal-main')).toMatchObject({
      kind: 'journey',
      pathname: '/rome/eterna/journey',
      routeId: 'rome-eternal-main',
      isFuture: true,
    })
    expect(getLegacyPublicJourneyRoute().pathname).toBe('/journey')
  })

  it('resolves product and route slugs', () => {
    expect(resolveProductSlug('rome', 'eterna')).toEqual({
      cityId: 'rome',
      productId: 'rome-eternal',
    })
    expect(resolveRouteSlug('rome-eternal', 'a')).toEqual({
      productId: 'rome-eternal',
      routeId: 'rome-eternal-main',
    })
    expect(resolveRouteSlug('rome/eterna', 'b')?.routeId).toBe('rome-eternal-path-b')
    expect(normalizeSlug('Roma Eterna')).toBe('roma-eterna')
  })
})

describe('deep links', () => {
  it('prefers legacy public URLs over future shapes', () => {
    const begin = resolveDeepLink('https://chronowalk.com/begin?chooseRoute=1')
    expect(begin).toMatchObject({
      kind: 'begin',
      pathname: '/begin',
      isLegacy: true,
      query: expect.objectContaining({ chooseRoute: '1' }),
    })
  })

  it('resolves future city/product/journey capability URLs', () => {
    expect(resolveDeepLink('/rome')).toMatchObject({
      kind: 'city',
      cityId: 'rome',
      isFuture: true,
      known: true,
    })
    expect(resolveDeepLink('/rome/eterna')).toMatchObject({
      kind: 'product',
      productId: 'rome-eternal',
      isFuture: true,
    })
    expect(resolveDeepLink('/rome/eterna/journey')).toMatchObject({
      kind: 'journey',
      productId: 'rome-eternal',
      routeId: 'rome-eternal-main',
      isFuture: true,
    })
    expect(resolveDeepLink('/rome/eterna/journey/path-b')?.routeId).toBe('rome-eternal-path-b')
  })

  it('marks unknown and unpublished future city routes safely', () => {
    expect(resolveDeepLink('/paris')).toMatchObject({
      kind: 'city',
      cityId: 'paris',
      known: false,
      isFuture: true,
    })
    expect(resolveDeepLink('/rome/nope')).toMatchObject({ kind: 'unknown', known: false })
    expect(resolveDeepLink('/not/a/real/path')).toMatchObject({ kind: 'unknown', known: false })
  })
})

describe('second-city fixture', () => {
  it('can navigate a second published city without changing callers', () => {
    const rome = loadPackagedCityPackage('rome')
    const harbor = loadPackagedCityPackage('harbor')
    const athens = {
      ...harbor,
      cityId: 'athens',
      isFixture: false,
      metadata: { ...harbor.metadata, cityId: 'athens', published: true },
      city: { ...harbor.city, cityId: 'athens', name: 'Athens', slug: 'athens' },
      products: [
        {
          productId: 'athens-agora',
          cityId: 'athens',
          name: 'Agora Walk',
          slug: 'agora',
          routeIds: ['athens-agora-main'],
        },
      ],
      routes: [
        {
          routeId: 'athens-agora-main',
          cityId: 'athens',
          productId: 'athens-agora',
          name: 'Agora main',
          pathKey: 'a',
          stops: [],
        },
      ],
      stops: [],
    }

    __setPublishedPackagesForTests([rome, athens])

    expect(getPublishedCities().map((c) => c.cityId).sort()).toEqual(['athens', 'rome'])
    expect(getCityRoute('athens')?.pathname).toBe('/athens')
    expect(resolveDeepLink('/athens')).toMatchObject({
      kind: 'city',
      cityId: 'athens',
      known: true,
    })
    expect(resolveProductSlug('athens', 'agora')?.productId).toBe('athens-agora')
    expect(getProductRoute('athens-agora')?.pathname).toBe('/athens/agora')
    expect(getJourneyRoute('athens-agora-main')?.pathname).toBe('/athens/agora/journey')

    __setPublishedPackagesForTests(null)
    clearCatalogCache()
    expect(getPublishedCities().map((c) => c.cityId)).toEqual(['rome'])
  })
})
