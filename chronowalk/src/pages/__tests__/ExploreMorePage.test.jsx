import { describe, expect, it, beforeEach, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ExploreMorePage from '../ExploreMorePage'
import {
  JOURNEY_STATES,
  defaultJourneySnapshot,
  hydrateJourney,
} from '../../state/journeyState'
import { ROUTES } from '../../routes/paths'

function renderExploreMorePage() {
  return render(
    <MemoryRouter initialEntries={[ROUTES.exploreMore]}>
      <Routes>
        <Route path={ROUTES.exploreMore} element={<ExploreMorePage />} />
        <Route path={ROUTES.romePassport} element={<div>Rome passport</div>} />
        <Route path={ROUTES.home} element={<div>Home</div>} />
        <Route path={ROUTES.journey} element={<div>Journey map</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ExploreMorePage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    hydrateJourney({
      state: JOURNEY_STATES.COMPLETE,
      context: {
        ...defaultJourneySnapshot().context,
        currentStopId: 'pantheon',
        completedStopIds: ['colosseum'],
      },
    })
  })

  it('renders explore more for a completed tour', () => {
    renderExploreMorePage()

    expect(screen.getByTestId('explore-more-screen')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Florence' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Paris' })).toBeInTheDocument()
  })

  it('returns to the passport and home', async () => {
    renderExploreMorePage()

    fireEvent.click(screen.getByRole('button', { name: /back to your passport/i }))
    await waitFor(() => {
      expect(screen.getByText('Rome passport')).toBeInTheDocument()
    })

    renderExploreMorePage()
    fireEvent.click(screen.getByRole('button', { name: /return home/i }))
    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument()
    })
  })

  it('redirects outside complete state', () => {
    hydrateJourney({
      state: JOURNEY_STATES.WALKING,
      context: defaultJourneySnapshot().context,
    })

    renderExploreMorePage()

    expect(screen.getByText('Journey map')).toBeInTheDocument()
  })
})
