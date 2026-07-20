import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { fireEvent, render, screen, act } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ThresholdPage from '../ThresholdPage'
import {
  JOURNEY_STATES,
  defaultJourneySnapshot,
  hydrateJourney,
} from '../../state/journeyState'
import { ROUTES } from '../../routes/paths'

vi.mock('../../hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}))

vi.mock('react-compare-slider', () => ({
  ReactCompareSlider: ({ handle, onPositionChange }) => (
    <div data-testid="threshold-compare-slider">
      {handle}
      <button
        type="button"
        aria-label="Reveal ancient layer"
        onClick={() => onPositionChange?.(40)}
      >
        Drag reveal
      </button>
    </div>
  ),
  ReactCompareSliderImage: ({ alt }) => <img alt={alt} />,
}))

function renderThresholdPage() {
  return render(
    <MemoryRouter initialEntries={[ROUTES.threshold]}>
      <Routes>
        <Route path={ROUTES.threshold} element={<ThresholdPage />} />
        <Route path={ROUTES.reconstruction} element={<div>Ancient reconstruction</div>} />
        <Route path={ROUTES.landmark} element={<div>Landmark card</div>} />
        <Route path={ROUTES.journey} element={<div>Journey map</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ThresholdPage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
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

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the threshold reveal in immersion mode', () => {
    renderThresholdPage()

    expect(screen.getByTestId('threshold-reveal')).toBeInTheDocument()
    expect(screen.getByText('Hold')).toBeInTheDocument()
  })

  it('routes to ancient reconstruction after the reveal ceremony', () => {
    renderThresholdPage()

    fireEvent.pointerDown(screen.getByTestId('threshold-surface'))
    act(() => {
      vi.advanceTimersByTime(900)
    })

    fireEvent.click(screen.getByRole('button', { name: /reveal ancient layer/i }))
    fireEvent.pointerUp(screen.getByTestId('threshold-surface'))

    act(() => {
      vi.runAllTimers()
    })

    expect(screen.getByText('Ancient reconstruction')).toBeInTheDocument()
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

    renderThresholdPage()

    expect(screen.getByText('Landmark card')).toBeInTheDocument()
  })
})
