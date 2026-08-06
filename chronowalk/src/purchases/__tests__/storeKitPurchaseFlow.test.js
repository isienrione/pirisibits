import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createStoreKitPurchaseAdapter,
  canInvokePaddleCheckout,
  resolvePurchaseProvider,
} from '../index.js'
import { openCheckout } from '../../lib/checkout.js'

const PURCHASE_TYPE = Object.freeze({
  INAPP: 'inapp',
  SUBS: 'subs',
})

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000'

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

describe('StoreKit adapter Capgo INAPP API', () => {
  it('getProducts receives PURCHASE_TYPE.INAPP', async () => {
    const getProducts = vi.fn(async () => ({
      products: [
        {
          productIdentifier: 'com.chronowalk.city.rome.eterna',
          priceString: '€14.99',
          title: 'Roma Eterna',
        },
      ],
    }))

    const adapter = createStoreKitPurchaseAdapter({
      canUseStoreKit: () => true,
      treatMappingsEnabled: true,
      purchaseType: PURCHASE_TYPE,
      nativePurchases: { getProducts },
    })

    await adapter.getAvailableProducts(['rome-complete'])
    expect(getProducts).toHaveBeenCalledWith({
      productIdentifiers: ['com.chronowalk.city.rome.eterna'],
      productType: PURCHASE_TYPE.INAPP,
    })
  })

  it('purchaseProduct receives PURCHASE_TYPE.INAPP and quantity 1', async () => {
    const purchaseProduct = vi.fn(async () => ({
      transactionId: 'txn_1',
      productIdentifier: 'com.chronowalk.city.rome.eterna',
    }))

    const adapter = createStoreKitPurchaseAdapter({
      canUseStoreKit: () => true,
      treatMappingsEnabled: true,
      purchaseType: PURCHASE_TYPE,
      nativePurchases: { purchaseProduct },
    })

    await adapter.purchaseProduct('rome-complete')
    expect(purchaseProduct).toHaveBeenCalledWith({
      productIdentifier: 'com.chronowalk.city.rome.eterna',
      productType: PURCHASE_TYPE.INAPP,
      quantity: 1,
    })
  })

  it('omits undefined appAccountToken', async () => {
    const purchaseProduct = vi.fn(async () => ({
      transactionId: 'txn_1',
      productIdentifier: 'com.chronowalk.city.rome.eterna',
    }))
    const adapter = createStoreKitPurchaseAdapter({
      canUseStoreKit: () => true,
      treatMappingsEnabled: true,
      purchaseType: PURCHASE_TYPE,
      nativePurchases: { purchaseProduct },
    })

    await adapter.purchaseProduct('rome-complete', { appAccountToken: undefined })
    expect(purchaseProduct.mock.calls[0][0]).toEqual({
      productIdentifier: 'com.chronowalk.city.rome.eterna',
      productType: 'inapp',
      quantity: 1,
    })
    expect('appAccountToken' in purchaseProduct.mock.calls[0][0]).toBe(false)
  })

  it('passes a valid UUID appAccountToken', async () => {
    const purchaseProduct = vi.fn(async () => ({
      transactionId: 'txn_1',
      productIdentifier: 'com.chronowalk.city.rome.eterna',
    }))
    const adapter = createStoreKitPurchaseAdapter({
      canUseStoreKit: () => true,
      treatMappingsEnabled: true,
      purchaseType: PURCHASE_TYPE,
      nativePurchases: { purchaseProduct },
    })

    await adapter.purchaseProduct('rome-complete', { appAccountToken: VALID_UUID })
    expect(purchaseProduct.mock.calls[0][0]).toEqual({
      productIdentifier: 'com.chronowalk.city.rome.eterna',
      productType: 'inapp',
      quantity: 1,
      appAccountToken: VALID_UUID,
    })
  })

  it('omits invalid appAccountToken', async () => {
    const purchaseProduct = vi.fn(async () => ({
      transactionId: 'txn_1',
      productIdentifier: 'com.chronowalk.city.rome.eterna',
    }))
    const adapter = createStoreKitPurchaseAdapter({
      canUseStoreKit: () => true,
      treatMappingsEnabled: true,
      purchaseType: PURCHASE_TYPE,
      nativePurchases: { purchaseProduct },
    })

    await adapter.purchaseProduct('rome-complete', { appAccountToken: 'user@example.com' })
    expect('appAccountToken' in purchaseProduct.mock.calls[0][0]).toBe(false)
    expect(purchaseProduct.mock.calls[0][0].quantity).toBe(1)
    expect(purchaseProduct.mock.calls[0][0].productType).toBe('inapp')
  })

  it('purchase timeout returns storekit_request_timeout', async () => {
    const adapter = createStoreKitPurchaseAdapter({
      canUseStoreKit: () => true,
      treatMappingsEnabled: true,
      purchaseType: PURCHASE_TYPE,
      requestTimeoutMs: 30,
      nativePurchases: {
        purchaseProduct() {
          return new Promise(() => {})
        },
      },
    })

    const result = await adapter.purchaseProduct('rome-complete')
    expect(result.ok).toBe(false)
    expect(result.code).toBe('storekit_request_timeout')
  })

  it('lazy-loads NativePurchases and PURCHASE_TYPE together', async () => {
    const getProducts = vi.fn(async () => ({ products: [] }))
    const loadPlugin = vi.fn(async () => ({
      NativePurchases: { getProducts },
      PURCHASE_TYPE,
    }))

    const adapter = createStoreKitPurchaseAdapter({
      canUseStoreKit: () => true,
      treatMappingsEnabled: true,
      loadPlugin,
    })

    await adapter.getAvailableProducts(['rome-complete'])
    expect(loadPlugin).toHaveBeenCalledTimes(1)
    expect(getProducts).toHaveBeenCalledWith(
      expect.objectContaining({ productType: PURCHASE_TYPE.INAPP }),
    )
  })

  it('keeps localized prices from StoreKit only', async () => {
    const adapter = createStoreKitPurchaseAdapter({
      canUseStoreKit: () => true,
      treatMappingsEnabled: true,
      purchaseType: PURCHASE_TYPE,
      nativePurchases: {
        async getProducts(opts) {
          expect(opts.productType).toBe('inapp')
          return {
            products: [
              {
                productIdentifier: 'com.chronowalk.city.rome.eterna',
                priceString: '€14.99',
                currencyCode: 'EUR',
                title: 'Roma Eterna',
              },
            ],
          }
        },
      },
    })
    const { products } = await adapter.getAvailableProducts(['rome-complete'])
    const eterna = products.find((p) => p.productId === 'rome-complete')
    expect(eterna.localizedPriceString).toBe('€14.99')
    expect(eterna.amountCents).toBeNull()
    expect(eterna.priceSource).toBe('storekit')
  })

  it('Paddle remains unavailable on native iOS', async () => {
    stubCapacitor({ native: true, platform: 'ios' })
    expect(resolvePurchaseProvider().provider).toBe('storekit')
    expect(canInvokePaddleCheckout()).toBe(false)
    const checkout = await openCheckout({ tierId: 'rome-complete', source: 'test' })
    expect(checkout.reason).toBe('paddle_unavailable_on_native')
  })
})
