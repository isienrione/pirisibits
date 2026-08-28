import { describe, expect, it, vi } from 'vitest'
import { isIosDevice, isIosSafari, isStandaloneMode, shouldOfferPwaInstall } from '../pwaInstall'

describe('pwaInstall', () => {
  it('detects standalone display mode', () => {
    const matchMedia = vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    vi.stubGlobal('matchMedia', matchMedia)
    vi.stubGlobal('navigator', { standalone: false })
    vi.stubGlobal('window', { ...window, Capacitor: undefined, matchMedia, navigator: { standalone: false } })

    expect(isStandaloneMode()).toBe(true)
    expect(shouldOfferPwaInstall()).toBe(false)
  })

  it('returns false when matchMedia is unavailable', () => {
    vi.stubGlobal('matchMedia', undefined)
    vi.stubGlobal('navigator', { standalone: false })
    vi.stubGlobal('window', { ...window, Capacitor: undefined, matchMedia: undefined, navigator: { standalone: false } })

    expect(isStandaloneMode()).toBe(false)
    expect(shouldOfferPwaInstall()).toBe(true)
  })

  it('detects iOS Safari', () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      standalone: false,
    })

    expect(isIosDevice()).toBe(true)
    expect(isIosSafari()).toBe(true)
  })

  it('treats Capacitor native shell as installed and hides install offer', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })))
    vi.stubGlobal('navigator', { standalone: false })
    vi.stubGlobal('window', {
      ...window,
      Capacitor: {
        isNativePlatform: () => true,
        getPlatform: () => 'ios',
      },
      navigator: { standalone: false },
      matchMedia: vi.fn(() => ({ matches: false })),
    })

    expect(isStandaloneMode()).toBe(true)
    expect(shouldOfferPwaInstall()).toBe(false)
  })
})
