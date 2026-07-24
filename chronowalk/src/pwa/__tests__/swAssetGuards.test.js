import { describe, expect, it } from 'vitest'
import {
  isAssetOrModuleRequest,
  isHtmlPoisonedAssetEntry,
  isHtmlResponse,
  isNavigationRequest,
  shouldDenyNavigationFallback,
  shouldHandleAsNavigation,
} from '../swAssetGuards.js'

/** jsdom/undici reject Request({ mode: 'navigate' }); use plain request-likes. */
function requestLike(overrides = {}) {
  return {
    mode: 'cors',
    destination: '',
    url: 'https://chronowalk.com/walk-together',
    ...overrides,
  }
}

describe('swAssetGuards', () => {
  it('treats only genuine document navigations as navigations', () => {
    expect(isNavigationRequest(requestLike({ mode: 'navigate', destination: 'document' }))).toBe(
      true,
    )
    expect(isNavigationRequest(requestLike({ mode: 'cors', destination: 'document' }))).toBe(true)
    expect(isNavigationRequest(requestLike({ mode: 'cors', destination: 'script' }))).toBe(false)
    expect(
      isNavigationRequest(
        requestLike({
          mode: 'cors',
          destination: 'script',
          url: 'https://chronowalk.com/assets/x.js',
        }),
      ),
    ).toBe(false)
  })

  it('flags /assets, scripts, styles, and workers as module/asset requests', () => {
    const scriptUrl = new URL('https://chronowalk.com/assets/RedesignWalkTogetherPage-abc.js')
    expect(
      isAssetOrModuleRequest(
        requestLike({ destination: 'script', url: scriptUrl.href }),
        scriptUrl,
      ),
    ).toBe(true)

    const cssUrl = new URL('https://chronowalk.com/assets/index-abc.css')
    expect(
      isAssetOrModuleRequest(requestLike({ destination: 'style', url: cssUrl.href }), cssUrl),
    ).toBe(true)

    const workerUrl = new URL('https://chronowalk.com/assets/sw-shim.js')
    expect(
      isAssetOrModuleRequest(
        requestLike({ destination: 'worker', url: workerUrl.href }),
        workerUrl,
      ),
    ).toBe(true)

    const docUrl = new URL('https://chronowalk.com/walk-together')
    expect(
      isAssetOrModuleRequest(
        requestLike({ mode: 'navigate', destination: 'document', url: docUrl.href }),
        docUrl,
      ),
    ).toBe(false)
  })

  it('never allows navigation HTML fallback for assets or file-like paths', () => {
    expect(shouldDenyNavigationFallback('/assets/RedesignWalkTogetherPage-abc.js')).toBe(true)
    expect(shouldDenyNavigationFallback('/assets/foo.js?v=1')).toBe(true)
    expect(shouldDenyNavigationFallback('/manifest.webmanifest')).toBe(true)
    expect(shouldDenyNavigationFallback('/walk-together')).toBe(false)
    expect(shouldDenyNavigationFallback('/settings')).toBe(false)
  })

  it('shouldHandleAsNavigation is false for script/module requests even if mis-tagged', () => {
    const scriptUrl = new URL('https://chronowalk.com/assets/RedesignWalkTogetherPage-abc.js')
    expect(
      shouldHandleAsNavigation({
        request: requestLike({
          mode: 'navigate',
          destination: 'script',
          url: scriptUrl.href,
        }),
        url: scriptUrl,
      }),
    ).toBe(false)

    expect(
      shouldHandleAsNavigation({
        request: requestLike({
          mode: 'navigate',
          destination: 'document',
          url: 'https://chronowalk.com/walk-together',
        }),
        url: new URL('https://chronowalk.com/walk-together'),
      }),
    ).toBe(true)
  })

  it('detects HTML responses and HTML-poisoned asset cache entries', () => {
    const html = new Response('<!doctype html><html></html>', {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    })
    const js = new Response('export default {}', {
      status: 200,
      headers: { 'content-type': 'application/javascript' },
    })

    expect(isHtmlResponse(html)).toBe(true)
    expect(isHtmlResponse(js)).toBe(false)
    expect(
      isHtmlPoisonedAssetEntry(
        'https://chronowalk.com/assets/RedesignWalkTogetherPage-abc.js',
        html,
      ),
    ).toBe(true)
    expect(
      isHtmlPoisonedAssetEntry(
        'https://chronowalk.com/assets/RedesignWalkTogetherPage-abc.js',
        js,
      ),
    ).toBe(false)
    expect(isHtmlPoisonedAssetEntry('https://chronowalk.com/walk-together', html)).toBe(false)
  })
})
