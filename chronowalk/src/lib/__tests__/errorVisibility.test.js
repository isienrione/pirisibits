import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const trackJsError = vi.fn(() => true)
const trackSlowPage = vi.fn(() => true)
const trackAssetLoadFailed = vi.fn(() => true)
const trackMapboxInitFailed = vi.fn(() => true)

vi.mock('../analytics.ts', () => ({
  trackJsError: (...args) => trackJsError(...args),
  trackSlowPage: (...args) => trackSlowPage(...args),
  trackAssetLoadFailed: (...args) => trackAssetLoadFailed(...args),
  trackMapboxInitFailed: (...args) => trackMapboxInitFailed(...args),
}))

import {
  __resetErrorVisibilityForTests,
  installGlobalErrorHandlers,
  installLcpSlowPageWatcher,
  reportAudioLoadFailure,
  reportImageLoadFailure,
  reportMapboxInitFailure,
  stackHead,
} from '../errorVisibility.js'

describe('errorVisibility', () => {
  beforeEach(() => {
    __resetErrorVisibilityForTests()
    vi.clearAllMocks()
    window.onerror = null
    window.onunhandledrejection = null
  })

  afterEach(() => {
    __resetErrorVisibilityForTests()
    window.onerror = null
    window.onunhandledrejection = null
  })

  it('formats stack_head to the first lines', () => {
    expect(stackHead('a\nb\nc\nd\ne\nf\ng', 3)).toBe('a\nb\nc')
  })

  it('installs window.onerror and onunhandledrejection → js_error', () => {
    installGlobalErrorHandlers()

    window.onerror('boom', 'app.js', 12, 0, new Error('boom'))
    expect(trackJsError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'boom',
        source: 'app.js',
        lineno: 12,
      }),
    )

    trackJsError.mockClear()
    window.onunhandledrejection({
      reason: new Error('promise_fail'),
    })
    expect(trackJsError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'promise_fail',
        source: 'unhandledrejection',
      }),
    )
  })

  it('reports map / audio / image asset failures', () => {
    reportMapboxInitFailure('map_construct_failed', 'WebGL')
    expect(trackMapboxInitFailed).toHaveBeenCalledWith({
      reason: 'map_construct_failed',
      detail: 'WebGL',
    })

    reportAudioLoadFailure('https://cdn.example/preview.m4a')
    expect(trackAssetLoadFailed).toHaveBeenCalledWith({
      assetUrl: 'https://cdn.example/preview.m4a',
      assetType: 'audio',
    })

    expect(reportImageLoadFailure('/hero.webp')).toBe(true)
    expect(reportImageLoadFailure('/hero.webp')).toBe(false)
    expect(trackAssetLoadFailed).toHaveBeenCalledWith({
      assetUrl: '/hero.webp',
      assetType: 'image',
    })
  })

  it('fires slow_page when LCP exceeds 2500ms', () => {
    const handlers = []
    vi.stubGlobal(
      'PerformanceObserver',
      class {
        constructor(cb) {
          handlers.push(cb)
        }
        observe() {}
        disconnect() {}
      },
    )

    installLcpSlowPageWatcher()
    expect(handlers).toHaveLength(1)
    handlers[0]({
      getEntries: () => [{ startTime: 3200 }],
    })
    expect(trackSlowPage).toHaveBeenCalledWith({ lcpMs: 3200 })

    vi.unstubAllGlobals()
  })
})
