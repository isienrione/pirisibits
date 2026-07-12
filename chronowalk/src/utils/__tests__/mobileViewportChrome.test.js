import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { initMobileViewportChrome } from '../mobileViewportChrome.js'

describe('mobileViewportChrome', () => {
  beforeEach(() => {
    document.documentElement.style.cssText = ''
    document.documentElement.classList.add('redesign-pwa')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    document.documentElement.style.cssText = ''
    delete document.documentElement.dataset.shellTabBar
  })

  it('tracks visual viewport height and browser chrome inset', () => {
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 })
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: {
        height: 748,
        offsetTop: 0,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    })

    const cleanup = initMobileViewportChrome()

    expect(document.documentElement.style.getPropertyValue('--app-height')).toBe('748px')
    expect(document.documentElement.style.getPropertyValue('--wc-browser-chrome')).toBe('52px')

    cleanup()
  })

  it('clears browser chrome padding in standalone mode', () => {
    window.matchMedia = vi.fn(() => ({ matches: true }))
    Object.defineProperty(window.navigator, 'standalone', { configurable: true, value: true })

    const cleanup = initMobileViewportChrome()

    expect(document.documentElement.style.getPropertyValue('--wc-browser-chrome')).toBe('0px')

    cleanup()
  })
})
