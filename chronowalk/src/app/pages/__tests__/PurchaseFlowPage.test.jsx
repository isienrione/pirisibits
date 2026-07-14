import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PurchaseFlowPage } from '../PurchaseFlowPage'

vi.mock('../../../lib/checkout.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    resolveCheckoutBaseUrl: vi.fn(async () => ''),
    openCheckout: vi.fn(),
  }
})

vi.mock('../../../lib/track.js', () => ({
  track: vi.fn(),
  TRACK_EVENTS: {
    LANDING_CTA_BEGIN: 'landing_cta_begin',
    LANDING_CTA_PREVIEW: 'landing_cta_preview',
    CHECKOUT_OPEN: 'checkout_open',
  },
}))

describe('PurchaseFlowPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows Lemon pending placeholder with transaction steps', async () => {
    render(
      <MemoryRouter initialEntries={['/purchase?tier=rome-complete']}>
        <Routes>
          <Route path="/purchase" element={<PurchaseFlowPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText(/checkout is almost ready/i)).toBeInTheDocument()
    expect(screen.getByText(/pay securely/i)).toBeInTheDocument()
    expect(screen.getByText(/lemon squeezy pending/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /restore access/i })).toHaveAttribute('href', '/access')
  })

  it('offers continue to checkout when Lemon URL is configured', async () => {
    const { resolveCheckoutBaseUrl } = await import('../../../lib/checkout.js')
    resolveCheckoutBaseUrl.mockResolvedValue('https://checkout.example/buy')

    render(
      <MemoryRouter initialEntries={['/purchase']}>
        <Routes>
          <Route path="/purchase" element={<PurchaseFlowPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continue to secure checkout/i })).toBeInTheDocument()
    })
  })
})
