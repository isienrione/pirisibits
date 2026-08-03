import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const registerMock = vi.fn()

vi.mock('posthog-js', () => ({
  default: {
    register: (...args) => registerMock(...args),
  },
}))

import {
  ATTRIBUTION_STORAGE_KEY,
  ATTRIBUTION_TTL_MS,
  __resetAttributionForTests,
  captureAttribution,
  getAttribution,
  attributionToProps,
} from '../attribution.ts'

describe('attribution first-touch', () => {
  beforeEach(() => {
    __resetAttributionForTests()
    registerMock.mockClear()
    window.history.replaceState(null, '', '/?utm_source=google&utm_medium=cpc&utm_campaign=rome&gclid=g1&fbclid=f1')
    Object.defineProperty(document, 'referrer', {
      configurable: true,
      get: () => 'https://ads.example/landing',
    })
  })

  afterEach(() => {
    __resetAttributionForTests()
    window.history.replaceState(null, '', '/')
  })

  it('captures query params, landing URL, and referrer on first load', () => {
    const record = captureAttribution(1_700_000_000_000)

    expect(record).toMatchObject({
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'rome',
      gclid: 'g1',
      fbclid: 'f1',
      document_referrer: 'https://ads.example/landing',
      captured_at: 1_700_000_000_000,
    })
    expect(record.landing_page_url).toContain('utm_source=google')
    expect(getAttribution()).toEqual(record)
    expect(JSON.parse(localStorage.getItem(ATTRIBUTION_STORAGE_KEY))).toMatchObject({
      utm_source: 'google',
      gclid: 'g1',
    })
    expect(registerMock).toHaveBeenCalledWith(
      expect.objectContaining({
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'rome',
        gclid: 'g1',
        fbclid: 'f1',
      }),
    )
  })

  it('keeps first-touch within 30 days even after hash navigation drops query params', () => {
    const first = captureAttribution(1_700_000_000_000)

    // Landing tier tabs replace the URL with only a hash — query string gone.
    window.history.replaceState(null, '', '/#rome-central')
    window.history.replaceState(
      null,
      '',
      '/?utm_source=later&utm_medium=email&utm_campaign=newsletter',
    )

    const second = captureAttribution(1_700_000_000_000 + 5 * 24 * 60 * 60 * 1000)

    expect(second).toEqual(first)
    expect(second.utm_source).toBe('google')
    expect(second.utm_medium).toBe('cpc')
    expect(getAttribution()?.utm_source).toBe('google')
  })

  it('overwrites after the 30-day first-touch window expires', () => {
    captureAttribution(1_700_000_000_000)

    window.history.replaceState(
      null,
      '',
      '/?utm_source=later&utm_medium=email&utm_campaign=newsletter&wbraid=w1',
    )

    const next = captureAttribution(1_700_000_000_000 + ATTRIBUTION_TTL_MS + 1)

    expect(next.utm_source).toBe('later')
    expect(next.utm_medium).toBe('email')
    expect(next.utm_campaign).toBe('newsletter')
    expect(next.wbraid).toBe('w1')
    expect(next.gclid).toBeNull()
  })

  it('attributionToProps omits nulls for PostHog / Paddle payloads', () => {
    const props = attributionToProps(
      captureAttribution(1_700_000_000_000),
    )
    expect(props.utm_source).toBe('google')
    expect(props).not.toHaveProperty('utm_content')
    expect(props).not.toHaveProperty('msclkid')
    expect(props.attribution_captured_at).toBe(1_700_000_000_000)
  })
})
