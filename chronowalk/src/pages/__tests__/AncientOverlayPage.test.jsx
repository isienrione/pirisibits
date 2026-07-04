import { describe, expect, it, beforeEach, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AncientOverlayPage from '../AncientOverlayPage'
import {
  JOURNEY_STATES,
  defaultJourneySnapshot,
  hydrateJourney,
} from '../../state/journeyState'
import { ROUTES } from '../../routes/paths'

vi.mock('../../hooks/useCameraStream', () => ({
  useCameraStream: () => ({
    stream: { getTracks: () => [{ stop: vi.fn() }] },
    status: 'ready',
    error: null,
  }),
}))

vi.mock('../../utils/overlayCapture', () => ({
  captureOverlayFrame: vi.fn(),
  downloadCapture: vi.fn(),
}))

function renderOverlayPage() {
  return render(
    <MemoryRouter initialEntries={[ROUTES.overlay]}>
      <Routes>
        <Route path={ROUTES.overlay} element={<AncientOverlayPage />} />
        <Route path={ROUTES.landmark} element={<div>Landmark card</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('AncientOverlayPage', () => {
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

  it('renders the ancient overlay camera in threshold state', () => {
    renderOverlayPage()

    expect(screen.getByTestId('ancient-overlay-camera')).toBeInTheDocument()
    expect(screen.getByLabelText(/ancient overlay opacity/i)).toBeInTheDocument()
  })

  it('shows continue walking after the overlay is dismissed', () => {
    renderOverlayPage()

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

    renderOverlayPage()

    expect(screen.getByText('Landmark card')).toBeInTheDocument()
  })
})
