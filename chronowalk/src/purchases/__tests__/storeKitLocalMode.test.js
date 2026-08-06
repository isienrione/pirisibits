import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createPurchaseService,
  createStoreKitPurchaseAdapter,
  getStoreKitMapping,
  getStoreKitMode,
  isStoreKitLocalMode,
  isStoreKitMappingEnabled,
  isApplePurchaseDeferred,
  listApplePurchasableMappings,
  LOCAL_STOREKIT_SOLO_PRODUCT_IDS,
  canInvokePaddleCheckout,
  resolvePurchaseProvider,
} from '../index.js'
import { openCheckout } from '../../lib/checkout.js'

function stubCapacitor({ native = false, platform = 'web' } = {}) {
  vi.stubGlobal('window', {
    Capacitor: {
      isNativePlatform: () => native,
      getPlatform: () => platform,
      isNative: native,
    },
  })
}

beforeEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  if (typeof window !== 'undefined') {
    delete window.Capacitor
  }
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('StoreKit local mode (VITE_STOREKIT_MODE)', () => {
  it('default mode keeps Apple products disabled and production mappings unchanged', () => {
    expect(getStoreKitMode()).toBe('default')
    expect(isStoreKitLocalMode()).toBe(false)

    for (const productId of LOCAL_STOREKIT_SOLO_PRODUCT_IDS) {
      const mapping = getStoreKitMapping(productId)
      expect(mapping.enabled).toBe(false)
      expect(mapping.environment).toBe('unconfigured')
      expect(isStoreKitMappingEnabled(mapping)).toBe(false)
    }

    expect(listApplePurchasableMappings({ includeDisabled: false })).toEqual([])

    stubCapacitor({ native: true, platform: 'ios' })
    const service = createPurchaseService()
    expect(service.canPurchaseProduct('rome-complete').ok).toBe(false)
    expect(service.canPurchaseProduct('rome-complete').code).toBe('apple_product_disabled')
    expect(service.canPurchaseProduct('rome-central').code).toBe('apple_product_disabled')
    expect(service.canPurchaseProduct('rome-essential').code).toBe('apple_product_disabled')
  })

  it('local mode enables only the three solo Rome products', () => {
    vi.stubEnv('VITE_STOREKIT_MODE', 'local')
    expect(getStoreKitMode()).toBe('local')
    expect(isStoreKitLocalMode()).toBe(true)

    for (const productId of LOCAL_STOREKIT_SOLO_PRODUCT_IDS) {
      const mapping = getStoreKitMapping(productId)
      expect(mapping.enabled).toBe(false)
      expect(isStoreKitMappingEnabled(mapping)).toBe(true)
    }

    expect(
      listApplePurchasableMappings({ includeDisabled: false }).map((m) => m.productId),
    ).toEqual(['rome-central', 'rome-essential', 'rome-complete'])

    stubCapacitor({ native: true, platform: 'ios' })
    const service = createPurchaseService()
    expect(service.canPurchaseProduct('rome-central')).toMatchObject({
      ok: true,
      provider: 'storekit',
      appleProductId: 'com.chronowalk.city.rome.historica',
    })
    expect(service.canPurchaseProduct('rome-essential').ok).toBe(true)
    expect(service.canPurchaseProduct('rome-complete').ok).toBe(true)
  })

  it('Couple and Family remain disabled in local mode', () => {
    vi.stubEnv('VITE_STOREKIT_MODE', 'local')
    expect(isApplePurchaseDeferred('rome-couple')).toBe(true)
    expect(isApplePurchaseDeferred('rome-family')).toBe(true)
    expect(isStoreKitMappingEnabled(getStoreKitMapping('rome-couple'))).toBe(false)
    expect(isStoreKitMappingEnabled(getStoreKitMapping('rome-family'))).toBe(false)

    stubCapacitor({ native: true, platform: 'ios' })
    const service = createPurchaseService()
    expect(service.canPurchaseProduct('rome-couple')).toMatchObject({
      ok: false,
      code: 'apple_product_deferred',
    })
    expect(service.canPurchaseProduct('rome-family').code).toBe('apple_product_deferred')
  })

  it('local StoreKit products can be requested with localized title and price', async () => {
    vi.stubEnv('VITE_STOREKIT_MODE', 'local')

    const getProducts = vi.fn(async ({ productIdentifiers }) => ({
      products: productIdentifiers.map((id) => ({
        productIdentifier: id,
        priceString: id.endsWith('eterna') ? '€14.99' : '€9.99',
        currencyCode: 'EUR',
        title:
          id.endsWith('eterna')
            ? 'Roma Eterna'
            : id.endsWith('antica')
              ? 'Roma Antica'
              : 'Roma Historica',
      })),
    }))

    const adapter = createStoreKitPurchaseAdapter({
      canUseStoreKit: () => true,
      nativePurchases: { getProducts },
    })

    const result = await adapter.getAvailableProducts([
      'rome-central',
      'rome-essential',
      'rome-complete',
    ])

    expect(result.ok).toBe(true)
    expect(getProducts).toHaveBeenCalledTimes(1)
    const requested = getProducts.mock.calls[0][0].productIdentifiers
    expect(requested).toEqual([
      'com.chronowalk.city.rome.historica',
      'com.chronowalk.city.rome.antica',
      'com.chronowalk.city.rome.eterna',
    ])

    const eterna = result.products.find((p) => p.productId === 'rome-complete')
    expect(eterna).toMatchObject({
      enabled: true,
      localizedPriceString: '€14.99',
      title: 'Roma Eterna',
      priceSource: 'storekit',
      amountCents: null,
    })
    expect(result.products.every((p) => p.enabled)).toBe(true)
    expect(result.products.every((p) => p.amountCents === null)).toBe(true)
  })

  it('Paddle remains unavailable in native iOS even when local StoreKit mode is on', async () => {
    vi.stubEnv('VITE_STOREKIT_MODE', 'local')
    stubCapacitor({ native: true, platform: 'ios' })

    const provider = resolvePurchaseProvider()
    expect(provider.provider).toBe('storekit')
    expect(provider.canUsePaddle).toBe(false)
    expect(canInvokePaddleCheckout()).toBe(false)

    const checkout = await openCheckout({ tierId: 'rome-complete', source: 'test' })
    expect(checkout.ok).toBe(false)
    expect(checkout.reason).toBe('paddle_unavailable_on_native')

    const service = createPurchaseService({
      webAdapter: {
        kind: 'paddle',
        provider: 'paddle',
        async purchaseProduct() {
          throw new Error('Paddle must not be called on native')
        },
        async getAvailableProducts() {
          return { ok: false, products: [] }
        },
        async restorePurchases() {
          return { ok: false }
        },
        async refreshEntitlements() {
          return { ok: false }
        },
        async isAvailable() {
          return false
        },
      },
    })
    expect(service.canInvokePaddleCheckout()).toBe(false)
    expect(service.canPurchaseProduct('rome-complete').provider).toBe('storekit')
  })

  it('mapping.enabled === true still enables products without local mode', () => {
    expect(isStoreKitLocalMode()).toBe(false)
    const synthetic = {
      ...getStoreKitMapping('rome-complete'),
      enabled: true,
    }
    expect(isStoreKitMappingEnabled(synthetic)).toBe(true)
  })
})
