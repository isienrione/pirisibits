import { afterEach, describe, expect, it, vi } from 'vitest'
import { getNativePlatform, isNativeApp, isNativeIos } from '../nativePlatform'

describe('nativePlatform', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns false on plain web', () => {
    vi.stubGlobal('window', { ...window, Capacitor: undefined })
    expect(isNativeApp()).toBe(false)
    expect(getNativePlatform()).toBe('web')
    expect(isNativeIos()).toBe(false)
  })

  it('detects Capacitor native iOS', () => {
    vi.stubGlobal('window', {
      ...window,
      Capacitor: {
        isNativePlatform: () => true,
        getPlatform: () => 'ios',
      },
    })
    expect(isNativeApp()).toBe(true)
    expect(getNativePlatform()).toBe('ios')
    expect(isNativeIos()).toBe(true)
  })
})
