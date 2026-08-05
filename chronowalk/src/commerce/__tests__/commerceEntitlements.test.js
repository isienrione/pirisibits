import { describe, expect, it, beforeEach } from 'vitest'
import {
  LAUNCH_PRODUCT_IDS,
  PRODUCT_NAME_ALIASES,
  getLaunchCatalogFingerprint,
  listCommerceProducts,
  getCommerceProduct,
  resolveInternalProductId,
  getProviderMapping,
  resolveProductForProvider,
  listEnabledProviderMappings,
  createDisabledAppleMapping,
  normalizePaddlePurchase,
  normalizeLegacyPurchase,
  normalizeAccessTokenGrant,
  createEntitlement,
  isEntitlementActive,
  dedupeEntitlements,
  hasForbiddenRomeAccessField,
  clearEntitlementStore,
  grantEntitlement,
  hasEntitlement,
  getEntitledProductIds,
  getUnlockedContentProductIds,
  getProductsUnlockedByEntitlement,
  listBundleProductShapes,
} from '../index.js'
import {
  LAUNCH_CATALOG_BY_ID as GEN_BY_ID,
  LAUNCH_CATALOG_FINGERPRINT,
  LAUNCH_CATALOG_PRODUCTS,
} from '../../lib/generated/launchCatalog.gen.js'

import { getLaunchCatalogFingerprint as fp } from '../commerceCatalog.js'

beforeEach(() => {
  clearEntitlementStore()
})

describe('current Rome products resolve generically', () => {
  it('exposes all launch SKUs from the generated catalog', () => {
    expect(LAUNCH_PRODUCT_IDS).toEqual([
      'rome-central',
      'rome-essential',
      'rome-complete',
      'rome-couple',
      'rome-family',
    ])
    for (const id of LAUNCH_PRODUCT_IDS) {
      expect(getCommerceProduct(id)?.productId).toBe(id)
      expect(resolveInternalProductId(id)).toBe(id)
    }
  })

  it('resolves marketing names and catalog package id without renaming SKUs', () => {
    expect(resolveInternalProductId('rome-historica')).toBe('rome-central')
    expect(resolveInternalProductId('rome-antica')).toBe('rome-essential')
    expect(resolveInternalProductId('rome-eternal')).toBe('rome-complete')
    expect(getCommerceProduct('rome-central').name).toBe('Roma Historica')
    expect(getCommerceProduct('rome-essential').name).toBe('Roma Antica')
    // Stored ids unchanged
    expect(LAUNCH_PRODUCT_IDS).not.toContain('rome-historica')
    expect(LAUNCH_PRODUCT_IDS).not.toContain('rome-antica')
    expect(LAUNCH_PRODUCT_IDS).not.toContain('rome-eternal')
  })
})

describe('Paddle product mappings', () => {
  it('maps paddle provider entries to current internal product ids', () => {
    for (const id of LAUNCH_PRODUCT_IDS) {
      const mapping = getProviderMapping(id, 'paddle')
      expect(mapping?.enabled).toBe(true)
      expect(mapping?.productId).toBe(id)
      expect(mapping?.clientPriceEnvKey).toMatch(/^VITE_PADDLE_PRICE_/)
      expect(mapping?.serverPriceEnvKey).toMatch(/^PADDLE_PRICE_/)
      expect(resolveProductForProvider('paddle', id)).toBe(id)
    }
  })

  it('resolves paddle price ids via priceMap (server-style)', () => {
    const priceMap = {
      pri_test_complete: { productId: 'rome-complete', contentProductId: 'rome-complete', seatLimit: 1 },
      pri_test_couple: { productId: 'rome-couple', contentProductId: 'rome-complete', seatLimit: 2 },
    }
    expect(resolveProductForProvider('paddle', 'pri_test_complete', { priceMap })).toBe(
      'rome-complete',
    )
    expect(resolveProductForProvider('paddle', 'pri_test_couple', { priceMap })).toBe('rome-couple')
  })

  it('fails safely for unknown provider ids', () => {
    expect(resolveProductForProvider('paddle', 'pri_unknown')).toBeNull()
    expect(resolveProductForProvider('paddle', 'not-a-sku')).toBeNull()
    expect(getProviderMapping('rome-mars', 'paddle')).toBeNull()
    expect(normalizePaddlePurchase({ id: 'txn_1', productId: 'nope' })).toBeNull()
  })
})

describe('entitlement access semantics', () => {
  it('active entitlements grant access; revoked/inactive do not', () => {
    const subject = 'user-1'
    grantEntitlement(
      subject,
      createEntitlement({
        subjectId: subject,
        productId: 'rome-complete',
        source: 'paddle',
        status: 'active',
      }),
    )
    expect(hasEntitlement(subject, 'rome-complete')).toBe(true)
    expect(getEntitledProductIds(subject)).toEqual(['rome-complete'])

    grantEntitlement(
      subject,
      createEntitlement({
        subjectId: subject,
        productId: 'rome-central',
        source: 'paddle',
        status: 'revoked',
        revokedAt: '2026-01-01T00:00:00.000Z',
        externalTransactionId: 'txn_revoked',
      }),
    )
    expect(hasEntitlement(subject, 'rome-central')).toBe(false)
    expect(isEntitlementActive(createEntitlement({
      productId: 'rome-essential',
      source: 'manual',
      status: 'inactive',
    }))).toBe(false)
  })

  it('provider source does not alter entitlement semantics', () => {
    const paddle = createEntitlement({
      productId: 'rome-essential',
      source: 'paddle',
      status: 'active',
      externalTransactionId: 'txn_a',
    })
    const appleShaped = createEntitlement({
      productId: 'rome-essential',
      source: 'apple',
      status: 'active',
      externalTransactionId: 'txn_b',
    })
    expect(isEntitlementActive(paddle)).toBe(true)
    expect(isEntitlementActive(appleShaped)).toBe(true)
    expect(getProductsUnlockedByEntitlement(paddle)).toEqual(['rome-essential'])
    expect(getProductsUnlockedByEntitlement(appleShaped)).toEqual(['rome-essential'])
  })
})

describe('legacy + access-token normalization', () => {
  it('normalizes legacy purchase records', () => {
    const ent = normalizeLegacyPurchase({
      productId: 'rome-couple',
      id: 'purchase_1',
      created_at: '2026-02-01T12:00:00.000Z',
    })
    expect(ent?.productId).toBe('rome-couple')
    expect(ent?.contentProductId).toBe('rome-complete')
    expect(ent?.source).toBe('manual')
    expect(ent?.seatLimit).toBe(2)
    expect(ent?.status).toBe('active')
  })

  it('normalizes access-token grants', () => {
    const ent = normalizeAccessTokenGrant({
      purchasedProductId: 'rome-family',
      contentProductId: 'rome-complete',
      seatLimit: 4,
      role: 'owner',
      bundleStatus: 'active',
      validatedAt: '2026-03-01T00:00:00.000Z',
    })
    expect(ent?.source).toBe('legacy_access_token')
    expect(ent?.productId).toBe('rome-family')
    expect(ent?.contentProductId).toBe('rome-complete')
    expect(ent?.seatLimit).toBe(4)
    expect(ent?.metadata.role).toBe('owner')
  })

  it('normalizes paddle purchases via priceMap', () => {
    const ent = normalizePaddlePurchase(
      {
        id: 'txn_99',
        items: [{ price: { id: 'pri_family' } }],
      },
      {
        subjectId: 'cust_1',
        priceMap: {
          pri_family: {
            productId: 'rome-family',
            contentProductId: 'rome-complete',
            seatLimit: 4,
            kind: 'bundle',
          },
        },
      },
    )
    expect(ent?.source).toBe('paddle')
    expect(ent?.productId).toBe('rome-family')
    expect(ent?.contentProductId).toBe('rome-complete')
    expect(ent?.externalTransactionId).toBe('txn_99')
  })
})

describe('couple and family remain distinct products', () => {
  it('keeps bundle SKUs distinct while unlocking rome-complete content', () => {
    const bundles = listBundleProductShapes()
    expect(bundles.map((b) => b.productId).sort()).toEqual(['rome-couple', 'rome-family'])
    expect(new Set(bundles.map((b) => b.productId)).size).toBe(2)

    const couple = normalizeLegacyPurchase('rome-couple')
    const family = normalizeLegacyPurchase('rome-family')
    expect(couple.productId).toBe('rome-couple')
    expect(family.productId).toBe('rome-family')
    expect(couple.productId).not.toBe(family.productId)
    expect(getProductsUnlockedByEntitlement(couple)).toEqual(['rome-complete'])
    expect(getProductsUnlockedByEntitlement(family)).toEqual(['rome-complete'])
  })
})

describe('multi-city subjects and dedupe', () => {
  it('allows a subject to hold products from multiple hypothetical cities', () => {
    const subject = 'traveler-9'
    grantEntitlement(
      subject,
      createEntitlement({
        subjectId: subject,
        productId: 'rome-complete',
        cityId: 'rome',
        source: 'paddle',
        externalTransactionId: 'txn_rome',
      }),
    )
    grantEntitlement(
      subject,
      createEntitlement({
        subjectId: subject,
        productId: 'athens-agora',
        cityId: 'athens',
        contentProductId: 'athens-agora',
        source: 'manual',
        externalTransactionId: 'txn_athens',
        metadata: { hypothetical: true },
      }),
    )
    expect(getEntitledProductIds(subject).sort()).toEqual(['athens-agora', 'rome-complete'])
  })

  it('dedupes duplicate external transactions deterministically', () => {
    const a = createEntitlement({
      productId: 'rome-complete',
      source: 'paddle',
      externalTransactionId: 'txn_dup',
      grantedAt: '2026-01-01T00:00:00.000Z',
      entitlementId: 'ent_a',
    })
    const b = createEntitlement({
      productId: 'rome-complete',
      source: 'paddle',
      externalTransactionId: 'txn_dup',
      grantedAt: '2026-02-01T00:00:00.000Z',
      entitlementId: 'ent_b',
    })
    const deduped = dedupeEntitlements([a, b])
    expect(deduped).toHaveLength(1)
    expect(deduped[0].grantedAt).toBe('2026-02-01T00:00:00.000Z')
  })
})

describe('launch catalog is authoritative Paddle source', () => {
  it('uses the generated catalog fingerprint and product rows', () => {
    expect(getLaunchCatalogFingerprint()).toBe(LAUNCH_CATALOG_FINGERPRINT)
    expect(fp()).toBe(LAUNCH_CATALOG_FINGERPRINT)
    expect(listCommerceProducts()).toBe(LAUNCH_CATALOG_PRODUCTS)
    expect(getCommerceProduct('rome-complete')).toEqual(GEN_BY_ID['rome-complete'])
    expect(listEnabledProviderMappings().every((m) => m.provider === 'paddle')).toBe(true)
  })
})

describe('no Rome-specific boolean fields', () => {
  it('does not introduce hasRomeAccess on entitlements', () => {
    const ent = normalizeLegacyPurchase('rome-central')
    expect(hasForbiddenRomeAccessField(ent)).toBe(false)
    expect(ent).not.toHaveProperty('hasRomeAccess')
    expect(PRODUCT_NAME_ALIASES).not.toHaveProperty('hasRomeAccess')
  })
})

describe('future Apple mappings', () => {
  it('can add disabled Apple mappings without changing entitlement logic', () => {
    const mapping = createDisabledAppleMapping('rome-complete', 'com.chronowalk.rome.complete')
    expect(mapping.enabled).toBe(false)
    expect(mapping.provider).toBe('apple')
    expect(resolveProductForProvider('apple', 'com.chronowalk.rome.complete')).toBeNull()

    const fromApple = createEntitlement({
      productId: 'rome-complete',
      source: 'apple',
      status: 'active',
    })
    expect(isEntitlementActive(fromApple)).toBe(true)
    expect(getProductsUnlockedByEntitlement(fromApple)).toEqual(['rome-complete'])
  })
})
