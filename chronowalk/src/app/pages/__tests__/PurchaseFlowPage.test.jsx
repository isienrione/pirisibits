import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PurchaseFlowPage } from '../PurchaseFlowPage'
import { ACCESS_KEY } from '../../../lib/config.js'

vi.mock('../../../lib/checkout.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    resolveCheckoutBaseUrl: vi.fn(async () => ''),
    openCheckout: vi.fn(),
  }
})

const stagingAllowedMock = vi.hoisted(() => vi.fn(() => false))

vi.mock('../../../lib/stagingCheckout.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    isStagingCheckoutAllowed: (...args) => stagingAllowedMock(...args),
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
  beforeEach(async () => {
    vi.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
    stagingAllowedMock.mockReturnValue(false)
    const { resolveCheckoutBaseUrl } = await import('../../../lib/checkout.js')
    resolveCheckoutBaseUrl.mockResolvedValue('')
  })

  it('blocks free unlock — no staging CTA without ?devUnlock=1', async () => {
    render(
      <MemoryRouter initialEntries={['/purchase?tier=rome-complete']}>
        <Routes>
          <Route path="/purchase" element={<PurchaseFlowPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText(/checkout is almost ready/i)).toBeInTheDocument()
    expect(screen.getByText(/will not unlock without/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /simulate paid unlock/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /complete staging purchase/i })).not.toBeInTheDocument()
  })

  it('offers Lemon checkout when configured', async () => {
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

  it('shows dev simulate unlock only with ?devUnlock=1', async () => {
    stagingAllowedMock.mockReturnValue(true)

    render(
      <MemoryRouter initialEntries={['/purchase?tier=rome-complete&devUnlock=1']}>
        <Routes>
          <Route path="/purchase" element={<PurchaseFlowPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText(/simulate paid unlock/i)).toBeInTheDocument()
  })

  it('sends already-unlocked visitors to setup', async () => {
    localStorage.setItem(ACCESS_KEY, 'true')

    render(
      <MemoryRouter initialEntries={['/purchase']}>
        <Routes>
          <Route path="/purchase" element={<PurchaseFlowPage />} />
          <Route path="/setup" element={<div>Setup route</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Setup route')).toBeInTheDocument()
  })
})
