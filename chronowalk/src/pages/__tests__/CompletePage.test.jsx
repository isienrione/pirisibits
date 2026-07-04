import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CompletePage from '../CompletePage'
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

describe('CompletePage', () => {
  beforeEach(() => {
    navigate.mockClear()
    hydrateJourney({
      state: JOURNEY_STATES.COMPLETE,
      context: {
        ...defaultJourneySnapshot().context,
        currentStopId: 'appian-way',
        currentStopIndex: 11,
        completedStopIds: [
          'colosseum',
          'palatine-hill-cluster',
          'capitoline-hill',
          'trajan-market',
          'pantheon',
          'fontana-di-trevi',
          'largo-argentina',
          'campo-de-fiori',
          'piazza-navona',
          'castel-sant-angelo',
          'circus-maximus',
        ],
        journeyStartedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
      },
    })
  })

  it('renders the premium completion copy and stats', () => {
    render(
      <MemoryRouter>
        <CompletePage />
      </MemoryRouter>
    )

    expect(screen.getByText('Journey complete')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /you walked through rome/i })).toBeInTheDocument()
    expect(screen.getByText('Stops visited')).toBeInTheDocument()
    expect(screen.getByText('Approx. distance')).toBeInTheDocument()
    expect(screen.getByText('Time spent')).toBeInTheDocument()
    expect(screen.getByText('11/12')).toBeInTheDocument()
  })

  it('navigates from primary and secondary actions', () => {
    render(
      <MemoryRouter>
        <CompletePage />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /view your journey/i }))
    expect(navigate).toHaveBeenCalledWith(ROUTES.stops)

    fireEvent.click(screen.getByRole('button', { name: /return to map/i }))
    expect(navigate).toHaveBeenCalledWith(ROUTES.journey)
  })
})
