import { describe, expect, it, beforeEach, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import JourneyTimelinePage from '../JourneyTimelinePage'
import {
  JOURNEY_STATES,
  defaultJourneySnapshot,
  hydrateJourney,
} from '../../state/journeyState'
import { recordAudioListened, recordPhotoCapture } from '../../utils/journeyRecapStorage'
import { ROUTES } from '../../routes/paths'

function renderTimelinePage() {
  return render(
    <MemoryRouter initialEntries={[ROUTES.journeyTimeline]}>
      <Routes>
        <Route path={ROUTES.journeyTimeline} element={<JourneyTimelinePage />} />
        <Route path={ROUTES.journeySummary} element={<div>Journey letter</div>} />
        <Route path={ROUTES.journey} element={<div>Journey map</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('JourneyTimelinePage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    recordPhotoCapture('colosseum')
    recordAudioListened('colosseum')
    hydrateJourney({
      state: JOURNEY_STATES.COMPLETE,
      context: {
        ...defaultJourneySnapshot().context,
        currentStopId: 'pantheon',
        currentStopIndex: 1,
        completedStopIds: ['colosseum'],
      },
    })
  })

  it('renders the journey timeline for a completed tour', () => {
    renderTimelinePage()

    expect(screen.getByTestId('journey-timeline-screen')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /the path you walked/i })).toBeInTheDocument()
    expect(screen.getByText(/Photo captured/i)).toBeInTheDocument()
  })

  it('returns to the journey letter', async () => {
    renderTimelinePage()

    fireEvent.click(screen.getByRole('button', { name: /back to your letter/i }))

    await waitFor(() => {
      expect(screen.getByText('Journey letter')).toBeInTheDocument()
    })
  })

  it('redirects outside complete state', () => {
    hydrateJourney({
      state: JOURNEY_STATES.WALKING,
      context: defaultJourneySnapshot().context,
    })

    renderTimelinePage()

    expect(screen.getByText('Journey map')).toBeInTheDocument()
  })
})
