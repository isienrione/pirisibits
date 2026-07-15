import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  LEMON_CHECKOUT_BUY_URL,
  LEMON_CHECKOUT_OVERLAY_SNIPPET,
  resolveCheckoutMode,
  resolveLemonCheckoutBaseUrl,
  withLemonEmbed,
} from '../lemonSqueezy.js'

describe('lemonSqueezy helpers', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('exports the Roma Eterna buy URL and overlay snippet', () => {
    expect(LEMON_CHECKOUT_BUY_URL).toContain('chronowalk.lemonsqueezy.com/checkout/buy/')
    expect(LEMON_CHECKOUT_BUY_URL).toContain('1a82bca2-f4a8-4b40-812d-fb7398afb75d')
    expect(LEMON_CHECKOUT_OVERLAY_SNIPPET).toContain('lemonsqueezy-button')
    expect(LEMON_CHECKOUT_OVERLAY_SNIPPET).toContain('embed=1')
    expect(LEMON_CHECKOUT_OVERLAY_SNIPPET).toContain('assets.lemonsqueezy.com/lemon.js')
  })

  it('falls through empty config/env to the baked-in buy URL', () => {
    expect(resolveLemonCheckoutBaseUrl('', '')).toBe(LEMON_CHECKOUT_BUY_URL)
    expect(resolveLemonCheckoutBaseUrl('   ', null)).toBe(LEMON_CHECKOUT_BUY_URL)
  })

  it('prefers app_config then env over the default', () => {
    expect(
      resolveLemonCheckoutBaseUrl('https://from.config/buy', 'https://from.env/buy'),
    ).toBe('https://from.config/buy')
    expect(resolveLemonCheckoutBaseUrl('', 'https://from.env/buy')).toBe('https://from.env/buy')
  })

  it('adds embed=1 without dropping custom metadata', () => {
    const url = withLemonEmbed(
      'https://chronowalk.lemonsqueezy.com/checkout/buy/abc?checkout%5Bcustom%5D%5Bproduct_id%5D=rome-complete',
    )
    expect(url).toContain('embed=1')
    expect(url).toContain('product_id')
  })

  it('defaults checkout mode to overlay', () => {
    expect(resolveCheckoutMode()).toBe('overlay')
    vi.stubEnv('VITE_LEMON_CHECKOUT_MODE', 'hosted')
    expect(resolveCheckoutMode()).toBe('hosted')
  })
})
