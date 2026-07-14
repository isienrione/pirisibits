import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ChronoWalkLanding from '../ChronoWalkLanding.jsx'
import { clearPendingProductId, readPendingProductId } from '../../data/pendingPurchase.js'

const navigateMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

vi.mock('../useLandingPrice.js', () => ({
  useLandingPrice: () => ({
    cents: 1700,
    checkoutUrl: '',
    label: '€17',
  }),
}))

describe('ChronoWalkLanding tier purchase handoff', () => {
  beforeEach(() => {
    navigateMock.mockClear()
    clearPendingProductId()
    localStorage.clear()
    sessionStorage.clear()
  })

  it('stashes rome-central from the Historica pricing card and opens access with product_id', () => {
    render(
      <MemoryRouter>
        <ChronoWalkLanding />
      </MemoryRouter>,
    )

    const pricing = document.getElementById('pricing') || document.querySelector('.cw-v2-pricing')
    expect(pricing).toBeTruthy()

    const historicaCard = within(pricing).getByText('Roma Historica').closest('article')
    expect(historicaCard).toBeTruthy()
    fireEvent.click(within(historicaCard).getByRole('button', { name: /begin journey/i }))

    expect(readPendingProductId()).toBe('rome-central')
    expect(navigateMock).toHaveBeenCalledWith('/access?product_id=rome-central')
  })

  it('stashes rome-essential from the Antica pricing card', () => {
    render(
      <MemoryRouter>
        <ChronoWalkLanding />
      </MemoryRouter>,
    )

    const pricing = document.getElementById('pricing') || document.querySelector('.cw-v2-pricing')
    const anticaCard = within(pricing).getByText('Roma Antica').closest('article')
    fireEvent.click(within(anticaCard).getByRole('button', { name: /begin journey/i }))

    expect(readPendingProductId()).toBe('rome-essential')
    expect(navigateMock).toHaveBeenCalledWith('/access?product_id=rome-essential')
  })
})
