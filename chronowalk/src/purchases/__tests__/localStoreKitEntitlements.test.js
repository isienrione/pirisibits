import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createEntitlement } from '../../commerce/entitlementModel.js'
import { hasAccess } from '../../lib/config.js'
import { readPurchasedTier } from '../../lib/pendingPurchase.js'
import { readOwnedTourIds } from '../../services/tourEntitlements.js'
import {
  LOCAL_STOREKIT_ENTITLEMENTS_KEY,
  activateLocalStoreKitEntitlement,
  activateLocalStoreKitEntitlementsFromRestore,
  canActivateLocalStoreKitEntitlement,
  clearLocalStoreKitEntitlements,
  getLocalStoreKitEntitlements,
  hasActiveLocalStoreKitAccess,
  hasLocalStoreKitEntitlement,
  isLocalStoreKitEntitlementModeAllowed,
  openTourLabelForProduct,
} from '../localStoreKitEntitlements.js'
import { normalizeAppleTransaction } from '../transactionNormalizer.js'

function stubCapacitor({ native = false, platform = 'web' } = {}) {
  const Capacitor = {
    isNativePlatform: () => native,
    getPlatform: () => platform,
    isNative: native,
  }
  vi.stubGlobal('Capacitor', Capacitor)
  if (typeof window !== 'undefined') {
    window.Capacitor = Capacitor
  }
}

function localPurchaseResult(productId = 'rome-complete', overrides = {}) {
  const appleId =
    productId === 'rome-central'
      ? 'com.chronowalk.city.rome.historica'
      : productId === 'rome-essential'
        ? 'com.chronowalk.city.rome.antica'
        : 'com.chronowalk.city.rome.eterna'

  const entitlement =
    overrides.entitlement ??
    normalizeAppleTransaction({
      productId: appleId,
      transactionId: overrides.transactionId ?? 'txn_local_1',
      purchaseDate: '2026-08-06T00:00:00.000Z',
    })

  return {
    ok: true,
    provider: 'apple',
    entitlement,
    serverVerified: false,
    localCandidate: true,
    ...overrides,
    entitlement: overrides.entitlement ?? entitlement,
  }
}

beforeEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  if (typeof window !== 'undefined') {
    delete window.Capacitor
    window.localStorage.clear()
  }
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('local StoreKit entitlement activation', () => {
  it('1. successful local Apple purchase activates local entitlement', () => {
    vi.stubEnv('VITE_STOREKIT_MODE', 'local')
    stubCapacitor({ native: true, platform: 'ios' })

    const result = localPurchaseResult('rome-complete')
    expect(canActivateLocalStoreKitEntitlement(result)).toBe(true)

    const outcome = activateLocalStoreKitEntitlement(result)
    expect(outcome.ok).toBe(true)
    expect(outcome.openPath).toBe('/setup')
    expect(getLocalStoreKitEntitlements()).toHaveLength(1)
    expect(getLocalStoreKitEntitlements()[0]).toMatchObject({
      productId: 'rome-complete',
      contentProductId: 'rome-complete',
      appleProductId: 'com.chronowalk.city.rome.eterna',
      transactionId: 'txn_local_1',
      source: 'apple',
      verificationState: 'local_xcode_test',
    })
    expect(hasLocalStoreKitEntitlement('rome-complete')).toBe(true)
    expect(hasActiveLocalStoreKitAccess()).toBe(true)
  })

  it('2. purchased Rome product becomes accessible immediately', () => {
    vi.stubEnv('VITE_STOREKIT_MODE', 'local')
    stubCapacitor({ native: true, platform: 'ios' })

    activateLocalStoreKitEntitlement(localPurchaseResult('rome-essential', { transactionId: 'txn_a' }))

    expect(hasAccess()).toBe(true)
    expect(readPurchasedTier()).toBe('rome-essential')
    expect(readOwnedTourIds()?.length).toBeGreaterThan(0)
    expect(openTourLabelForProduct('rome-essential')).toBe('Open Roma Antica')
  })

  it('3. local entitlement is ignored when VITE_STOREKIT_MODE is not local', () => {
    vi.stubEnv('VITE_STOREKIT_MODE', 'local')
    stubCapacitor({ native: true, platform: 'ios' })
    activateLocalStoreKitEntitlement(localPurchaseResult('rome-complete'))
    expect(hasActiveLocalStoreKitAccess()).toBe(true)

    vi.unstubAllEnvs()
    expect(isLocalStoreKitEntitlementModeAllowed()).toBe(false)
    expect(hasActiveLocalStoreKitAccess()).toBe(false)
    expect(hasAccess()).toBe(false)
    expect(canActivateLocalStoreKitEntitlement(localPurchaseResult('rome-complete'))).toBe(false)
  })

  it('4. local entitlement is ignored on web', () => {
    vi.stubEnv('VITE_STOREKIT_MODE', 'local')
    stubCapacitor({ native: false, platform: 'web' })

    expect(isLocalStoreKitEntitlementModeAllowed()).toBe(false)
    expect(canActivateLocalStoreKitEntitlement(localPurchaseResult('rome-complete'))).toBe(false)

    // Even if rows were left in storage from a prior native session
    window.localStorage.setItem(
      LOCAL_STOREKIT_ENTITLEMENTS_KEY,
      JSON.stringify([
        {
          productId: 'rome-complete',
          contentProductId: 'rome-complete',
          appleProductId: 'com.chronowalk.city.rome.eterna',
          transactionId: 'txn_web',
          grantedAt: new Date().toISOString(),
          source: 'apple',
          verificationState: 'local_xcode_test',
        },
      ]),
    )
    expect(hasActiveLocalStoreKitAccess()).toBe(false)
    expect(hasAccess()).toBe(false)
  })

  it('5. unsuccessful purchase cannot activate access', () => {
    vi.stubEnv('VITE_STOREKIT_MODE', 'local')
    stubCapacitor({ native: true, platform: 'ios' })

    const failed = {
      ok: false,
      code: 'user_cancelled',
      provider: 'apple',
      localCandidate: false,
      serverVerified: false,
    }
    expect(canActivateLocalStoreKitEntitlement(failed)).toBe(false)
    expect(activateLocalStoreKitEntitlement(failed).ok).toBe(false)
    expect(hasActiveLocalStoreKitAccess()).toBe(false)
  })

  it('6. non-Apple entitlement cannot use this path', () => {
    vi.stubEnv('VITE_STOREKIT_MODE', 'local')
    stubCapacitor({ native: true, platform: 'ios' })

    const paddle = {
      ok: true,
      localCandidate: true,
      serverVerified: false,
      provider: 'paddle',
      entitlement: createEntitlement({
        productId: 'rome-complete',
        source: 'paddle',
        status: 'active',
        metadata: { verificationState: 'local_unverified', serverVerified: false },
      }),
    }
    expect(canActivateLocalStoreKitEntitlement(paddle)).toBe(false)

    const paddleEnt = createEntitlement({
      productId: 'rome-complete',
      source: 'paddle',
      status: 'active',
    })
    expect(canActivateLocalStoreKitEntitlement(paddleEnt)).toBe(false)
  })

  it('7. revoked/refunded/inactive transaction cannot activate access', () => {
    vi.stubEnv('VITE_STOREKIT_MODE', 'local')
    stubCapacitor({ native: true, platform: 'ios' })

    for (const status of ['revoked', 'refunded', 'inactive']) {
      const entitlement = normalizeAppleTransaction({
        productId: 'com.chronowalk.city.rome.eterna',
        transactionId: `txn_${status}`,
        status,
        revocationDate: status === 'revoked' ? '2026-08-06T00:00:00.000Z' : undefined,
        refundedAt: status === 'refunded' ? '2026-08-06T00:00:00.000Z' : undefined,
      })
      const result = {
        ok: true,
        provider: 'apple',
        entitlement,
        serverVerified: false,
        localCandidate: true,
      }
      expect(canActivateLocalStoreKitEntitlement(result)).toBe(false)
    }
  })

  it('8. Couple/Family cannot activate through local test mode', () => {
    vi.stubEnv('VITE_STOREKIT_MODE', 'local')
    stubCapacitor({ native: true, platform: 'ios' })

    for (const productId of ['rome-couple', 'rome-family']) {
      const entitlement = createEntitlement({
        productId,
        contentProductId: 'rome-complete',
        source: 'apple',
        status: 'active',
        externalTransactionId: `txn_${productId}`,
        metadata: {
          verificationState: 'local_unverified',
          serverVerified: false,
          appleProductId: `com.chronowalk.city.rome.${productId}`,
        },
      })
      const result = {
        ok: true,
        provider: 'apple',
        entitlement,
        serverVerified: false,
        localCandidate: true,
      }
      expect(canActivateLocalStoreKitEntitlement(result)).toBe(false)
      expect(activateLocalStoreKitEntitlement(result).ok).toBe(false)
    }
  })

  it('9. duplicate transaction does not duplicate entitlement', () => {
    vi.stubEnv('VITE_STOREKIT_MODE', 'local')
    stubCapacitor({ native: true, platform: 'ios' })

    const first = activateLocalStoreKitEntitlement(
      localPurchaseResult('rome-complete', { transactionId: 'txn_dup' }),
    )
    const second = activateLocalStoreKitEntitlement(
      localPurchaseResult('rome-complete', { transactionId: 'txn_dup' }),
    )
    expect(first.ok).toBe(true)
    expect(second.ok).toBe(true)
    expect(getLocalStoreKitEntitlements()).toHaveLength(1)
  })

  it('10. restore activates local entitlement in local mode', () => {
    vi.stubEnv('VITE_STOREKIT_MODE', 'local')
    stubCapacitor({ native: true, platform: 'ios' })

    const candidate = normalizeAppleTransaction({
      productId: 'com.chronowalk.city.rome.historica',
      transactionId: 'txn_restore_1',
      purchaseDate: '2026-08-06T00:00:00.000Z',
    })
    const restore = {
      ok: true,
      provider: 'apple',
      candidates: [candidate],
      entitlements: [candidate],
      serverVerified: false,
    }

    const outcome = activateLocalStoreKitEntitlementsFromRestore(restore)
    expect(outcome.ok).toBe(true)
    expect(outcome.activated).toBe(1)
    expect(hasLocalStoreKitEntitlement('rome-central')).toBe(true)
    expect(hasAccess()).toBe(true)
  })

  it('11. reset clears only local StoreKit test access', () => {
    vi.stubEnv('VITE_STOREKIT_MODE', 'local')
    stubCapacitor({ native: true, platform: 'ios' })

    activateLocalStoreKitEntitlement(localPurchaseResult('rome-complete'))
    window.localStorage.setItem('cw_access_entitlement_v1', JSON.stringify({ productId: 'keep-me' }))
    window.localStorage.setItem('cw_device_credential_v1', 'cred-keep')

    clearLocalStoreKitEntitlements()
    expect(getLocalStoreKitEntitlements()).toEqual([])
    expect(hasActiveLocalStoreKitAccess()).toBe(false)
    expect(window.localStorage.getItem('cw_access_entitlement_v1')).toContain('keep-me')
    expect(window.localStorage.getItem('cw_device_credential_v1')).toBe('cred-keep')
  })

  it('12. production still requires serverVerified entitlement', () => {
    stubCapacitor({ native: true, platform: 'ios' })
    // default mode (not local)
    const result = localPurchaseResult('rome-complete')
    expect(result.serverVerified).toBe(false)
    expect(canActivateLocalStoreKitEntitlement(result)).toBe(false)
    expect(activateLocalStoreKitEntitlement(result).ok).toBe(false)
    expect(hasAccess()).toBe(false)

    // Even with localCandidate rows planted, production mode ignores them
    window.localStorage.setItem(
      LOCAL_STOREKIT_ENTITLEMENTS_KEY,
      JSON.stringify([
        {
          productId: 'rome-complete',
          contentProductId: 'rome-complete',
          appleProductId: 'com.chronowalk.city.rome.eterna',
          transactionId: 'txn_prod',
          grantedAt: new Date().toISOString(),
          source: 'apple',
          verificationState: 'local_xcode_test',
        },
      ]),
    )
    expect(hasActiveLocalStoreKitAccess()).toBe(false)
    expect(hasAccess()).toBe(false)
  })

  it('13. Paddle/web behavior remains unchanged (activation path stays closed)', () => {
    vi.stubEnv('VITE_STOREKIT_MODE', 'local')
    stubCapacitor({ native: false, platform: 'web' })

    const result = localPurchaseResult('rome-complete')
    expect(activateLocalStoreKitEntitlement(result).ok).toBe(false)
    expect(hasAccess()).toBe(false)
  })

  it('persists no JWS / receipt / token fields', () => {
    vi.stubEnv('VITE_STOREKIT_MODE', 'local')
    stubCapacitor({ native: true, platform: 'ios' })

    const entitlement = normalizeAppleTransaction({
      productId: 'com.chronowalk.city.rome.eterna',
      transactionId: 'txn_safe',
      jwsRepresentation: 'eyJhbGciOi.secret',
      appAccountToken: '550e8400-e29b-41d4-a716-446655440000',
    })
    activateLocalStoreKitEntitlement({
      ok: true,
      provider: 'apple',
      entitlement,
      serverVerified: false,
      localCandidate: true,
    })

    const raw = window.localStorage.getItem(LOCAL_STOREKIT_ENTITLEMENTS_KEY)
    expect(raw).not.toContain('eyJhbGciOi')
    expect(raw).not.toContain('550e8400')
    expect(raw).not.toMatch(/jws|receipt|appAccountToken/i)
  })
})
