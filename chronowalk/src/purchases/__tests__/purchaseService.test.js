import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearEntitlementStore } from '../../commerce/entitlementService.js'
import { isEntitlementActive } from '../../commerce/entitlementModel.js'
import { resolveProductForProvider, createDisabledAppleMapping } from '../../commerce/providerMappings.js'
import {
  createPurchaseService,
  resolvePurchaseProvider,
  canInvokePaddleCheckout,
  normalizeAppleTransaction,
  dedupeAppleEntitlements,
  isLocalAppleCandidate,
  isServerVerifiedEntitlement,
  processRestoredTransactions,
  verifyAppleTransaction,
  APPLE_PRODUCT_IDS,
  getStoreKitMapping,
  isApplePurchaseDeferred,
  listApplePurchasableMappings,
  createStoreKitPurchaseAdapter,
  STOREKIT_PLUGIN_ID,
} from '../index.js'
import { canUseWebCheckout, canUseStoreKitPurchase, canUsePaddleCheckout } from '../../platform/runtime/index.js'
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
  if (typeof window !== 'undefined') {
    delete window.Capacitor
  }
  clearEntitlementStore()
})

describe('purchase provider selection', () => {
  it('web selects the Paddle-compatible purchase provider', () => {
    const provider = resolvePurchaseProvider()
    expect(provider.provider).toBe('paddle')
    expect(provider.canUsePaddle).toBe(true)
    expect(canInvokePaddleCheckout()).toBe(true)
    expect(canUseWebCheckout()).toBe(true)
    expect(canUsePaddleCheckout()).toBe(true)
    expect(canUseStoreKitPurchase()).toBe(false)

    const service = createPurchaseService()
    expect(service.getPurchaseProvider().provider).toBe('paddle')
  })

  it('native iOS selects StoreKit', () => {
    stubCapacitor({ native: true, platform: 'ios' })
    const provider = resolvePurchaseProvider()
    expect(provider.provider).toBe('storekit')
    expect(provider.canUsePaddle).toBe(false)
    expect(provider.canUseStoreKit).toBe(true)
    expect(canUseStoreKitPurchase()).toBe(true)
  })

  it('native iOS cannot invoke Paddle checkout', async () => {
    stubCapacitor({ native: true, platform: 'ios' })
    expect(canInvokePaddleCheckout()).toBe(false)
    expect(canUseWebCheckout()).toBe(false)
    expect(canUsePaddleCheckout()).toBe(false)

    const result = await openCheckout({ tierId: 'rome-complete', source: 'test' })
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('paddle_unavailable_on_native')

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
    // Even if someone tries the web adapter path, canInvokePaddleCheckout is false.
    expect(service.canInvokePaddleCheckout()).toBe(false)
  })

  it('unknown platforms fail safely', () => {
    stubCapacitor({ native: true, platform: 'android' })
    const provider = resolvePurchaseProvider()
    expect(provider.provider).toBe('none')
    expect(provider.canUsePaddle).toBe(false)
    expect(provider.canUseStoreKit).toBe(false)

    const service = createPurchaseService()
    expect(service.canPurchaseProduct('rome-complete').ok).toBe(false)
    expect(service.canPurchaseProduct('rome-complete').code).toBe('unsupported_platform')
  })
})

describe('Apple product mappings', () => {
  it('maps Apple product identifiers to canonical internal product IDs', () => {
    expect(APPLE_PRODUCT_IDS['rome-central']).toBe('com.chronowalk.city.rome.historica')
    expect(APPLE_PRODUCT_IDS['rome-essential']).toBe('com.chronowalk.city.rome.antica')
    expect(APPLE_PRODUCT_IDS['rome-complete']).toBe('com.chronowalk.city.rome.eterna')

    expect(getStoreKitMapping('rome-complete')?.appleProductId).toBe(
      'com.chronowalk.city.rome.eterna',
    )
    expect(getStoreKitMapping('rome-complete')?.enabled).toBe(false)
  })

  it('keeps Couple and Family disabled / deferred for Apple purchase', () => {
    expect(isApplePurchaseDeferred('rome-couple')).toBe(true)
    expect(isApplePurchaseDeferred('rome-family')).toBe(true)
    expect(getStoreKitMapping('rome-couple')?.enabled).toBe(false)
    expect(getStoreKitMapping('rome-family')?.enabled).toBe(false)
    expect(listApplePurchasableMappings().map((m) => m.productId)).toEqual([
      'rome-central',
      'rome-essential',
      'rome-complete',
    ])

    stubCapacitor({ native: true, platform: 'ios' })
    const service = createPurchaseService({
      storeKitAdapterOptions: { treatMappingsEnabled: true },
    })
    expect(service.canPurchaseProduct('rome-couple').ok).toBe(false)
    expect(service.canPurchaseProduct('rome-couple').code).toBe('apple_product_deferred')
  })
})

describe('transaction normalization', () => {
  it('normalizes Apple transactions into generic entitlements', () => {
    const entitlement = normalizeAppleTransaction({
      transactionId: 'txn_100',
      originalTransactionId: 'txn_100',
      productId: 'com.chronowalk.city.rome.eterna',
      purchaseDate: '2026-08-05T00:00:00.000Z',
      jwsRepresentation: 'header.payload.sig',
    })
    expect(entitlement).toMatchObject({
      productId: 'rome-complete',
      contentProductId: 'rome-complete',
      source: 'apple',
      externalTransactionId: 'txn_100',
      status: 'active',
    })
    expect(entitlement.metadata.serverVerified).toBe(false)
    expect(entitlement.metadata.originalTransactionId).toBe('txn_100')
    expect(isLocalAppleCandidate(entitlement)).toBe(true)
    expect(isServerVerifiedEntitlement(entitlement)).toBe(false)
    expect(isEntitlementActive(entitlement)).toBe(true)
  })

  it('marks revoked/refunded Apple transactions inactive', () => {
    const revoked = normalizeAppleTransaction({
      transactionId: 'txn_rev',
      productId: 'com.chronowalk.city.rome.historica',
      revocationDate: '2026-08-05T12:00:00.000Z',
      revoked: true,
    })
    expect(revoked.status).toBe('revoked')
    expect(isEntitlementActive(revoked)).toBe(false)

    const refunded = normalizeAppleTransaction({
      transactionId: 'txn_ref',
      productId: 'com.chronowalk.city.rome.antica',
      status: 'refunded',
      refundedAt: '2026-08-05T12:00:00.000Z',
    })
    expect(refunded.status).toBe('refunded')
    expect(isEntitlementActive(refunded)).toBe(false)
  })

  it('deduplicates duplicate transactions deterministically', () => {
    const a = normalizeAppleTransaction({
      transactionId: 'txn_dup',
      productId: 'com.chronowalk.city.rome.eterna',
      purchaseDate: '2026-01-01T00:00:00.000Z',
    })
    const b = normalizeAppleTransaction({
      transactionId: 'txn_dup',
      productId: 'com.chronowalk.city.rome.eterna',
      purchaseDate: '2026-06-01T00:00:00.000Z',
    })
    const deduped = dedupeAppleEntitlements([a, b])
    expect(deduped).toHaveLength(1)
    expect(deduped[0].externalTransactionId).toBe('txn_dup')
    expect(deduped[0].grantedAt).toBe('2026-06-01T00:00:00.000Z')
  })
})

describe('restore purchases', () => {
  it('returns normalized entitlement candidates', () => {
    const result = processRestoredTransactions(
      [
        {
          transactionId: 'txn_r1',
          originalTransactionId: 'txn_r1',
          productId: 'com.chronowalk.city.rome.eterna',
        },
        {
          transactionId: 'txn_r1',
          originalTransactionId: 'txn_r1',
          productId: 'com.chronowalk.city.rome.eterna',
        },
      ],
      { subjectId: 'user_1' },
    )
    expect(result.ok).toBe(true)
    expect(result.serverVerified).toBe(false)
    expect(result.candidates).toHaveLength(1)
    expect(result.candidates[0].productId).toBe('rome-complete')
    expect(result.preparedForVerification[0].transactionId).toBe('txn_r1')
  })

  it('does not treat local purchase results as server-verified permanent access', async () => {
    stubCapacitor({ native: true, platform: 'ios' })
    const nativePurchases = {
      async isBillingSupported() {
        return true
      },
      async getProducts() {
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
      async purchaseProduct() {
        return {
          transactionId: 'txn_local',
          originalTransactionId: 'txn_local',
          productIdentifier: 'com.chronowalk.city.rome.eterna',
          jwsRepresentation: 'a.b.c',
        }
      },
      async restorePurchases() {
        return [
          {
            transactionId: 'txn_local',
            productId: 'com.chronowalk.city.rome.eterna',
          },
        ]
      },
    }

    const adapter = createStoreKitPurchaseAdapter({
      nativePurchases,
      canUseStoreKit: () => true,
      treatMappingsEnabled: true,
    })
    const purchased = await adapter.purchaseProduct('rome-complete', { subjectId: 'user_1' })
    expect(purchased.ok).toBe(true)
    expect(purchased.serverVerified).toBe(false)
    expect(purchased.localCandidate).toBe(true)
    expect(isServerVerifiedEntitlement(purchased.entitlement)).toBe(false)

    const restored = await adapter.restorePurchases({ subjectId: 'user_1' })
    expect(restored.serverVerified).toBe(false)
    expect(restored.candidates[0].metadata.verificationState).toBe('local_unverified')
  })

  it('does not replace localized StoreKit prices with hard-coded catalog cents', async () => {
    const adapter = createStoreKitPurchaseAdapter({
      nativePurchases: {
        async getProducts() {
          return {
            products: [
              {
                productIdentifier: 'com.chronowalk.city.rome.eterna',
                priceString: '€14.99',
                currencyCode: 'EUR',
              },
            ],
          }
        },
      },
      canUseStoreKit: () => true,
    })
    const { products } = await adapter.getAvailableProducts(['rome-complete'])
    const eterna = products.find((p) => p.productId === 'rome-complete')
    expect(eterna.localizedPriceString).toBe('€14.99')
    expect(eterna.priceSource).toBe('storekit')
    expect(eterna.amountCents).toBeNull()
  })

  it('produces a controlled error when StoreKit capability is missing', async () => {
    const adapter = createStoreKitPurchaseAdapter({
      nativePurchases: {},
      canUseStoreKit: () => true,
      treatMappingsEnabled: true,
    })
    const result = await adapter.purchaseProduct('rome-complete')
    expect(result.ok).toBe(false)
    expect(result.code).toBe('storekit_capability_missing')
    expect(STOREKIT_PLUGIN_ID).toBe('@capgo/native-purchases')
  })
})

describe('commerce paddle mappings unchanged', () => {
  it('keeps existing Paddle resolution and disabled Apple commerce placeholders', () => {
    expect(resolveProductForProvider('paddle', 'rome-complete')).toBe('rome-complete')
    expect(resolveProductForProvider('apple', 'com.chronowalk.city.rome.eterna')).toBeNull()
    const mapping = createDisabledAppleMapping('rome-complete', 'com.chronowalk.rome.complete')
    expect(mapping.enabled).toBe(false)
  })
})

describe('server verification contract', () => {
  it('supports idempotency and revocation failure states without granting access', async () => {
    const missing = await verifyAppleTransaction({})
    expect(missing.ok).toBe(false)
    expect(missing.status).toBe('invalid')
    expect(missing.serverVerified).toBe(false)

    const notConfigured = await verifyAppleTransaction({
      transactionId: 'txn_1',
      productId: 'rome-complete',
      signedTransaction: 'a.b.c',
      idempotencyKey: 'idem_1',
    })
    expect(notConfigured.ok).toBe(false)
    expect(notConfigured.status).toBe('not_configured')
    expect(notConfigured.serverVerified).toBe(false)
    expect(notConfigured.errorCode).toBe('apple_verification_not_configured')
  })
})
