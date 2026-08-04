import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  attemptSafariZoomRecovery,
  installSafariPageZoomBlock,
} from '../safariPageZoom.js'

describe('safariPageZoom', () => {
  const originalUserAgent = navigator.userAgent
  const originalMaxTouchPoints = navigator.maxTouchPoints

  beforeEach(() => {
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      get: () =>
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    })
    Object.defineProperty(navigator, 'maxTouchPoints', {
      configurable: true,
      get: () => 5,
    })
  })

  afterEach(() => {
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      get: () => originalUserAgent,
    })
    Object.defineProperty(navigator, 'maxTouchPoints', {
      configurable: true,
      get: () => originalMaxTouchPoints,
    })
    vi.unstubAllGlobals()
    document.head.querySelectorAll('meta[name="viewport"]').forEach((el) => el.remove())
  })

  it('registers Safari gesture + multi-touch move blockers', () => {
    const root = document.createElement('div')
    const add = vi.spyOn(root, 'addEventListener')
    const remove = vi.spyOn(root, 'removeEventListener')

    const cleanup = installSafariPageZoomBlock(root)

    expect(add).toHaveBeenCalledWith('gesturestart', expect.any(Function), { passive: false })
    expect(add).toHaveBeenCalledWith('gesturechange', expect.any(Function), { passive: false })
    expect(add).toHaveBeenCalledWith('gestureend', expect.any(Function), { passive: false })
    expect(add).toHaveBeenCalledWith('touchmove', expect.any(Function), { passive: false })

    cleanup()
    expect(remove).toHaveBeenCalledWith('gesturestart', expect.any(Function))
    expect(remove).toHaveBeenCalledWith('touchmove', expect.any(Function))
  })

  it('can skip multi-touch move blocking for transform-based viewers', () => {
    const root = document.createElement('div')
    const add = vi.spyOn(root, 'addEventListener')
    const cleanup = installSafariPageZoomBlock(root, { blockMultiTouchMove: false })
    expect(add).toHaveBeenCalledWith('gesturestart', expect.any(Function), { passive: false })
    expect(add.mock.calls.some((call) => call[0] === 'touchmove')).toBe(false)
    cleanup()
  })

  it('prevents default on Safari gesture events', () => {
    const root = document.createElement('div')
    const cleanup = installSafariPageZoomBlock(root)
    const event = new Event('gesturestart', { cancelable: true })
    root.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    cleanup()
  })

  it('skips install on non-iOS browsers', () => {
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      get: () =>
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    })
    Object.defineProperty(navigator, 'maxTouchPoints', {
      configurable: true,
      get: () => 0,
    })
    const root = document.createElement('div')
    const add = vi.spyOn(root, 'addEventListener')
    const cleanup = installSafariPageZoomBlock(root)
    expect(add).not.toHaveBeenCalled()
    cleanup()
  })

  it('attempts viewport meta recovery when visualViewport is zoomed', () => {
    const meta = document.createElement('meta')
    meta.setAttribute('name', 'viewport')
    meta.setAttribute(
      'content',
      'width=device-width, initial-scale=1.0, viewport-fit=cover, interactive-widget=resizes-content',
    )
    document.head.appendChild(meta)

    vi.stubGlobal('visualViewport', { scale: 1.8 })

    expect(attemptSafariZoomRecovery()).toBe(true)
    expect(meta.getAttribute('content')).toMatch(/maximum-scale=1/)
  })

  it('does not touch viewport meta when scale is 1', () => {
    const meta = document.createElement('meta')
    meta.setAttribute('name', 'viewport')
    meta.setAttribute('content', 'width=device-width, initial-scale=1.0')
    document.head.appendChild(meta)
    vi.stubGlobal('visualViewport', { scale: 1 })

    expect(attemptSafariZoomRecovery()).toBe(false)
    expect(meta.getAttribute('content')).toBe('width=device-width, initial-scale=1.0')
  })
})
