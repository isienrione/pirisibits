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

    expect(screen.getByAltText('ChronoWalk')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: /Rome,\s*as it once was\./i })).toBeInTheDocument()
    expect(screen.getByText(/Walk the eternal city as it stood under emperors/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /begin your journey/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try the free preview/i })).toBeInTheDocument()
    expect(screen.getByText('20 stops')).toBeInTheDocument()
    expect(screen.getByText('Self-paced')).toBeInTheDocument()
    expect(screen.getByText('Works offline')).toBeInTheDocument()
    expect(screen.getByText('Hear the Pantheon')).toBeInTheDocument()
    expect(screen.getByText('4 minutes')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /preview story/i })).toBeInTheDocument()
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

  it('navigates to legacy from preview story CTA', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /preview story/i }))
    expect(navigate).toHaveBeenCalledWith(ROUTES.legacy)
  })

  it('opens settings from the landing header', () => {
    navigate.mockClear()

    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /^settings$/i }))
    expect(navigate).toHaveBeenCalledWith(ROUTES.settings)
  })
})
