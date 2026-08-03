import { expect, test, type Page } from '@playwright/test'

type CapturedEvent = {
  event: string
  properties: Record<string, unknown>
  ts: number
}

const FUNNEL_SEQUENCE = [
  'landing_view',
  'landing_pricing_view',
  'pricing_view',
  'tier_card_click',
  'cta_click',
  'landing_cta_begin',
  'checkout_open',
] as const

const REQUIRED_BASE_PROPS = [
  'ab_variant',
  'landing_exp_hero',
  'seconds_since_landing',
  'scroll_depth_pct',
  'max_scroll_pct',
  'is_pwa',
  'is_ios',
] as const

async function installPosthogCaptureStub(page: Page) {
  await page.addInitScript(() => {
    const w = window as Window & {
      __cwPhEvents?: { event: string; properties: Record<string, unknown>; ts: number }[]
      posthog?: { capture?: (...args: unknown[]) => unknown; __cwCaptureStubbed?: boolean }
    }
    // Filled by analytics.track() mirror +/or capture stub.
    w.__cwPhEvents = []

    const patchCapture = (ph: {
      capture?: (...args: unknown[]) => unknown
      __cwCaptureStubbed?: boolean
    }) => {
      if (!ph || typeof ph.capture !== 'function' || ph.__cwCaptureStubbed) return
      // Swallow network; event mirroring happens in analytics.track → __cwPhEvents.
      ph.capture = () => undefined
      ph.__cwCaptureStubbed = true
    }

    let held: typeof w.posthog
    Object.defineProperty(window, 'posthog', {
      configurable: true,
      enumerable: true,
      get() {
        return held
      },
      set(value) {
        held = value
        if (value) patchCapture(value)
      },
    })

    const id = window.setInterval(() => {
      if (held) {
        patchCapture(held)
        if (held.__cwCaptureStubbed) window.clearInterval(id)
      }
    }, 15)
  })
}

async function getCapturedEvents(page: Page): Promise<CapturedEvent[]> {
  return page.evaluate(() => {
    const w = window as Window & { __cwPhEvents?: CapturedEvent[] }
    return [...(w.__cwPhEvents ?? [])]
  })
}

async function waitForEvent(page: Page, name: string, timeoutMs = 25_000) {
  await expect
    .poll(async () => (await getCapturedEvents(page)).some((e) => e.event === name), {
      timeout: timeoutMs,
      message: `timed out waiting for posthog event "${name}"`,
    })
    .toBe(true)
}

function assertBaseProps(ev: CapturedEvent) {
  for (const key of REQUIRED_BASE_PROPS) {
    expect(ev.properties, `${ev.event} missing ${key}`).toHaveProperty(key)
  }
  expect(typeof ev.properties.ab_variant).toBe('number')
  expect(ev.properties.landing_exp_hero).toBe('a')
  expect(typeof ev.properties.is_pwa).toBe('boolean')
  expect(typeof ev.properties.is_ios).toBe('boolean')
  expect(ev.properties.scroll_depth_pct).toEqual(expect.any(Number))
  expect(ev.properties.max_scroll_pct).toEqual(expect.any(Number))
}

test.describe('landing analytics funnel', () => {
  test('fires the buy-path sequence with required base properties', async ({ page }) => {
    await installPosthogCaptureStub(page)

    // Block real PostHog egress (stub may run after first enqueue).
    await page.route('**/*i.posthog.com/**', (route) => route.abort())
    await page.route('**/e?**', async (route) => {
      if (route.request().url().includes('posthog')) {
        await route.abort()
        return
      }
      await route.continue()
    })

    await page.goto(
      '/?utm_source=playwright_qa&utm_medium=e2e&utm_campaign=analytics_spec&landing_exp_hero=a',
      { waitUntil: 'domcontentloaded' },
    )

    // Ensure capture stub attached (or events are mirrored onto __cwPhEvents).
    await expect
      .poll(async () =>
        page.evaluate(() => {
          const w = window as Window & {
            posthog?: { __cwCaptureStubbed?: boolean }
            __cwPhEvents?: unknown[]
          }
          return Boolean(w.posthog?.__cwCaptureStubbed || Array.isArray(w.__cwPhEvents))
        }),
      )
      .toBe(true)

    await waitForEvent(page, 'landing_view')

    // Drive scroll depth + pricing dwell (observeDwellOnce needs ~1s at ≥50%).
    const pricing = page.locator('#pricing')
    await expect(pricing).toBeAttached({ timeout: 20_000 })
    await pricing.evaluate((el) => {
      el.scrollIntoView({ block: 'center', inline: 'nearest' })
    })
    // Nudge scroll so IntersectionObserver callbacks run.
    await page.mouse.wheel(0, 200)
    await page.waitForTimeout(400)
    await page.mouse.wheel(0, -80)
    await page.waitForTimeout(1500)

    // Debug aid if pricing events never arrive.
    const midEvents = await getCapturedEvents(page)
    if (!midEvents.some((e) => e.event === 'landing_pricing_view')) {
      // Retry scroll after layout settles (fonts / images).
      await pricing.evaluate((el) => {
        el.scrollIntoView({ block: 'center' })
      })
      await page.waitForTimeout(1500)
    }

    await waitForEvent(page, 'landing_pricing_view')
    await waitForEvent(page, 'pricing_view')

    // Mobile route chooser CTA (iPhone project) or desktop hotspot.
    const mobileCta = page.getByRole('button', { name: /Choose Roma Eterna/i })
    const desktopHotspot = page.locator('.cw-v4-pkg__hotspot').first()
    if (await mobileCta.isVisible().catch(() => false)) {
      await mobileCta.click()
    } else {
      await desktopHotspot.click()
    }

    await waitForEvent(page, 'tier_card_click')
    await waitForEvent(page, 'cta_click')
    await waitForEvent(page, 'landing_cta_begin')

    await page.getByRole('button', { name: /Continue to secure checkout/i }).click()
    await waitForEvent(page, 'checkout_open')

    const events = await getCapturedEvents(page)
    const funnelEvents = events.filter((e) =>
      (FUNNEL_SEQUENCE as readonly string[]).includes(e.event),
    )

    // Exact order of required funnel events (first occurrence of each).
    const firstIndex = new Map<string, number>()
    for (const ev of funnelEvents) {
      if (!firstIndex.has(ev.event)) firstIndex.set(ev.event, firstIndex.size)
    }
    const orderedNames = FUNNEL_SEQUENCE.filter((name) => firstIndex.has(name))
    expect(orderedNames).toEqual([...FUNNEL_SEQUENCE])

    // Monotonic timestamps for the funnel subsequence.
    let lastTs = 0
    for (const name of FUNNEL_SEQUENCE) {
      const ev = events.find((e) => e.event === name)
      expect(ev, `missing ${name}`).toBeTruthy()
      assertBaseProps(ev!)
      expect(ev!.ts).toBeGreaterThanOrEqual(lastTs)
      lastTs = ev!.ts
    }

    // Key props on critical steps.
    const landingView = events.find((e) => e.event === 'landing_view')!
    expect(landingView.properties).toMatchObject({
      source: 'landing',
      landing_exp_hero: 'a',
      utm_source: 'playwright_qa',
    })

    const pricingView = events.find((e) => e.event === 'landing_pricing_view')!
    expect(pricingView.properties).toMatchObject({
      section: 'pricing',
    })

    const cta = events.find((e) => e.event === 'cta_click')!
    expect(cta.properties).toMatchObject({
      cta_location: 'pricing',
      tier: expect.any(String),
    })

    const begin = events.find((e) => e.event === 'landing_cta_begin')!
    expect(begin.properties).toMatchObject({
      section: 'pricing',
      cta: 'begin',
      tier: expect.any(String),
    })

    const checkout = events.find((e) => e.event === 'checkout_open')!
    expect(checkout.properties.tier).toBeTruthy()
    expect(
      checkout.properties.price_cents != null || checkout.properties.section === 'pricing',
    ).toBe(true)
  })
})
