import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import TourSelectionPage from '../TourSelectionPage'
import { ROUTES, tourDetailPath } from '../../routes/paths'

const navigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigate,
  }
})

describe('TourSelectionPage', () => {
  beforeEach(() => {
    navigate.mockClear()
  })

  it('renders premium destination cards for all launch cities', () => {
    render(
      <MemoryRouter>
        <TourSelectionPage />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { level: 1, name: /choose your journey/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /rome/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /florence/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /pompeii/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /athens/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /paris/i })).toBeInTheDocument()
    expect(screen.getByText('22 places')).toBeInTheDocument()
    expect(screen.getByText('The eternal city')).toBeInTheDocument()
  })

  it('navigates to Rome tour detail when Rome is selected', () => {
    render(
      <MemoryRouter>
        <TourSelectionPage />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /rome/i }))
    expect(navigate).toHaveBeenCalledWith(tourDetailPath('rome'))
  })

  it('does not navigate when an unavailable destination is selected', () => {
    render(
      <MemoryRouter>
        <TourSelectionPage />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /florence/i }))
    expect(navigate).not.toHaveBeenCalled()
  })

  it('navigates home from back button', () => {
    render(
      <MemoryRouter>
        <TourSelectionPage />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /back/i }))
    expect(navigate).toHaveBeenCalledWith(ROUTES.home)
  })
})
