import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PurchasePage from '../PurchasePage'
import { beginJourneyPath } from '../../routes/paths'

const navigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigate,
  }
})

function renderRomePurchase() {
  return render(
    <MemoryRouter initialEntries={['/begin/rome/purchase']}>
      <Routes>
        <Route path="/begin/:destinationId/purchase" element={<PurchasePage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('PurchasePage', () => {
  beforeEach(() => {
    navigate.mockClear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders minimal order summary and secure payment', () => {
    renderRomePurchase()

    expect(screen.getByText('Rome')).toBeInTheDocument()
    expect(screen.getByText(/Full bundle · at your own pace/i)).toBeInTheDocument()
    expect(screen.getByText(/22 places · yours to keep/i)).toBeInTheDocument()
    expect(screen.getByText('Total')).toBeInTheDocument()
    expect(screen.getByText('$17.99')).toBeInTheDocument()
    expect(screen.getByText('Secure payment')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /pay \$17\.99/i })).toBeInTheDocument()
  })

  it('returns to tour detail on cancel', () => {
    renderRomePurchase()

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(navigate).toHaveBeenCalledWith('/begin/rome')
  })

  it('confirms purchase and navigates to begin journey', () => {
    renderRomePurchase()

    fireEvent.click(screen.getByRole('button', { name: /pay \$17\.99/i }))
    expect(screen.getByRole('button', { name: /confirming/i })).toBeDisabled()

    vi.advanceTimersByTime(450)
    expect(navigate).toHaveBeenCalledWith(beginJourneyPath('rome'), { replace: true })
  })
})
