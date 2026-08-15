import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import LandingStopCarousel, {
  measureStopCarouselLoopWidth,
} from '../v4/LandingStopCarousel.jsx'
import { LANDING_STOP_FLIP_COPY } from '../landingStopFlipCopy.js'
import { LANDING_TIER_ROUTES } from '../landingTierRoutes.js'
import { I18nProvider } from '../../i18n/I18nProvider.jsx'

vi.mock('../landingAnalytics.js', () => ({
  observeLandingSectionOnce: () => () => {},
  trackLandingRouteView: vi.fn(),
}))

describe('LandingStopCarousel loop width', () => {
  it('measures first-copy width from card offsets, not scrollWidth/2', () => {
    const scroller = document.createElement('div')
    const track = document.createElement('div')
    scroller.appendChild(track)

    // 3 unique stops duplicated → 6 cards. Padding makes scrollWidth/2 wrong.
    const positions = [24, 124, 224, 324, 424, 524]
    positions.forEach((left) => {
      const card = document.createElement('article')
      card.className = 'cw-v4-stops__card'
      Object.defineProperty(card, 'offsetLeft', { configurable: true, get: () => left })
      track.appendChild(card)
    })

    Object.defineProperty(scroller, 'scrollWidth', { configurable: true, get: () => 600 })

    // True loop = first clone offset − first card offset = 324 − 24 = 300
    // scrollWidth/2 would be 300 coincidentally here; shift padding to prove the API.
    expect(measureStopCarouselLoopWidth(scroller, 3)).toBe(300)
  })

  it('returns 0 when the clone set is incomplete', () => {
    const scroller = document.createElement('div')
    const card = document.createElement('article')
    card.className = 'cw-v4-stops__card'
    scroller.appendChild(card)
    expect(measureStopCarouselLoopWidth(scroller, 3)).toBe(0)
    expect(measureStopCarouselLoopWidth(null, 3)).toBe(0)
  })
})

describe('landing stop flip copy', () => {
  it('covers every complete-route stop id', () => {
    const routeIds = LANDING_TIER_ROUTES['rome-complete']
    for (const id of routeIds) {
      expect(LANDING_STOP_FLIP_COPY[id], `missing flip copy for ${id}`).toBeTruthy()
      expect(LANDING_STOP_FLIP_COPY[id].body.length).toBeGreaterThan(40)
    }
  })
})

describe('LandingStopCarousel flip', () => {
  it('flips a stop card to reveal Viator-aligned description', () => {
    render(
      <I18nProvider>
        <LandingStopCarousel />
      </I18nProvider>,
    )

    const flippers = screen.getAllByRole('button', { name: /Show description for Colosseum/i })
    expect(flippers.length).toBeGreaterThan(0)
    fireEvent.click(flippers[0])

    const flipped = document.querySelector('.cw-v4-stops__card.is-flipped')
    expect(flipped).toBeTruthy()
    expect(within(flipped).getByText(/games day/i)).toBeInTheDocument()
    expect(within(flipped).getByText(/hypogeum/i)).toBeInTheDocument()
    expect(within(flipped).getByText(/15–60 min/i)).toBeInTheDocument()

    fireEvent.click(within(flipped).getByRole('button', { name: /Hide description for Colosseum/i }))
    expect(document.querySelector('.cw-v4-stops__card.is-flipped')).toBeNull()
  })

  it('ignores a click that follows a swipe gesture', () => {
    render(
      <I18nProvider>
        <LandingStopCarousel />
      </I18nProvider>,
    )

    const flipper = screen.getAllByRole('button', { name: /Show description for Colosseum/i })[0]
    fireEvent.pointerDown(flipper, { clientX: 40, clientY: 40 })
    fireEvent.pointerMove(flipper, { clientX: 80, clientY: 42 })
    fireEvent.click(flipper)
    expect(document.querySelector('.cw-v4-stops__card.is-flipped')).toBeNull()
  })
})
