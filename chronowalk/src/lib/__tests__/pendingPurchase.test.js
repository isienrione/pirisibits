import { beforeEach, describe, expect, it } from 'vitest'
import { ACCESS_KEY } from '../config.js'
import { DEVICE_CREDENTIAL_KEY, hasValidLocalAccess } from '../accessSession.js'
import {
  applyPurchaseUnlock,
  getPaceOptionsForPurchasedTier,
  paceIdForPurchaseTier,
  readPurchasedTier,
  rememberPendingPurchaseTier,
  shouldShowPaceModePicker,
  writePurchasedTier,
} from '../pendingPurchase.js'
import { JOURNEY_PACE } from '../../data/romePacing.js'
import { readOwnedTourIds } from '../../services/tourEntitlements.js'

describe('pendingPurchase', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('maps product ids to pace ids', () => {
    expect(paceIdForPurchaseTier('rome-central')).toBe(JOURNEY_PACE.CENTRAL)
    expect(paceIdForPurchaseTier('rome-essential')).toBe(JOURNEY_PACE.CLASSIC)
    expect(paceIdForPurchaseTier('rome-complete')).toBe(JOURNEY_PACE.HEROIC)
  })

  it('filters pace options by purchased pack', () => {
    expect(getPaceOptionsForPurchasedTier('rome-essential').map((o) => o.id)).toEqual([
      JOURNEY_PACE.CLASSIC,
    ])
    expect(getPaceOptionsForPurchasedTier('rome-complete').map((o) => o.id)).toEqual([
      JOURNEY_PACE.HEROIC,
      JOURNEY_PACE.CENTRAL,
      JOURNEY_PACE.CLASSIC,
      JOURNEY_PACE.OWN,
    ])
    expect(shouldShowPaceModePicker('rome-complete')).toBe(true)
    expect(shouldShowPaceModePicker('rome-central')).toBe(false)
    expect(shouldShowPaceModePicker('rome-essential')).toBe(false)
  })

  it('applies unlock from product id and remembers device credential', () => {
    const token = 'test-device-credential-000000000000000000000000'
    const result = applyPurchaseUnlock({ token, productId: 'rome-essential' })

    expect(result.tier).toBe('rome-essential')
    expect(localStorage.getItem(ACCESS_KEY)).toBe('true')
    expect(localStorage.getItem(DEVICE_CREDENTIAL_KEY)).toBe(token)
    expect(hasValidLocalAccess()).toBe(true)
    expect(readPurchasedTier()).toBe('rome-essential')
    expect(readOwnedTourIds()).toContain('rome-antica')
  })

  it('promotes pending tier when product id is absent', () => {
    rememberPendingPurchaseTier('rome-central')
    applyPurchaseUnlock({ token: 'test-device-credential-000000000000000000000000' })
    expect(readPurchasedTier()).toBe('rome-central')
  })

  it('writes purchased tier directly', () => {
    writePurchasedTier('rome-complete')
    expect(readPurchasedTier()).toBe('rome-complete')
  })
})
