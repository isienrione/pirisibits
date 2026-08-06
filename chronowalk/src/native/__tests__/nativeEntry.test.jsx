import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { __setPublishedPackagesForTests } from '../../catalog/cityRegistry.js'
import { clearCatalogCache } from '../../catalog/catalogService.js'
import { loadCityPackage } from '../../content/cityPackage/index.js'
import {
  shouldUseNativeAppEntry,
  getNativeEntryModel,
  getNativeFreePreviewPath,
  listNativeSoloProductsForCity,
} from '../nativeEntryRouting.js'
import { NativeAppEntry } from '../NativeAppEntry.jsx'
import { NativeProductList } from '../NativeProductList.jsx'
import { JOURNEY_STATES } from '../../state/journey.js'

function stubCapacitor({ native = false, platform = 'web' } = {}) {
  vi.stubGlobal('Capacitor', {
    isNativePlatform: () => native,
    getPlatform: () => platform,
    isNative: native,
  })
  if (typeof window !== 'undefined') {
    window.Capacitor = {
      isNativePlatform: () => native,
      getPlatform: () => platform,
      isNative: native,
    }
  }
}

beforeEach(() => {
  vi.unstubAllGlobals()
  if (typeof window !== 'undefined') {
    delete window.Capacitor
  }
  clearCatalogCache()
  __setPublishedPackagesForTests(null)
})

describe('web vs native root entry', () => {
  it('web root keeps the marketing entry path (shouldUseNativeAppEntry false)', () => {
    expect(shouldUseNativeAppEntry()).toBe(false)
  })

  it('native iOS root selects NativeAppEntry', () => {
    stubCapacitor({ native: true, platform: 'ios' })
    expect(shouldUseNativeAppEntry()).toBe(true)

    render(
      <MemoryRouter>
        <NativeAppEntry forceNative />
      </MemoryRouter>,
    )
    expect(screen.getByTestId('native-app-entry')).toBeTruthy()
    expect(screen.getByTestId('native-city-home')).toBeTruthy()
  })
})

describe('catalog-driven native entry', () => {
  it('derives published cities from the catalog and presents Rome directly', () => {
    const model = getNativeEntryModel()
    expect(model.ok).toBe(true)
    expect(model.mode).toBe('city_home')
    expect(model.cities.map((c) => c.cityId)).toEqual(['rome'])
    expect(model.city.cityId).toBe('rome')
    expect(model.cities.some((c) => c.cityId === 'harbor')).toBe(false)
  })

  it('never shows the harbor fixture', () => {
    const harbor = loadCityPackage('harbor')
    expect(harbor.isFixture).toBe(true)
    const model = getNativeEntryModel()
    expect(model.cities.map((c) => c.cityId)).not.toContain('harbor')
    expect(JSON.stringify(model)).not.toMatch(/harbor-loop/i)
  })

  it('fails safely when no published cities exist', () => {
    __setPublishedPackagesForTests([])
    const model = getNativeEntryModel({ cities: [] })
    expect(model.ok).toBe(false)
    expect(model.code).toBe('no_published_cities')
  })

  it('supports a second published city without Rome-specific branching', () => {
    const rome = loadCityPackage('rome')
    const athensLike = {
      ...loadCityPackage('harbor'),
      cityId: 'athens',
      isFixture: false,
      metadata: { ...loadCityPackage('harbor').metadata, published: true, cityId: 'athens' },
      city: {
        cityId: 'athens',
        name: 'Athens',
        slug: 'athens',
        defaultLocale: 'en',
      },
      products: [
        {
          productId: 'athens-agora',
          cityId: 'athens',
          name: 'Agora Walk',
          routeIds: ['harbor-loop-main'],
        },
      ],
    }
    // Inject two published cities into the model via options.cities
    const model = getNativeEntryModel({
      cities: [
        { cityId: 'rome', name: 'Rome', slug: 'rome' },
        { cityId: 'athens', name: 'Athens', slug: 'athens' },
      ],
    })
    expect(model.mode).toBe('city_list')
    expect(model.cities.map((c) => c.cityId).sort()).toEqual(['athens', 'rome'])

    const selected = getNativeEntryModel({
      cities: model.cities,
      selectedCityId: 'athens',
    })
    expect(selected.mode).toBe('city_home')
    expect(selected.city.cityId).toBe('athens')
    // No Rome hard-branch required for selection.
    expect(selected.city.cityId).not.toBe('rome')
    void rome
    void athensLike
  })
})

describe('continue walk and free preview', () => {
  it('shows continue walk only when progress exists', () => {
    const idle = getNativeEntryModel({
      journeySnapshot: { state: JOURNEY_STATES.IDLE, context: {} },
    })
    expect(idle.continueWalk.available).toBe(false)

    const resumable = getNativeEntryModel({
      journeySnapshot: {
        state: JOURNEY_STATES.WALKING,
        context: { currentSequenceIndex: 2, completedWaypointIds: ['w01'] },
      },
    })
    expect(resumable.continueWalk.available).toBe(true)
    expect(resumable.continueWalk.path).toBeTruthy()
  })

  it('resolves Pantheon free preview correctly', () => {
    expect(getNativeFreePreviewPath('rome')).toBe('/preview')
    expect(getNativeFreePreviewPath('athens')).toBeNull()
    const model = getNativeEntryModel()
    expect(model.freePreviewPath).toBe('/preview')
  })
})

describe('native product list and purchases', () => {
  it('uses current catalog solo products (Eterna, Antica, Historica)', () => {
    const products = listNativeSoloProductsForCity('rome')
    expect(products.map((p) => p.productId)).toEqual([
      'rome-complete',
      'rome-essential',
      'rome-central',
    ])
    expect(products.map((p) => p.name)).toEqual([
      'Roma Eterna',
      'Roma Antica',
      'Roma Historica',
    ])
    expect(products.every((p) => p.kind === 'solo')).toBe(true)
  })

  it('never invokes Paddle from the native purchase CTA', async () => {
    const purchaseProduct = vi.fn(async () => ({ ok: false, code: 'apple_product_disabled' }))
    const purchaseService = {
      canPurchaseProduct: () => ({ ok: false, code: 'apple_product_disabled' }),
      purchaseProduct,
      getAvailableProducts: async () => ({ ok: true, products: [] }),
      restorePurchases: async () => ({ ok: true, candidates: [] }),
      canInvokePaddleCheckout: () => false,
    }

    // Ensure paddle checkout is not available in this stubbed native context.
    stubCapacitor({ native: true, platform: 'ios' })
    const { canInvokePaddleCheckout } = await import('../../purchases/purchaseProvider.js')
    expect(canInvokePaddleCheckout()).toBe(false)

    render(
      <MemoryRouter>
        <NativeProductList
          products={listNativeSoloProductsForCity('rome')}
          purchaseService={purchaseService}
        />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getAllByRole('button', { name: 'Purchase' })[0])
    await waitFor(() => {
      expect(screen.getByText(/Apple In-App Purchase is not configured/i)).toBeTruthy()
    })
    // Gate failed before purchaseProduct — still ensure paddle was never the path.
    expect(canInvokePaddleCheckout()).toBe(false)
    expect(purchaseProduct).not.toHaveBeenCalled()
  })

  it('exposes Restore Purchases on the native home', async () => {
    stubCapacitor({ native: true, platform: 'ios' })
    const restorePurchases = vi.fn(async () => ({
      ok: true,
      candidates: [],
      serverVerified: false,
    }))
    render(
      <MemoryRouter>
        <NativeAppEntry
          forceNative
          purchaseService={{
            restorePurchases,
            canPurchaseProduct: () => ({ ok: false }),
            purchaseProduct: async () => ({ ok: false }),
            getAvailableProducts: async () => ({ ok: true, products: [] }),
          }}
          downloadService={{
            getDownloadStatus: async () => ({ status: 'not_downloaded' }),
          }}
        />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Restore Purchases' }))
    await waitFor(() => {
      expect(restorePurchases).toHaveBeenCalled()
    })
  })
})
