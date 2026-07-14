import { beforeEach, describe, expect, it, vi } from 'vitest'
import { completeStagingPurchase, isStagingCheckoutAllowed } from '../stagingCheckout.js'
import { isLocalPurchaseToken, validateAccessToken } from '../access.js'
import { ACCESS_KEY } from '../config.js'

vi.mock('../track.js', () => ({
  track: vi.fn(),
  TRACK_EVENTS: {
    CHECKOUT_OPEN: 'checkout_open',
    PURCHASE: 'purchase',
  },
}))

describe('stagingCheckout', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubEnv('DEV', true)
  })

  it('allows staging in Vite DEV', () => {
    expect(isStagingCheckoutAllowed()).toBe(true)
  })

  it('mints a token, grants access, and validates via /access path', async () => {
    const result = completeStagingPurchase({ tierId: 'rome-complete' })
    expect(result.ok).toBe(true)
    expect(result.token).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    )
    expect(result.redirectTo).toContain('/access/confirmed?token=')
    expect(localStorage.getItem(ACCESS_KEY)).toBe('true')
    expect(isLocalPurchaseToken(result.token)).toBe(true)

    const validated = await validateAccessToken(result.token)
    expect(validated).toEqual({ ok: true, source: 'staging' })
  })
})
