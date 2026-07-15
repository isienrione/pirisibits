import { describe, expect, it, vi } from 'vitest'
import { isIosDevice, isIosNonSafari, isIosSafari, isStandaloneMode } from '../pwaInstall'

describe('pwaInstall', () => {
  it('detects standalone display mode', () => {
    const matchMedia = vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    vi.stubGlobal('matchMedia', matchMedia)
    vi.stubGlobal('navigator', { standalone: false })

    expect(isStandaloneMode()).toBe(true)
  })

  it('returns false when matchMedia is unavailable', () => {
    vi.stubGlobal('matchMedia', undefined)
    vi.stubGlobal('navigator', { standalone: false })

    expect(isStandaloneMode()).toBe(false)
  })

  it('detects iOS Safari', () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      standalone: false,
    })

    expect(isIosDevice()).toBe(true)
    expect(isIosSafari()).toBe(true)
    expect(isIosNonSafari()).toBe(false)
  })

  it('detects Chrome on iOS as non-Safari (must open Safari to install)', () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.0.0 Mobile/15E148 Safari/604.1',
      standalone: false,
    })

    expect(isIosDevice()).toBe(true)
    expect(isIosSafari()).toBe(false)
    expect(isIosNonSafari()).toBe(true)
  })
})
