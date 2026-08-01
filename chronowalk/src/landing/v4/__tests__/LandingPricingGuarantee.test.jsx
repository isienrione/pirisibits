import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import LandingPricingGuarantee, {
  resetPricingGuaranteeAnalyticsForTests,
} from '../LandingPricingGuarantee.jsx'
import { TRACK_EVENTS } from '../../../lib/track.js'

const track = vi.fn()
const observers = []

vi.mock('../../../lib/track.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    track: (...args) => track(...args),
  }
})

vi.mock('../../landingAnalytics.js', () => ({
  observeLandingSectionOnce: (element, onVisible, options) => {
    observers.push({ element, onVisible, options })
    return () => {}
  },
}))

describe('LandingPricingGuarantee', () => {
  beforeEach(() => {
    track.mockClear()
    observers.length = 0
    resetPricingGuaranteeAnalyticsForTests()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders exact trust copy with lock glyph and gold accent on Money-back guarantee', () => {
    const { container } = render(<LandingPricingGuarantee />)

    expect(container.textContent).toContain(
      'Secure checkout via Paddle · VAT included · Instant email access',
    )
    expect(container.textContent).toContain(
      "Money-back guarantee — if it doesn't work on your phone or isn't what you expected, email us and we'll refund you.",
    )
    expect(container.querySelector('.cw-v4-pricing-guarantee__accent')?.textContent).toBe(
      'Money-back guarantee',
    )
    expect(container.querySelector('.cw-v4-pricing-guarantee__lock')).toBeTruthy()
  })

  it('fires guarantee_view once at threshold 0.5', () => {
    render(<LandingPricingGuarantee />)
    expect(observers).toHaveLength(1)
    expect(observers[0].options).toEqual({ threshold: 0.5 })

    observers[0].onVisible()
    observers[0].onVisible()
    expect(track).toHaveBeenCalledTimes(1)
    expect(track).toHaveBeenCalledWith(TRACK_EVENTS.GUARANTEE_VIEW)
  })
})
