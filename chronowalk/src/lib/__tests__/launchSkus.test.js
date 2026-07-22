import { describe, expect, it } from 'vitest'
import {
  LAUNCH_SKUS,
  OFFLINE_LEASE_MS,
  entitlementForSku,
  isBundleSku,
  isLaunchSku,
} from '../launchSkus.js'

describe('launchSkus matrix', () => {
  it('maps the five launch SKUs with exact content/seat limits', () => {
    expect(entitlementForSku('rome-central')).toMatchObject({
      contentProductId: 'rome-central',
      seatLimit: 1,
      stopCount: 8,
    })
    expect(entitlementForSku('rome-essential')).toMatchObject({
      contentProductId: 'rome-essential',
      seatLimit: 1,
      stopCount: 12,
    })
    expect(entitlementForSku('rome-complete')).toMatchObject({
      contentProductId: 'rome-complete',
      seatLimit: 1,
      stopCount: 21,
    })
    expect(entitlementForSku('rome-couple')).toMatchObject({
      contentProductId: 'rome-complete',
      seatLimit: 2,
      stopCount: 21,
    })
    expect(entitlementForSku('rome-family')).toMatchObject({
      contentProductId: 'rome-complete',
      seatLimit: 4,
      stopCount: 21,
    })
  })

  it('does not invent a separate 21-stop list under bundle SKUs', () => {
    expect(LAUNCH_SKUS['rome-couple'].contentProductId).toBe('rome-complete')
    expect(LAUNCH_SKUS['rome-family'].contentProductId).toBe('rome-complete')
    expect(isBundleSku('rome-couple')).toBe(true)
    expect(isBundleSku('rome-complete')).toBe(false)
    expect(isLaunchSku('rome-family')).toBe(true)
    expect(isLaunchSku('unknown')).toBe(false)
  })

  it('documents offline lease bound of 48 hours', () => {
    expect(OFFLINE_LEASE_MS).toBe(48 * 60 * 60 * 1000)
  })
})
