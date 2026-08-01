import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import LandingRomeTiersSection from '../LandingRomeTiersSection.jsx'
import { ROME_BUNDLES, ROME_TIERS, LANDING_CONTENT } from '../landingData.js'
import { getLandingTierStats } from '../landingTierStats.js'

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
  })

  afterEach(() => {
    vi.unstubAllGlobals?.()
  })

  it('renders three individual tours plus Couple and Family offers', () => {
    render(<LandingRomeTiersSection onBeginTier={() => {}} />)

    expect(screen.getByRole('heading', { name: 'Roma Historica' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Roma Antica' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Roma Eterna' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Couple' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Family' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Share the walk, not the earbuds/i })).toBeInTheDocument()
    expect(screen.getByTestId('cw-desktop-pkg-stack')).toBeInTheDocument()
    expect(screen.queryByTestId('cw-mobile-route-chooser')).not.toBeInTheDocument()
  })

  it('renders a single guarantee line below the package stack', () => {
    render(<LandingRomeTiersSection onBeginTier={() => {}} />)

    const guarantee = screen.getByTestId('cw-pricing-guarantee')
    expect(guarantee).toHaveTextContent('Secure checkout via Paddle · VAT included · Instant email access')
    expect(guarantee).toHaveTextContent(/Money-back guarantee/)
    expect(guarantee).toHaveTextContent(/email us and we'll refund you/)
    expect(screen.getAllByTestId('cw-pricing-guarantee')).toHaveLength(1)

    const stack = screen.getByTestId('cw-desktop-pkg-stack')
    expect(stack.compareDocumentPosition(guarantee) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('keeps Historica / Antica / Eterna stop counts at 8 / 12 / 21', () => {
    expect(getLandingTierStats('rome-central').stopCount).toBe(8)
    expect(getLandingTierStats('rome-essential').stopCount).toBe(12)
    expect(getLandingTierStats('rome-complete').stopCount).toBe(21)
  })

  it('shows Couple price, seats, Roma Eterna content, per-person value, and savings', () => {
    render(<LandingRomeTiersSection onBeginTier={() => {}} />)

    const couple = screen.getByRole('article', { name: /^Couple$/i })
    expect(couple).toHaveTextContent('€25')
    expect(couple).toHaveTextContent(/2 people and devices/i)
    expect(couple).toHaveTextContent('Full Roma Eterna for each person')
    expect(couple).toHaveTextContent('All 21 stops')
    expect(couple).toHaveTextContent('Shared tour progress')
    expect(couple).toHaveTextContent('€12.50 per person')
    expect(couple).toHaveTextContent('Save €4.98')
  })

  it('shows Family price, seats, Roma Eterna content, per-person value, and savings', () => {
    render(<LandingRomeTiersSection onBeginTier={() => {}} />)

    const family = screen.getByRole('article', { name: /^Family$/i })
    expect(family).toHaveTextContent('€35')
    expect(family).toHaveTextContent(/Up to 4 people and devices/i)
    expect(family).toHaveTextContent('Full Roma Eterna for each person')
    expect(family).toHaveTextContent('All 21 stops')
    expect(family).toHaveTextContent('Shared tour progress')
    expect(family).toHaveTextContent(/€8\.75 per person/i)
    expect(family).toHaveTextContent(/Save up to €24\.96/i)
  })

  it('does not render group-bundle language anywhere in pricing or FAQ copy', () => {
    render(<LandingRomeTiersSection onBeginTier={() => {}} />)
    expect(document.body.textContent).not.toMatch(/group bundles?/i)

    const faqText = JSON.stringify(LANDING_CONTENT.faq)
    expect(faqText).not.toMatch(/group bundles?/i)
    expect(LANDING_CONTENT.pricing.intro).not.toMatch(/group bundles?/i)
  })

  it('sends rome-couple and rome-family product ids to checkout without seat or content params', () => {
    const onBeginTier = vi.fn()
    render(<LandingRomeTiersSection onBeginTier={onBeginTier} />)

    fireEvent.click(screen.getByRole('button', { name: 'Choose Couple' }))
    fireEvent.click(screen.getByRole('button', { name: 'Choose Family' }))

    expect(onBeginTier).toHaveBeenNthCalledWith(1, 'rome-couple')
    expect(onBeginTier).toHaveBeenNthCalledWith(2, 'rome-family')
    expect(onBeginTier.mock.calls.every((call) => call.length === 1)).toBe(true)
  })

  it('wires package card hotspots to the matching product ids', () => {
    const onBeginTier = vi.fn()
    render(<LandingRomeTiersSection onBeginTier={onBeginTier} />)

    fireEvent.click(screen.getByRole('button', { name: 'Choose Roma Eterna' }))
    fireEvent.click(screen.getByRole('button', { name: 'Choose Roma Antica' }))
    fireEvent.click(screen.getByRole('button', { name: 'Choose Roma Historica' }))

    expect(onBeginTier).toHaveBeenNthCalledWith(1, 'rome-complete')
    expect(onBeginTier).toHaveBeenNthCalledWith(2, 'rome-essential')
    expect(onBeginTier).toHaveBeenNthCalledWith(3, 'rome-central')
  })

  it('renders the uploaded package card artwork for each Rome walk', () => {
    render(<LandingRomeTiersSection onBeginTier={() => {}} />)

    expect(document.querySelector('img[src="/landing/hero-slides/package-roma-eterna.png"]')).toBeTruthy()
    expect(document.querySelector('img[src="/landing/hero-slides/package-roma-antica.png"]')).toBeTruthy()
    expect(document.querySelector('img[src="/landing/hero-slides/package-roma-historica.png"]')).toBeTruthy()
  })

  it('exposes accessible names and focusable CTAs for both bundles', () => {
    render(<LandingRomeTiersSection onBeginTier={() => {}} />)

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
  })

  it('defaults to Roma Eterna with named tabs and readable HTML facts', () => {
    render(<LandingRomeTiersSection onBeginTier={() => {}} />)

    expect(screen.getByTestId('cw-mobile-route-chooser')).toBeInTheDocument()
    expect(screen.queryByTestId('cw-desktop-pkg-stack')).not.toBeInTheDocument()

    const eternaTab = screen.getByRole('tab', { name: 'Roma Eterna' })
    expect(eternaTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Roma Antica' })).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByRole('tab', { name: 'Roma Historica' })).toHaveAttribute('aria-selected', 'false')

    const panel = screen.getByRole('tabpanel')
    expect(panel).toHaveTextContent('€14.99')
    expect(panel).toHaveTextContent('4.5 – 5.5 hr')
    expect(panel).toHaveTextContent('21 stops')
    expect(panel).toHaveTextContent('~6 km')
    expect(panel).toHaveTextContent(/The full journey through ancient Rome/)
    expect(within(panel).getByRole('button', { name: 'Choose Roma Eterna' })).toBeInTheDocument()
  })

  it('switches summary data across all three routes without stacking posters', () => {
    render(<LandingRomeTiersSection onBeginTier={() => {}} />)

    fireEvent.click(screen.getByRole('tab', { name: 'Roma Antica' }))
    let panel = screen.getByRole('tabpanel')
    expect(panel).toHaveTextContent('€9.99')
    expect(panel).toHaveTextContent('12 stops')
    expect(panel).toHaveTextContent('~3 km')
    expect(panel).toHaveTextContent(/Colosseum and Palatine Hill/)

    fireEvent.click(screen.getByRole('tab', { name: 'Roma Historica' }))
    panel = screen.getByRole('tabpanel')
    expect(panel).toHaveTextContent('8 stops')
    expect(panel).toHaveTextContent('~4 km')
    expect(panel).toHaveTextContent(/historic heart/)

    expect(document.querySelectorAll('.cw-v4-pkg-mobile-card__map-art')).toHaveLength(1)
  })

  it('invokes the same checkout handler from the mobile CTA', () => {
    const onBeginTier = vi.fn()
    render(<LandingRomeTiersSection onBeginTier={onBeginTier} />)

    fireEvent.click(screen.getByRole('tab', { name: 'Roma Antica' }))
    fireEvent.click(screen.getByRole('button', { name: 'Choose Roma Antica' }))
    expect(onBeginTier).toHaveBeenCalledTimes(1)
    expect(onBeginTier).toHaveBeenCalledWith('rome-essential')
  })

  it('places the guarantee once directly under the buy button', () => {
    render(<LandingRomeTiersSection onBeginTier={() => {}} />)

    const panel = screen.getByRole('tabpanel')
    const cta = within(panel).getByRole('button', { name: 'Choose Roma Eterna' })
    const guarantee = within(panel).getByTestId('cw-pricing-guarantee')
    expect(screen.getAllByTestId('cw-pricing-guarantee')).toHaveLength(1)
    expect(cta.compareDocumentPosition(guarantee) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(guarantee).toHaveTextContent('Secure checkout via Paddle · VAT included · Instant email access')
  })

  it('opens and closes the illustrated map viewer with dialog semantics', () => {
    const onBeginTier = vi.fn()
    render(<LandingRomeTiersSection onBeginTier={onBeginTier} />)

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
    render(<LandingRomeTiersSection onBeginTier={() => {}} />)
    fireEvent.click(
      screen.getByRole('button', { name: /View full illustrated route map for Roma Eterna/i }),
    )
    expect(screen.getByRole('dialog', { name: /Roma Eterna illustrated route map/i })).toBeInTheDocument()
  })

  it('lets Compare all routes select another route from canonical data', () => {
    render(<LandingRomeTiersSection onBeginTier={() => {}} />)

    fireEvent.click(screen.getByText('Compare all routes'))
    const compare = screen.getByText('Compare all routes').closest('details')
    expect(compare).toHaveTextContent('Roma Historica')
    expect(compare).toHaveTextContent('8 stops')
    expect(compare).toHaveTextContent('€9.99')

    const historicaRow = [...compare.querySelectorAll('.cw-v4-pkg-compare__row')].find((row) =>
      row.textContent.includes('Roma Historica'),
    )
    fireEvent.click(within(historicaRow).getByRole('button', { name: 'View route' }))
    expect(screen.getByRole('tab', { name: 'Roma Historica' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Centro Storico & Pantheon deep dive')
  })

  it('honors a route hash for the initial mobile selection', () => {
    window.history.replaceState(null, '', '/#rome-central')
    render(<LandingRomeTiersSection onBeginTier={() => {}} />)
    expect(screen.getByRole('tab', { name: 'Roma Historica' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('8 stops')
  })
})
