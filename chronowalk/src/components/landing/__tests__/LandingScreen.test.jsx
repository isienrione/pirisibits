import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { getTourProductTruth } from '../../../content/tourProductTruth.js'
import { loadRomeManifest } from '../../../content/manifest.js'
import LandingScreen from '../LandingScreen'

const PRODUCT_TRUTH = getTourProductTruth(loadRomeManifest())

vi.mock('../../../hooks/usePrice', () => ({
  usePrice: () => ({
    label: '€17',
    cents: 1700,
    currency: 'EUR',
    checkoutUrl: 'https://checkout.example.com/rome',
  }),
}))

const trackMock = vi.fn()

vi.mock('../../../lib/track', () => ({
  track: (...args) => trackMock(...args),
  TRACK_EVENTS: {
    CHECKOUT_OPEN: 'checkout_open',
  },
}))

vi.mock('../../../lib/host', () => ({
  getHost: () => 'hotelroma1',
  getHostLabel: () => 'Hotel Roma',
  buildCheckoutUrl: (baseUrl, { host, abVariantCents }) => {
    const url = new URL(baseUrl)
    if (host) url.searchParams.set('checkout[custom][host]', host)
    if (abVariantCents) url.searchParams.set('checkout[custom][ab_variant]', String(abVariantCents))
    return url.toString()
  },
}))

describe('LandingScreen', () => {
  beforeEach(() => {
    trackMock.mockClear()
    vi.stubGlobal('location', { ...window.location, assign: vi.fn() })
  })

  it('renders the conversion hierarchy and host attribution', () => {
    render(
      <MemoryRouter>
        <LandingScreen />
      </MemoryRouter>
    )

    expect(screen.getByText('Recommended by Hotel Roma')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /walk where rome/i })).toBeInTheDocument()
    expect(screen.getByText(PRODUCT_TRUTH.placesAcrossActsLabel)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /unlock rome — €17/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /restore access/i })).toHaveAttribute('href', '/access')
  })

  it('opens the purchase gate instead of unlocking for free', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<LandingScreen />} />
          <Route path="/purchase" element={<div>Purchase gate</div>} />
        </Routes>
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /unlock rome — €17/i }))

    expect(screen.getByText('Purchase gate')).toBeInTheDocument()
    expect(trackMock).toHaveBeenCalledWith('checkout_open', {
      price_cents: 1700,
      deferred: true,
    })
  })
})
