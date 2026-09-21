import { describe, expect, it, vi } from 'vitest'

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => false,
  },
}))

describe('platform', () => {
  it('exports IS_IOS as a boolean', async () => {
    const { IS_IOS } = await import('../platform.js')
    expect(typeof IS_IOS).toBe('boolean')
  })
})
