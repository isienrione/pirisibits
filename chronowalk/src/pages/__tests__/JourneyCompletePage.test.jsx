import { describe, expect, it, beforeEach, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import JourneyCompletePage from '../JourneyCompletePage'
import {
  JOURNEY_STATES,
  defaultJourneySnapshot,
  hydrateJourney,
} from '../../state/journeyState'
import { ROUTES } from '../../routes/paths'

function renderCompletePage() {
  return render(
    <MemoryRouter initialEntries={[ROUTES.complete]}>
      <Routes>
        <Route path={ROUTES.complete} element={<JourneyCompletePage />} />
        <Route path={ROUTES.journeySummary} element={<div>Journey summary</div>} />
        <Route path={ROUTES.home} element={<div>Home</div>} />
        <Route path={ROUTES.journey} element={<div>Journey map</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('JourneyCompletePage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    hydrateJourney({
      state: JOURNEY_STATES.COMPLETE,
      context: {
        ...defaultJourneySnapshot().context,
        currentStopId: 'castel-sant-angelo',
        currentStopIndex: 11,
        completedStopIds: ['colosseum', 'pantheon'],
      },
    })
  })

  it('renders the journey complete moment in immersion mode', () => {
    renderCompletePage()

    expect(screen.getByTestId('journey-complete-moment')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 1, name: /you walked ancient rome/i })
    ).toBeInTheDocument()
  })

  it('routes to the summary from the primary action', async () => {
    renderCompletePage()

    fireEvent.click(screen.getByRole('button', { name: /view summary/i }))

    await waitFor(() => {
      expect(screen.getByText('Journey summary')).toBeInTheDocument()
    })
  })

  it('redirects outside complete state', () => {
    hydrateJourney({
      state: JOURNEY_STATES.WALKING,
      context: defaultJourneySnapshot().context,
    })

    renderCompletePage()

    expect(screen.getByText('Journey map')).toBeInTheDocument()
  })
})
