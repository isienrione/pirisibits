import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import BeginJourneyPage from '../BeginJourneyPage'
import { ROUTES } from '../../routes/paths'

const navigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigate,
  }
})

function renderRomeBeginJourney() {
  return render(
    <MemoryRouter initialEntries={['/begin/rome/start']}>
      <Routes>
        <Route path="/begin/:destinationId/start" element={<BeginJourneyPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('BeginJourneyPage', () => {
  beforeEach(() => {
    navigate.mockClear()
  })

  it('renders anticipation hero copy and start journey CTA', () => {
    renderRomeBeginJourney()

    expect(screen.getByRole('heading', { level: 1, name: /rome is waiting/i })).toBeInTheDocument()
    expect(
      screen.getByText(/when you are ready, the streets of the eternal city will open before you/i)
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /start journey/i })).toBeInTheDocument()
  })

  it('navigates to journey when start journey is tapped', () => {
    renderRomeBeginJourney()

    fireEvent.click(screen.getByRole('button', { name: /start journey/i }))
    expect(navigate).toHaveBeenCalledWith(ROUTES.journey, { replace: true })
  })
})
