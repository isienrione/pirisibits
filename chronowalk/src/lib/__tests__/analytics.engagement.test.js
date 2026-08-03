import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const posthogMock = vi.hoisted(() => ({
  init: vi.fn(),
  capture: vi.fn(),
  register: vi.fn(),
}))

vi.mock('posthog-js', () => ({ default: posthogMock }))
vi.mock('../config.js', () => ({ getAbVariantCents: () => 1499 }))
vi.mock('../../landing/landingExperiments.js', () => ({
  peekLandingExpHero: () => 'control',
  ensureLandingExpHero: () => 'control',
}))
vi.mock('../../landing/landingIntent.js', () => ({
  resolveLandingIntent: () => 'rome',
}))

describe('landing engagement-depth analytics', () => {
  let visibilityState = 'visible'
  let ioCallback = null
  let cleanup = null

  beforeEach(async () => {
    vi.resetModules()
    vi.clearAllMocks()
    localStorage.clear()
    vi.stubEnv('VITE_POSTHOG_KEY', 'phc_test')
    visibilityState = 'visible'
    ioCallback = null
    cleanup = null

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => visibilityState,
    })

    class MockIntersectionObserver {
      constructor(cb) {
        ioCallback = cb
      }
      observe() {}
      disconnect() {}
      unobserve() {}
    }
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)

    document.body.innerHTML = `
      <section id="top"></section>
      <section id="pricing"></section>
      <section id="faq"></section>
    `

    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      get: () => 4000,
    })
    Object.defineProperty(document.body, 'scrollHeight', {
      configurable: true,
      get: () => 4000,
    })
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      get: () => 800,
    })
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      writable: true,
      value: 0,
    })

    vi.useFakeTimers({ shouldAdvanceTime: false })

    const { markAnalyticsReady, __resetAnalyticsSessionForTests, installLandingPageListeners } =
      await import('../analytics.ts')
    __resetAnalyticsSessionForTests()
    markAnalyticsReady(true)
    cleanup = installLandingPageListeners()
  })

  afterEach(() => {
    if (cleanup) cleanup()
    vi.useRealTimers()
    vi.unstubAllEnvs()
    document.body.innerHTML = ''
  })

  function setScrollPct(pct) {
    // traversable = 4000 - 800 = 3200; scrollTop ≈ pct/100 * 3200
    window.scrollY = Math.round((pct / 100) * 3200)
  }

  function eventsNamed(name) {
    return posthogMock.capture.mock.calls.filter(([e]) => e === name)
  }

  it('includes max_scroll_pct on every tracked event', async () => {
    setScrollPct(40)
    window.dispatchEvent(new Event('scroll'))
    await vi.advanceTimersByTimeAsync(200)

    const { track } = await import('../analytics.ts')
    track('pricing_view')
    const [, props] = posthogMock.capture.mock.calls.find(([e]) => e === 'pricing_view')
    expect(props.max_scroll_pct).toBeGreaterThanOrEqual(40)
    expect(props.scroll_depth_pct).toBe(props.max_scroll_pct)
  })

  it('fires engaged_heartbeat at 10s / 30s only while visible', async () => {
    await vi.advanceTimersByTimeAsync(10_000)
    expect(eventsNamed('engaged_heartbeat').map(([, p]) => p.seconds_on_page)).toEqual([10])

    visibilityState = 'hidden'
    document.dispatchEvent(new Event('visibilitychange'))

    await vi.advanceTimersByTimeAsync(30_000)
    expect(eventsNamed('engaged_heartbeat')).toHaveLength(1)

    visibilityState = 'visible'
    document.dispatchEvent(new Event('visibilitychange'))

    await vi.advanceTimersByTimeAsync(20_000)
    expect(eventsNamed('engaged_heartbeat').map(([, p]) => p.seconds_on_page)).toEqual([10, 30])

    const hb = eventsNamed('engaged_heartbeat')[0][1]
    expect(hb).toMatchObject({
      seconds_on_page: 10,
      max_scroll_pct: expect.any(Number),
    })
  })

  it('fires deep_engagement once at 60s engaged AND 50% scroll', async () => {
    setScrollPct(50)
    window.dispatchEvent(new Event('scroll'))
    await vi.advanceTimersByTimeAsync(200)

    await vi.advanceTimersByTimeAsync(59_000)
    expect(eventsNamed('deep_engagement')).toHaveLength(0)

    await vi.advanceTimersByTimeAsync(1_000)
    expect(eventsNamed('deep_engagement')).toHaveLength(1)
    expect(eventsNamed('deep_engagement')[0][1]).toMatchObject({
      seconds_on_page: expect.any(Number),
      max_scroll_pct: expect.any(Number),
    })

    await vi.advanceTimersByTimeAsync(60_000)
    expect(eventsNamed('deep_engagement')).toHaveLength(1)
  })

  it('does not fire deep_engagement without enough scroll', async () => {
    setScrollPct(40)
    window.dispatchEvent(new Event('scroll'))
    await vi.advanceTimersByTimeAsync(200)
    await vi.advanceTimersByTimeAsync(60_000)
    expect(eventsNamed('deep_engagement')).toHaveLength(0)
  })

  it('includes longest_dwell_section on exit_intent', async () => {
    const top = document.getElementById('top')
    const pricing = document.getElementById('pricing')
    expect(ioCallback).toBeTypeOf('function')

    ioCallback([
      { target: top, isIntersecting: true, intersectionRatio: 0.6 },
      { target: pricing, isIntersecting: false, intersectionRatio: 0 },
    ])
    await vi.advanceTimersByTimeAsync(5_000)

    ioCallback([
      { target: top, isIntersecting: false, intersectionRatio: 0 },
      { target: pricing, isIntersecting: true, intersectionRatio: 0.6 },
    ])
    await vi.advanceTimersByTimeAsync(1_000)

    visibilityState = 'hidden'
    document.dispatchEvent(new Event('visibilitychange'))

    const exit = eventsNamed('exit_intent')
    expect(exit).toHaveLength(1)
    expect(exit[0][1].longest_dwell_section).toBe('top')
  })

  it('fires bounced_fast on pagehide when <15s and <25% scroll', async () => {
    setScrollPct(10)
    window.dispatchEvent(new Event('scroll'))
    await vi.advanceTimersByTimeAsync(200)
    await vi.advanceTimersByTimeAsync(5_000)

    window.dispatchEvent(new Event('pagehide'))

    expect(eventsNamed('bounced_fast')).toHaveLength(1)
    expect(eventsNamed('bounced_fast')[0][1]).toMatchObject({
      seconds_on_page: expect.any(Number),
    })
    expect(eventsNamed('bounced_fast')[0][1].seconds_on_page).toBeLessThan(15)
  })

  it('does not fire bounced_fast after deep scroll or long dwell', async () => {
    setScrollPct(30)
    window.dispatchEvent(new Event('scroll'))
    await vi.advanceTimersByTimeAsync(200)
    await vi.advanceTimersByTimeAsync(5_000)
    window.dispatchEvent(new Event('pagehide'))
    expect(eventsNamed('bounced_fast')).toHaveLength(0)
  })
})
