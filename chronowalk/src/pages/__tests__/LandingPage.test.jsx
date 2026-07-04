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
  it('renders launch hero copy and CTAs', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    expect(screen.getByText('ChronoWalk')).toBeInTheDocument()
    expect(screen.getByText('Rome, as it once was.')).toBeInTheDocument()
    expect(
      screen.getByText(/GPS-guided audio stories, ancient reconstructions/i)
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /begin your journey/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try the free preview/i })).toBeInTheDocument()
    expect(screen.getByText(/22 places · self-paced · works offline/i)).toBeInTheDocument()
    expect(screen.getByText('Hear the Pantheon')).toBeInTheDocument()
    expect(screen.getByText(/Free preview · 4 minutes/i)).toBeInTheDocument()
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

  it('navigates to legacy from secondary CTA', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /try the free preview/i }))
    expect(navigate).toHaveBeenCalledWith(ROUTES.legacy)
  })
})
