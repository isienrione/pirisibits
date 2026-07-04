import { describe, expect, it, beforeEach, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ReconstructionPage from '../ReconstructionPage'
import {
  JOURNEY_STATES,
  defaultJourneySnapshot,
  hydrateJourney,
} from '../../state/journeyState'
import { ROUTES } from '../../routes/paths'

function renderReconstructionPage() {
  return render(
    <MemoryRouter initialEntries={[ROUTES.reconstruction]}>
      <Routes>
        <Route path={ROUTES.reconstruction} element={<ReconstructionPage />} />
        <Route path={ROUTES.landmark} element={<div>Landmark card</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ReconstructionPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    hydrateJourney({
      state: JOURNEY_STATES.THRESHOLD,
      context: {
        ...defaultJourneySnapshot().context,
        currentStopId: 'colosseum',
        currentStopIndex: 0,
      },
    })
  })

  it('renders the ancient reconstruction explorer in threshold state', () => {
    renderReconstructionPage()

    expect(screen.getByTestId('ancient-reconstruction-explorer')).toBeInTheDocument()
    expect(screen.getByAltText(/ancient reconstruction of colosseum/i)).toBeInTheDocument()
  })

  it('shows continue walking after the explorer is dismissed', () => {
    renderReconstructionPage()

    fireEvent.click(screen.getByRole('button', { name: /continue journey/i }))

    expect(screen.getByTestId('continue-walking-transition')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue walking/i })).toBeInTheDocument()
  })

  it('redirects outside threshold state', () => {
    hydrateJourney({
      state: JOURNEY_STATES.STORY,
      context: {
        ...defaultJourneySnapshot().context,
        currentStopId: 'colosseum',
        currentStopIndex: 0,
      },
    })

    renderReconstructionPage()

    expect(screen.getByText('Landmark card')).toBeInTheDocument()
  })
})
