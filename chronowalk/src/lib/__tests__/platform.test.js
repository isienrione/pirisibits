import { describe, expect, it, vi } from 'vitest'

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => false,
    getPlatform: () => 'web',
  },
}))

import { getNativePlatform, isNativeApp, isNativeIOS, isWebPlatform } from '../platform.js'

describe('platform', () => {
  it('reports web platform in Vitest', () => {
    expect(isWebPlatform()).toBe(true)
    expect(isNativeApp()).toBe(false)
    expect(isNativeIOS()).toBe(false)
    expect(getNativePlatform()).toBe('web')
  })
})
