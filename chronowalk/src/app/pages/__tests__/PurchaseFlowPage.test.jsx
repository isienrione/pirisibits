import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PurchaseFlowPage } from '../PurchaseFlowPage'
import { grantTestAccess } from '../../../test/grantTestAccess.js'

vi.mock('../../../lib/checkout.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    resolveCheckoutReady: vi.fn(async () => false),
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
    const { resolveCheckoutReady } = await import('../../../lib/checkout.js')
    resolveCheckoutReady.mockResolvedValue(false)
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

  it('opens Paddle checkout from Continue without a consent checkbox', async () => {
    const { resolveCheckoutReady, openCheckout } = await import('../../../lib/checkout.js')
    resolveCheckoutReady.mockResolvedValue(true)
    openCheckout.mockResolvedValue({ ok: true, mode: 'overlay', priceId: 'pri_test' })

    render(
      <MemoryRouter initialEntries={['/purchase?tier=rome-central']}>
        <Routes>
          <Route path="/purchase" element={<PurchaseFlowPage />} />
        </Routes>
      </MemoryRouter>,
    )

    const continueBtn = await screen.findByRole('button', { name: /continue to secure checkout/i })
    expect(continueBtn).toBeEnabled()
    expect(openCheckout).not.toHaveBeenCalled()

    fireEvent.click(continueBtn)
    await waitFor(() => {
      expect(openCheckout).toHaveBeenCalledWith({
        tierId: 'rome-central',
        source: 'purchase_flow',
      })
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
    grantTestAccess()

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
