import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import StopsPage from '../StopsPage'
import {
  JOURNEY_STATES,
  hydrateJourney,
  defaultJourneySnapshot,
} from '../../state/journeyState'
import { ROUTES } from '../../routes/paths'

const navigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigate,
  }
})

describe('StopsPage', () => {
  beforeEach(() => {
    navigate.mockClear()
    hydrateJourney({
      state: JOURNEY_STATES.WALKING,
      context: {
        ...defaultJourneySnapshot().context,
        currentStopId: 'pantheon',
        currentStopIndex: 4,
        completedStopIds: ['colosseum', 'palatine-hill-cluster', 'capitoline-hill', 'trajan-market'],
      },
    })
  })

  it('lists stops in route order with progress', () => {
    render(
      <MemoryRouter>
        <StopsPage />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: /stops/i })).toBeInTheDocument()
    expect(screen.getByText(/4 of 12 visited/i)).toBeInTheDocument()
    expect(screen.getByText('Colosseum')).toBeInTheDocument()
    expect(screen.getByText('Pantheon')).toBeInTheDocument()
    expect(screen.getAllByText('Visited').length).toBeGreaterThan(0)
    expect(screen.getByText('Current')).toBeInTheDocument()
  })

  it('returns to the journey map from the primary action', () => {
    render(
      <MemoryRouter>
        <StopsPage />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /return to journey/i }))
    expect(navigate).toHaveBeenCalledWith(ROUTES.journey)
  })

  it('reopens a visited stop on the journey map', () => {
    render(
      <MemoryRouter>
        <StopsPage />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByTestId('journey-stop-card-colosseum'))

    expect(navigate).toHaveBeenCalledWith(ROUTES.journey)
  })
})
