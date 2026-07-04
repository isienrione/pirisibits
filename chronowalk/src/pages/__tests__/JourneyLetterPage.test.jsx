import { describe, expect, it, beforeEach, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import JourneyLetterPage from '../JourneyLetterPage'
import {
  JOURNEY_STATES,
  defaultJourneySnapshot,
  hydrateJourney,
} from '../../state/journeyState'
import { writeTravelerName } from '../../utils/travelerProfile'
import { ROUTES } from '../../routes/paths'

function renderLetterPage() {
  return render(
    <MemoryRouter initialEntries={[ROUTES.journeySummary]}>
      <Routes>
        <Route path={ROUTES.journeySummary} element={<JourneyLetterPage />} />
        <Route path={ROUTES.journeyTimeline} element={<div>Journey timeline</div>} />
        <Route path={ROUTES.romePassport} element={<div>Rome passport</div>} />
        <Route path={ROUTES.home} element={<div>Home</div>} />
        <Route path={ROUTES.journey} element={<div>Journey map</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('JourneyLetterPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    writeTravelerName('Livia')
    hydrateJourney({
      state: JOURNEY_STATES.COMPLETE,
      context: {
        ...defaultJourneySnapshot().context,
        currentStopId: 'castel-sant-angelo',
        currentStopIndex: 11,
        completedStopIds: ['colosseum', 'pantheon', 'piazza-navona'],
      },
    })
  })

  it('renders the journey letter for a completed tour', () => {
    renderLetterPage()

    expect(screen.getByTestId('journey-letter')).toBeInTheDocument()
    expect(screen.getByText('Dear Livia,')).toBeInTheDocument()
    expect(screen.getByText(/never stopped remembering/i)).toBeInTheDocument()
  })

  it('returns home from the letter', async () => {
    renderLetterPage()

    fireEvent.click(screen.getByRole('button', { name: /return home/i }))

    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument()
    })
  })

  it('opens the journey timeline from the letter', async () => {
    renderLetterPage()

    fireEvent.click(screen.getByRole('button', { name: /your timeline/i }))

    await waitFor(() => {
      expect(screen.getByText('Journey timeline')).toBeInTheDocument()
    })
  })

  it('redirects outside complete state', () => {
    hydrateJourney({
      state: JOURNEY_STATES.WALKING,
      context: defaultJourneySnapshot().context,
    })

    renderLetterPage()

    expect(screen.getByText('Journey map')).toBeInTheDocument()
  })
})
