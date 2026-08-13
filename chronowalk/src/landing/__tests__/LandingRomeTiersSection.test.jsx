import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LandingRomeTiersSection from '../LandingRomeTiersSection.jsx'
import { ROME_BUNDLES, ROME_TIERS, LANDING_CONTENT } from '../landingData.js'
import { getLandingTierStats } from '../landingTierStats.js'
import { __setLaunchOfferActiveForTests } from '../../lib/launchOffer.js'

function renderPricing(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

vi.mock('../landingAnalytics.js', () => ({
  observeLandingSectionOnce: () => () => {},
  trackLandingPricingView: () => {},
}))

vi.mock('../../lib/track.js', () => ({
  track: vi.fn(),
  TRACK_EVENTS: {
    GUARANTEE_VIEW: 'guarantee_view',
  },
  isAnalyticsReady: () => false,
}))

function mockMinWidth(matchesDesktop) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: query.includes('min-width: 768px') ? matchesDesktop : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

describe('LandingRomeTiersSection desktop posters', () => {
  beforeEach(() => {
    mockMinWidth(true)
    __setLaunchOfferActiveForTests(true)
  })

  afterEach(() => {
    __setLaunchOfferActiveForTests(null)
    vi.unstubAllGlobals?.()
  })

  it('renders three individual tours plus Couple and Family offers', () => {
    renderPricing(<LandingRomeTiersSection onBeginTier={() => {}} />)

    expect(screen.getByRole('heading', { name: 'Roma Historica' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Roma Antica' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Roma Eterna' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Couple' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Family' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Share the walk, not the earbuds/i })).toBeInTheDocument()
    expect(screen.getByTestId('cw-desktop-pkg-stack')).toBeInTheDocument()
    const pacing = document.querySelector('.cw-v4-pkg__pacing')
    expect(pacing).toBeTruthy()
    expect(pacing).toHaveTextContent('You can do it in 1 or 2 days!')
    expect(document.querySelectorAll('.cw-v4-pkg__pacing')).toHaveLength(1)
    expect(screen.queryByTestId('cw-mobile-route-chooser')).not.toBeInTheDocument()
  })

  it('renders a single guarantee line below the package stack', () => {
    renderPricing(<LandingRomeTiersSection onBeginTier={() => {}} />)

    const guarantee = screen.getByTestId('cw-pricing-guarantee')
    expect(guarantee).toHaveTextContent('Secure checkout via Paddle · VAT included · Instant email access')
    expect(guarantee).toHaveTextContent(/Money-back guarantee/)
    expect(guarantee).toHaveTextContent(/email us and we'll refund you/)
    expect(screen.getAllByTestId('cw-pricing-guarantee')).toHaveLength(1)

    const stack = screen.getByTestId('cw-desktop-pkg-stack')
    expect(stack.compareDocumentPosition(guarantee) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('keeps Historica / Antica / Eterna kebab projections at 9 / 12 / 21', () => {
    // Historica: 8 centro kebabs + Appia encore (customer copy: "8 + Appia encore").
    expect(getLandingTierStats('rome-central').stopCount).toBe(9)
    expect(getLandingTierStats('rome-essential').stopCount).toBe(12)
    expect(getLandingTierStats('rome-complete').stopCount).toBe(21)
  })

  it('shows Couple Launch Offer price, seats, Roma Eterna content, per-person value, and savings', () => {
    renderPricing(<LandingRomeTiersSection onBeginTier={() => {}} />)

    const couple = screen.getByRole('article', { name: /^Couple$/i })
    expect(couple).toHaveTextContent('€25')
    expect(couple).toHaveTextContent('€17')
    expect(couple).toHaveTextContent(/Launch offer/i)
    expect(couple).toHaveTextContent(/2 people and devices/i)
    expect(couple).toHaveTextContent('Full Roma Eterna for each person')
    expect(couple).toHaveTextContent('All 21 stops')
    expect(couple).toHaveTextContent('Shared tour progress')
    expect(couple).toHaveTextContent('€8.50 per person')
    expect(couple).toHaveTextContent('Save €3 vs two individual Roma Eterna walks')
  })

  it('shows Family Launch Offer price, seats, Roma Eterna content, per-person value, and savings', () => {
    renderPricing(<LandingRomeTiersSection onBeginTier={() => {}} />)

    const family = screen.getByRole('article', { name: /^Family$/i })
    expect(family).toHaveTextContent('€35')
    expect(family).toHaveTextContent('€25')
    expect(family).toHaveTextContent(/Launch offer/i)
    expect(family).toHaveTextContent(/Up to 4 people and devices/i)
    expect(family).toHaveTextContent('Full Roma Eterna for each person')
    expect(family).toHaveTextContent('All 21 stops')
    expect(family).toHaveTextContent('Shared tour progress')
    expect(family).toHaveTextContent(/€6\.25\/person for four/i)
    expect(family).toHaveTextContent(/Save €15 vs four individual Roma Eterna walks/i)
  })

  it('restores base Couple/Family prices when Launch Offer is off', () => {
    __setLaunchOfferActiveForTests(false)
    renderPricing(<LandingRomeTiersSection onBeginTier={() => {}} />)

    const couple = screen.getByRole('article', { name: /^Couple$/i })
    expect(couple).toHaveTextContent('€25')
    expect(couple).toHaveTextContent('€12.50 per person')
    expect(couple).toHaveTextContent('Save €4.98')
    expect(couple).not.toHaveTextContent('Launch offer')

    const family = screen.getByRole('article', { name: /^Family$/i })
    expect(family).toHaveTextContent('€35')
    expect(family).toHaveTextContent(/€8\.75 per person/i)
    expect(family).toHaveTextContent(/Save up to €24\.96/i)
  })

  it('does not render group-bundle language anywhere in pricing or FAQ copy', () => {
    renderPricing(<LandingRomeTiersSection onBeginTier={() => {}} />)
    expect(document.body.textContent).not.toMatch(/group bundles?/i)

    const faqText = JSON.stringify(LANDING_CONTENT.faq)
    expect(faqText).not.toMatch(/group bundles?/i)
    expect(LANDING_CONTENT.pricing.intro).not.toMatch(/group bundles?/i)
  })

  it('sends rome-couple and rome-family product ids to checkout without seat or content params', () => {
    const onBeginTier = vi.fn()
    renderPricing(<LandingRomeTiersSection onBeginTier={onBeginTier} />)

    fireEvent.click(screen.getByRole('button', { name: 'Choose Couple' }))
    fireEvent.click(screen.getByRole('button', { name: 'Choose Family' }))

    expect(onBeginTier).toHaveBeenNthCalledWith(1, 'rome-couple')
    expect(onBeginTier).toHaveBeenNthCalledWith(2, 'rome-family')
    expect(onBeginTier.mock.calls.every((call) => call.length === 1)).toBe(true)
  })

  it('wires package card hotspots to the matching product ids', () => {
    const onBeginTier = vi.fn()
    renderPricing(<LandingRomeTiersSection onBeginTier={onBeginTier} />)

    fireEvent.click(screen.getByRole('button', { name: 'Choose Roma Eterna' }))
    fireEvent.click(screen.getByRole('button', { name: 'Choose Roma Antica' }))
    fireEvent.click(screen.getByRole('button', { name: 'Choose Roma Historica' }))

    expect(onBeginTier).toHaveBeenNthCalledWith(1, 'rome-complete')
    expect(onBeginTier).toHaveBeenNthCalledWith(2, 'rome-essential')
    expect(onBeginTier).toHaveBeenNthCalledWith(3, 'rome-central')
  })

  it('renders the uploaded package card artwork for each Rome walk', () => {
    renderPricing(<LandingRomeTiersSection onBeginTier={() => {}} />)

    expect(document.querySelector('img[src="/landing/hero-slides/package-roma-eterna.png"]')).toBeTruthy()
    expect(document.querySelector('img[src="/landing/hero-slides/package-roma-antica.png"]')).toBeTruthy()
    expect(document.querySelector('img[src="/landing/hero-slides/package-roma-historica.png"]')).toBeTruthy()
  })

  it('exposes accessible names and focusable CTAs for both bundles', () => {
    renderPricing(<LandingRomeTiersSection onBeginTier={() => {}} />)

    const coupleCta = screen.getByRole('button', { name: 'Choose Couple' })
    const familyCta = screen.getByRole('button', { name: 'Choose Family' })
    expect(coupleCta).toBeEnabled()
    expect(familyCta).toBeEnabled()
    coupleCta.focus()
    expect(coupleCta).toHaveFocus()
    familyCta.focus()
    expect(familyCta).toHaveFocus()
  })

  it('keeps bundle catalog fields aligned with commerce truth', () => {
    expect(ROME_BUNDLES.map((b) => ({ id: b.id, price: b.price, cents: b.priceCents }))).toEqual([
      { id: 'rome-couple', price: '€25', cents: 2500 },
      { id: 'rome-family', price: '€35', cents: 3500 },
    ])
    expect(ROME_TIERS).toHaveLength(3)
    expect(ROME_BUNDLES).toHaveLength(2)
  })
})

describe('LandingRomeTiersSection mobile route chooser', () => {
  beforeEach(() => {
    mockMinWidth(false)
    window.history.replaceState(null, '', '/')
    __setLaunchOfferActiveForTests(true)
  })

  afterEach(() => {
    __setLaunchOfferActiveForTests(null)
  })

  it('defaults to Roma Eterna with named tabs and readable HTML facts', () => {
    renderPricing(<LandingRomeTiersSection onBeginTier={() => {}} />)

    expect(screen.getByTestId('cw-mobile-route-chooser')).toBeInTheDocument()
    expect(screen.queryByTestId('cw-desktop-pkg-stack')).not.toBeInTheDocument()

    const eternaTab = screen.getByRole('tab', { name: 'Roma Eterna' })
    expect(eternaTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Roma Antica' })).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByRole('tab', { name: 'Roma Historica' })).toHaveAttribute('aria-selected', 'false')

    expect(screen.getByTestId('cw-pricing-launch-note')).toHaveTextContent(/Launch offer/i)
    expect(screen.getByTestId('cw-pricing-launch-note')).toHaveTextContent(/scratched list prices/i)

    const panel = screen.getByRole('tabpanel')
    expect(panel).toHaveTextContent('€14.99')
    expect(panel).toHaveTextContent('€10')
    expect(panel).toHaveTextContent(/Launch offer/i)
    expect(panel).toHaveTextContent('Save €4.99')
    expect(panel.querySelector('.cw-offer-price__scratch')).toBeTruthy()
    expect(panel).toHaveTextContent('4.5 – 5.5 hr')
    expect(panel).toHaveTextContent('21 stops')
    expect(panel).toHaveTextContent('~6 km')
    expect(panel).toHaveTextContent(/You can do it in/)
    expect(within(panel).getByText('1 or 2 days')).toBeInTheDocument()
    expect(panel).toHaveTextContent(/The full journey through ancient Rome/)
    expect(within(panel).getByRole('button', { name: 'Choose Roma Eterna' })).toBeInTheDocument()
  })

  it('switches summary data across all three routes without stacking posters', () => {
    renderPricing(<LandingRomeTiersSection onBeginTier={() => {}} />)

    fireEvent.click(screen.getByRole('tab', { name: 'Roma Antica' }))
    let panel = screen.getByRole('tabpanel')
    expect(panel).toHaveTextContent('€9.99')
    expect(panel).toHaveTextContent('€6.99')
    expect(panel).toHaveTextContent(/Launch offer/i)
    expect(panel).toHaveTextContent('12 stops')
    expect(panel).toHaveTextContent('~3 km')
    expect(panel).toHaveTextContent(/Colosseum and Palatine Hill/)
    expect(panel).not.toHaveTextContent(/You can do it in/)

    fireEvent.click(screen.getByRole('tab', { name: 'Roma Historica' }))
    panel = screen.getByRole('tabpanel')
    expect(panel).toHaveTextContent('€4.99')
    expect(panel).toHaveTextContent('8 + Appia encore')
    expect(panel).toHaveTextContent('~4 km')
    expect(panel).toHaveTextContent(/historic heart/)
    expect(panel).not.toHaveTextContent(/You can do it in/)

    expect(document.querySelectorAll('.cw-v4-pkg-mobile-card__map-art')).toHaveLength(1)
  })

  it('invokes the same checkout handler from the mobile CTA', () => {
    const onBeginTier = vi.fn()
    renderPricing(<LandingRomeTiersSection onBeginTier={onBeginTier} />)

    fireEvent.click(screen.getByRole('tab', { name: 'Roma Antica' }))
    fireEvent.click(screen.getByRole('button', { name: 'Choose Roma Antica' }))
    expect(onBeginTier).toHaveBeenCalledTimes(1)
    expect(onBeginTier).toHaveBeenCalledWith('rome-essential')
  })

  it('places the guarantee outside the card and above Compare all routes', () => {
    renderPricing(<LandingRomeTiersSection onBeginTier={() => {}} />)

    const panel = screen.getByRole('tabpanel')
    const guarantee = screen.getByTestId('cw-pricing-guarantee')
    const compare = screen.getByText('Compare all routes')
    expect(screen.getAllByTestId('cw-pricing-guarantee')).toHaveLength(1)
    expect(panel.contains(guarantee)).toBe(false)
    expect(panel.compareDocumentPosition(guarantee) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(guarantee.compareDocumentPosition(compare) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(guarantee).toHaveTextContent('Secure checkout via Paddle · VAT included · Instant email access')
    expect(guarantee.textContent).not.toContain('—')
  })

  it('opens and closes the illustrated map viewer with dialog semantics', () => {
    const onBeginTier = vi.fn()
    renderPricing(<LandingRomeTiersSection onBeginTier={onBeginTier} />)

    fireEvent.click(screen.getByRole('button', { name: 'View full illustrated route map' }))
    const dialog = screen.getByRole('dialog', { name: /Roma Eterna illustrated route map/i })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveTextContent(/Pinch or double-tap to zoom/i)
    expect(within(dialog).getByRole('button', { name: 'Choose Roma Eterna' })).toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole('button', { name: 'Choose Roma Eterna' }))
    expect(onBeginTier).toHaveBeenCalledWith('rome-complete')

    fireEvent.click(within(dialog).getByRole('button', { name: 'Close viewer' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens the map viewer when the poster preview is tapped', () => {
    renderPricing(<LandingRomeTiersSection onBeginTier={() => {}} />)
    fireEvent.click(
      screen.getByRole('button', { name: /View full illustrated route map for Roma Eterna/i }),
    )
    expect(screen.getByRole('dialog', { name: /Roma Eterna illustrated route map/i })).toBeInTheDocument()
  })

  it('lets Compare all routes select another route from canonical data', () => {
    renderPricing(<LandingRomeTiersSection onBeginTier={() => {}} />)

    fireEvent.click(screen.getByText('Compare all routes'))
    const compare = screen.getByText('Compare all routes').closest('details')
    expect(compare).toHaveTextContent('Roma Historica')
    expect(compare).toHaveTextContent('8 + Appia encore')
    expect(compare).toHaveTextContent('€9.99')
    expect(compare).toHaveTextContent('€4.99')

    const historicaRow = [...compare.querySelectorAll('.cw-v4-pkg-compare__row')].find((row) =>
      row.textContent.includes('Roma Historica'),
    )
    fireEvent.click(within(historicaRow).getByRole('button', { name: 'View route' }))
    expect(screen.getByRole('tab', { name: 'Roma Historica' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Centro Storico & Pantheon deep dive')
  })

  it('honors a route hash for the initial mobile selection', () => {
    window.history.replaceState(null, '', '/#rome-central')
    renderPricing(<LandingRomeTiersSection onBeginTier={() => {}} />)
    expect(screen.getByRole('tab', { name: 'Roma Historica' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('8 + Appia encore')
  })
})
