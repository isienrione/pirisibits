import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LandingPage from '../LandingPage'
import { ROUTES } from '../../routes/paths'

const navigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigate,
  }
})

describe('LandingPage', () => {
  it('renders launch hero copy and primary CTA', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Rome, as it once was.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /begin your journey/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try the free preview/i })).toBeInTheDocument()
    expect(screen.getByText(/12 places · self-paced · works offline/i)).toBeInTheDocument()
  })

  it('navigates to begin journey from primary CTA', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /begin your journey/i }))
    expect(navigate).toHaveBeenCalledWith(ROUTES.begin)
  })
})
