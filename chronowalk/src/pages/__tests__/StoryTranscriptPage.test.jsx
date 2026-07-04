import { describe, expect, it, beforeEach, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import StoryTranscriptPage from '../StoryTranscriptPage'
import {
  JOURNEY_STATES,
  defaultJourneySnapshot,
  hydrateJourney,
} from '../../state/journeyState'
import { ROUTES } from '../../routes/paths'

vi.mock('../../hooks/useStoryAudio', () => ({
  useStoryAudio: () => ({
    progress: 0.5,
  }),
}))

function renderTranscriptPage() {
  return render(
    <MemoryRouter initialEntries={[ROUTES.storyTranscript]}>
      <Routes>
        <Route path={ROUTES.storyTranscript} element={<StoryTranscriptPage />} />
        <Route path={ROUTES.story} element={<div>Story player</div>} />
        <Route path={ROUTES.landmark} element={<div>Landmark card</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('StoryTranscriptPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    hydrateJourney({
      state: JOURNEY_STATES.STORY,
      context: {
        ...defaultJourneySnapshot().context,
        currentStopId: 'colosseum',
        currentStopIndex: 0,
        audioProgress: 0.5,
      },
    })
  })

  it('renders the immersion transcript reader', async () => {
    renderTranscriptPage()

    expect(screen.getByTestId('story-transcript-reader')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText(/Fifty thousand spectators/i)).toBeInTheDocument()
    })
  })

  it('returns to the player from back', () => {
    renderTranscriptPage()

    fireEvent.click(screen.getByRole('button', { name: /back to player/i }))
    expect(screen.getByText('Story player')).toBeInTheDocument()
  })
})
