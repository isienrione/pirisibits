import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ContinueWalkingPage from '../ContinueWalkingPage'
import {
  JOURNEY_STATES,
  defaultJourneySnapshot,
  hydrateJourney,
} from '../../state/journeyState'
import { loadRomeTourManifest } from '../../content/romeTourManifest'
import { ROUTES } from '../../routes/paths'

describe('ContinueWalkingPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.stubGlobal('location', { ...window.location, assign: vi.fn() })

    hydrateJourney({
      state: JOURNEY_STATES.THRESHOLD,
      context: {
        ...defaultJourneySnapshot().context,
        currentStopId: 'colosseum',
        currentStopIndex: 0,
      },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the continue walking screen in explorer mode', () => {
    const manifest = loadRomeTourManifest()
    const nextStop = manifest.stopsById['palatine-hill-cluster']

    render(
      <MemoryRouter initialEntries={[ROUTES.continueWalking]}>
        <Routes>
          <Route path={ROUTES.continueWalking} element={<ContinueWalkingPage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByTestId('continue-walking-screen')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: nextStop.title })).toBeInTheDocument()
    expect(screen.getByText(`1 of ${manifest.stops.length}`)).toBeInTheDocument()
  })

  it('advances to walking and navigates to the journey map', () => {
    render(
      <MemoryRouter initialEntries={[ROUTES.continueWalking]}>
        <Routes>
          <Route path={ROUTES.continueWalking} element={<ContinueWalkingPage />} />
        </Routes>
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /^continue$/i }))

    expect(window.location.assign).toHaveBeenCalledWith('/journey')
  })

  it('redirects outside threshold state', () => {
    hydrateJourney({
      state: JOURNEY_STATES.WALKING,
      context: {
        ...defaultJourneySnapshot().context,
        currentStopId: 'colosseum',
        currentStopIndex: 0,
      },
    })

    render(
      <MemoryRouter initialEntries={[ROUTES.continueWalking]}>
        <Routes>
          <Route path={ROUTES.continueWalking} element={<ContinueWalkingPage />} />
          <Route path={ROUTES.journey} element={<div>Journey map</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Journey map')).toBeInTheDocument()
  })
})
