import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  isAccessTokenFormat,
  parseAccessToken,
  redeemPurchaseClaim,
  validateAccessToken,
  validateDeviceAccess,
} from '../access'
import {
  clearLocalAccessState,
  hasValidLocalAccess,
  readDeviceCredential,
  writeAccessEntitlement,
  writeDeviceCredential,
} from '../accessSession.js'
import { OFFLINE_LEASE_MS } from '../launchSkus.js'

const rpcMock = vi.fn()

vi.mock('../supabase', () => ({
  isSupabaseConfigured: () => true,
  supabase: {
    rpc: (...args) => rpcMock(...args),
  },
}))

vi.mock('../deviceId.js', () => ({
  getDeviceId: () => 'test-device-binding',
}))

describe('access', () => {
  beforeEach(() => {
    rpcMock.mockReset()
    localStorage.clear()
  })

  it('parses token from search params', () => {
    expect(parseAccessToken('?token=abc-123')).toBe('abc-123')
    expect(parseAccessToken('')).toBe('')
  })

  it('accepts uuid/claim formats and explicit dev tokens only when allowed', () => {
    expect(isAccessTokenFormat('not-a-token')).toBe(false)
    expect(isAccessTokenFormat('00000000-0000-4000-8000-000000000000')).toBe(true)
    expect(isAccessTokenFormat('dev')).toBe(true)
    expect(isAccessTokenFormat('a'.repeat(64))).toBe(true)
  })

  it('redeems a one-time claim into a distinct device credential', async () => {
    const claim = 'a'.repeat(64)
    const deviceCredential = 'b'.repeat(64)
    rpcMock.mockResolvedValue({
      data: {
        ok: true,
        device_credential: deviceCredential,
        purchased_product_id: 'rome-essential',
        content_product_id: 'rome-essential',
        seat_limit: 1,
        role: 'solo',
        bundle_status: null,
        offline_lease_expires_at: new Date(Date.now() + OFFLINE_LEASE_MS).toISOString(),
      },
      error: null,
    })

    const result = await redeemPurchaseClaim(claim)

    expect(rpcMock).toHaveBeenCalledWith('redeem_purchase_claim', {
      p_claim: claim,
      p_device_binding: 'test-device-binding',
    })
    expect(result.ok).toBe(true)
    expect(result.productId).toBe('rome-essential')
    expect(readDeviceCredential()).toBe(deviceCredential)
    expect(hasValidLocalAccess()).toBe(true)
  })

  it('validateAccessToken always redeems URL claims (never trusts local boolean)', async () => {
    writeDeviceCredential('old-credential')
    writeAccessEntitlement({
      purchasedProductId: 'rome-complete',
      contentProductId: 'rome-complete',
      seatLimit: 1,
      role: 'solo',
    })
    expect(hasValidLocalAccess()).toBe(true)

    rpcMock.mockResolvedValue({
      data: { ok: false, reason: 'invalid' },
      error: null,
    })

    const rotated = 'c'.repeat(64)
    const result = await validateAccessToken(rotated)
    expect(result.ok).toBe(false)
    expect(rpcMock).toHaveBeenCalledWith('redeem_purchase_claim', {
      p_claim: rotated,
      p_device_binding: 'test-device-binding',
    })
  })

  it('clears local access when device validation fails online', async () => {
    writeDeviceCredential('d'.repeat(64))
    writeAccessEntitlement({
      purchasedProductId: 'rome-complete',
      contentProductId: 'rome-complete',
      seatLimit: 1,
      role: 'solo',
    })
    rpcMock.mockResolvedValue({
      data: { ok: false, reason: 'invalid' },
      error: null,
    })

    const result = await validateDeviceAccess()
    expect(result.ok).toBe(false)
    expect(hasValidLocalAccess()).toBe(false)
    expect(readDeviceCredential()).toBeNull()
  })

  it('honors bounded offline lease when network fails', async () => {
    writeDeviceCredential('e'.repeat(64))
    writeAccessEntitlement({
      purchasedProductId: 'rome-central',
      contentProductId: 'rome-central',
      seatLimit: 1,
      role: 'solo',
      offlineLeaseExpiresAt: Date.now() + OFFLINE_LEASE_MS,
    })
    rpcMock.mockRejectedValue(new Error('network down'))

    const result = await validateDeviceAccess()
    expect(result.ok).toBe(true)
    expect(result.source).toBe('offline_lease')
    expect(result.contentProductId).toBe('rome-central')
  })

  it('rejects expired offline lease', async () => {
    writeDeviceCredential('f'.repeat(64))
    writeAccessEntitlement({
      purchasedProductId: 'rome-central',
      contentProductId: 'rome-central',
      seatLimit: 1,
      role: 'solo',
    })
    // Force lease into the past
    const raw = JSON.parse(localStorage.getItem('cw_access_entitlement_v1'))
    raw.offlineLeaseExpiresAt = Date.now() - 1000
    localStorage.setItem('cw_access_entitlement_v1', JSON.stringify(raw))

    expect(hasValidLocalAccess()).toBe(false)
    clearLocalAccessState()
  })

  it('does not grant arbitrary UUID via retired get_purchase_for_token path', async () => {
    rpcMock.mockResolvedValue({
      data: { ok: false, reason: 'invalid' },
      error: null,
    })
    const token = '00000000-0000-4000-8000-000000000000'
    const result = await validateAccessToken(token)
    expect(rpcMock).toHaveBeenCalledWith('redeem_purchase_claim', expect.any(Object))
    expect(rpcMock).not.toHaveBeenCalledWith('get_purchase_for_token', expect.any(Object))
    expect(result.ok).toBe(false)
  })
})
