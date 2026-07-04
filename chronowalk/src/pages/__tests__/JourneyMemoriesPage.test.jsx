import { describe, expect, it, beforeEach, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import JourneyMemoriesPage from '../JourneyMemoriesPage'
import {
  JOURNEY_STATES,
  defaultJourneySnapshot,
  hydrateJourney,
} from '../../state/journeyState'
import {
  recordAudioListened,
  recordJournalReflection,
  recordPhotoCapture,
} from '../../utils/journeyRecapStorage'
import { ROUTES } from '../../routes/paths'

function renderMemoriesPage() {
  return render(
    <MemoryRouter initialEntries={[ROUTES.journeyMemories]}>
      <Routes>
        <Route path={ROUTES.journeyMemories} element={<JourneyMemoriesPage />} />
        <Route path={ROUTES.exploreMore} element={<div>Explore more</div>} />
        <Route path={ROUTES.settings} element={<div>Settings</div>} />
        <Route path={ROUTES.journey} element={<div>Journey map</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('JourneyMemoriesPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    recordPhotoCapture('colosseum')
    recordAudioListened('colosseum')
    recordJournalReflection('pantheon', 'For nearly two thousand years, this dome remained the largest on Earth.')
    hydrateJourney({
      state: JOURNEY_STATES.COMPLETE,
      context: {
        ...defaultJourneySnapshot().context,
        currentStopId: 'pantheon',
        completedStopIds: ['colosseum'],
      },
    })
  })

  it('renders the memories archive for a completed tour', () => {
    renderMemoriesPage()

    expect(screen.getByTestId('journey-memories-screen')).toBeInTheDocument()
    expect(screen.getByTestId('memory-place-colosseum')).toBeInTheDocument()
    expect(screen.getByTestId('memory-place-pantheon')).toBeInTheDocument()
  })

  it('returns to explore more', async () => {
    renderMemoriesPage()

    fireEvent.click(screen.getByRole('button', { name: /back to explore more/i }))

    await waitFor(() => {
      expect(screen.getByText('Explore more')).toBeInTheDocument()
    })
  })

  it('opens settings from memories', async () => {
    renderMemoriesPage()

    fireEvent.click(screen.getByRole('button', { name: /^settings$/i }))

    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })
  })

  it('redirects outside complete state', () => {
    hydrateJourney({
      state: JOURNEY_STATES.WALKING,
      context: defaultJourneySnapshot().context,
    })

    renderMemoriesPage()

    expect(screen.getByText('Journey map')).toBeInTheDocument()
  })
})
