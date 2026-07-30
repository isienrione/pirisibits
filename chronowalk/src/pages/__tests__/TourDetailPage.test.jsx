import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import TourDetailPage from '../TourDetailPage'
import { purchasePath, ROUTES } from '../../routes/paths'

const navigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigate,
  }
})

function renderRomeDetail() {
  return render(
    <MemoryRouter initialEntries={['/begin/rome']}>
      <Routes>
        <Route path="/begin/:destinationId" element={<TourDetailPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('TourDetailPage', () => {
  beforeEach(() => {
    navigate.mockClear()
  })

  it('renders Rome tour detail hero, stats, and purchase CTA', () => {
    renderRomeDetail()

    expect(screen.getByRole('heading', { level: 1, name: /^Rome$/i })).toBeInTheDocument()
    expect(screen.getByText('Duration')).toBeInTheDocument()
    expect(screen.getByText('Distance')).toBeInTheDocument()
    expect(screen.getByText('Walking')).toBeInTheDocument()
    expect(screen.getByText('Stories')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /your route/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /preview story/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /timeline/i })).toBeInTheDocument()
    expect(screen.getByText('Colosseum - opening story')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /purchase journey/i })).toBeInTheDocument()
    expect(screen.getByText('€14.99')).toBeInTheDocument()
  })

  it('highlights a timeline stop when tapped', () => {
    renderRomeDetail()

    // Accessible name includes the stop number prefix (e.g. "13The Pantheon").
    const pantheon = screen.getByRole('button', { name: /The Pantheon/i })
    fireEvent.click(pantheon)
    expect(pantheon.className).toMatch(/border-bronze/)
    expect(screen.getByRole('button', { name: /Pantheon interior/i })).toBeInTheDocument()
  })

  it('navigates back to tour selection', () => {
    renderRomeDetail()

    fireEvent.click(screen.getByRole('button', { name: /back/i }))
    expect(navigate).toHaveBeenCalledWith(ROUTES.begin)
  })

  it('navigates to purchase from purchase CTA', () => {
    renderRomeDetail()

    fireEvent.click(screen.getByRole('button', { name: /purchase journey/i }))
    expect(navigate).toHaveBeenCalledWith(purchasePath('rome'))
  })
})
