import { describe, expect, it, beforeEach, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import RomePassportPage from '../RomePassportPage'
import {
  JOURNEY_STATES,
  defaultJourneySnapshot,
  hydrateJourney,
} from '../../state/journeyState'
import { writeTravelerName } from '../../utils/travelerProfile'
import { ROUTES } from '../../routes/paths'

function renderPassportPage() {
  return render(
    <MemoryRouter initialEntries={[ROUTES.romePassport]}>
      <Routes>
        <Route path={ROUTES.romePassport} element={<RomePassportPage />} />
        <Route path={ROUTES.journeyTimeline} element={<div>Journey timeline</div>} />
        <Route path={ROUTES.journey} element={<div>Journey map</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('RomePassportPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    writeTravelerName('Livia')
    hydrateJourney({
      state: JOURNEY_STATES.COMPLETE,
      context: {
        ...defaultJourneySnapshot().context,
        currentStopId: 'pantheon',
        currentStopIndex: 4,
        completedStopIds: ['colosseum'],
      },
    })
  })

  it('renders the rome passport for a completed tour', () => {
    renderPassportPage()

    expect(screen.getByTestId('rome-passport-screen')).toBeInTheDocument()
    expect(screen.getByText('Livia')).toBeInTheDocument()
    expect(screen.getByTestId('passport-stamp-colosseum')).toBeInTheDocument()
    expect(screen.getByTestId('passport-stamp-pantheon')).toBeInTheDocument()
  })

  it('returns to the journey timeline', async () => {
    renderPassportPage()

    fireEvent.click(screen.getByRole('button', { name: /back to your timeline/i }))

    await waitFor(() => {
      expect(screen.getByText('Journey timeline')).toBeInTheDocument()
    })
  })

  it('redirects outside complete state', () => {
    hydrateJourney({
      state: JOURNEY_STATES.WALKING,
      context: defaultJourneySnapshot().context,
    })

    renderPassportPage()

    expect(screen.getByText('Journey map')).toBeInTheDocument()
  })
})
