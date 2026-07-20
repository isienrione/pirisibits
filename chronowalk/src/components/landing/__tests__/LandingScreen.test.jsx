import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { getTourProductTruth } from '../../../content/tourProductTruth.js'
import { loadRomeManifest } from '../../../content/manifest.js'
import LandingScreen from '../LandingScreen'

const PRODUCT_TRUTH = getTourProductTruth(loadRomeManifest())

const openCheckoutMock = vi.hoisted(() =>
  vi.fn(async () => ({ ok: true, mode: 'overlay', priceId: 'pri_test' })),
)

vi.mock('../../../hooks/usePrice', () => ({
  usePrice: () => ({
    label: '€14.99',
    cents: 1499,
    currency: 'EUR',
    checkoutUrl: '',
    checkoutReady: true,
  }),
}))

vi.mock('../../../lib/checkout.js', () => ({
  openCheckout: (...args) => openCheckoutMock(...args),
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
}))

describe('LandingScreen', () => {
  beforeEach(() => {
    trackMock.mockClear()
    openCheckoutMock.mockClear()
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
    expect(screen.getByRole('button', { name: /unlock rome — €14\.99/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /restore access/i })).toHaveAttribute('href', '/access')
  })

  it('opens Paddle checkout for the complete pack', async () => {
    render(
      <MemoryRouter>
        <LandingScreen />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /unlock rome — €14\.99/i }))

    await waitFor(() => {
      expect(openCheckoutMock).toHaveBeenCalledWith({
        tierId: 'rome-complete',
        source: 'legacy_landing',
      })
    })
  })
})
