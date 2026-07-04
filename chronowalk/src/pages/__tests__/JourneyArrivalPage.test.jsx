import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import JourneyArrivalPage from '../JourneyArrivalPage'
import {
  JOURNEY_STATES,
  defaultJourneySnapshot,
  getJourneySnapshot,
  hydrateJourney,
} from '../../state/journeyState'
import { ROUTES } from '../../routes/paths'

function renderArrivalPage() {
  return render(
    <MemoryRouter initialEntries={[ROUTES.arrival]}>
      <Routes>
        <Route path={ROUTES.arrival} element={<JourneyArrivalPage />} />
        <Route path={ROUTES.journey} element={<div>Journey map</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('JourneyArrivalPage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    hydrateJourney(defaultJourneySnapshot())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders immersion arrival when journey state is arrived', () => {
    hydrateJourney({
      state: JOURNEY_STATES.ARRIVED,
      context: {
        ...defaultJourneySnapshot().context,
        currentStopId: 'colosseum',
        currentStopIndex: 0,
      },
    })

    renderArrivalPage()

    expect(screen.getByText("You've arrived.")).toBeInTheDocument()
  })

  it('redirects to journey map outside arrived state', () => {
    hydrateJourney({
      state: JOURNEY_STATES.WALKING,
      context: {
        ...defaultJourneySnapshot().context,
        currentStopId: 'colosseum',
        currentStopIndex: 0,
      },
    })

    renderArrivalPage()

    expect(screen.getByText('Journey map')).toBeInTheDocument()
  })

  it('advances journey into story when open story is chosen', async () => {
    hydrateJourney({
      state: JOURNEY_STATES.ARRIVED,
      context: {
        ...defaultJourneySnapshot().context,
        currentStopId: 'colosseum',
        currentStopIndex: 0,
      },
    })

    renderArrivalPage()

    await act(async () => {
      vi.advanceTimersByTime(2000)
    })
    fireEvent.click(screen.getByRole('button', { name: /open story/i }))

    expect(getJourneySnapshot().state).toBe(JOURNEY_STATES.STORY)
  })
})
