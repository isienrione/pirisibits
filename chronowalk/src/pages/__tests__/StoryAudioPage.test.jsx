import { describe, expect, it, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import StoryAudioPage from '../StoryAudioPage'
import {
  JOURNEY_STATES,
  defaultJourneySnapshot,
  hydrateJourney,
} from '../../state/journeyState'
import { ROUTES } from '../../routes/paths'

vi.mock('../../hooks/useStoryAudio', () => ({
  useStoryAudio: () => ({
    isPlaying: false,
    duration: 180,
    currentTime: 0,
    progress: 0,
    toggle: vi.fn(),
    seekBy: vi.fn(),
    seekToProgress: vi.fn(),
  }),
}))

vi.mock('../../hooks/useOfflineDownload', () => ({
  useOfflineDownload: () => ({
    isDownloaded: true,
  }),
}))

function renderStoryPage() {
  return render(
    <MemoryRouter initialEntries={[ROUTES.story]}>
      <Routes>
        <Route path={ROUTES.story} element={<StoryAudioPage />} />
        <Route path={ROUTES.landmark} element={<div>Landmark card</div>} />
        <Route path={ROUTES.journey} element={<div>Journey map</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('StoryAudioPage', () => {
  beforeEach(() => {
    hydrateJourney({
      state: JOURNEY_STATES.STORY,
      context: {
        ...defaultJourneySnapshot().context,
        currentStopId: 'colosseum',
        currentStopIndex: 0,
      },
    })
  })

  it('renders the audio player in story state', () => {
    renderStoryPage()

    expect(screen.getByTestId('story-audio-player')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: /the colosseum/i })).toBeInTheDocument()
  })

  it('redirects outside story state', () => {
    hydrateJourney({
      state: JOURNEY_STATES.WALKING,
      context: {
        ...defaultJourneySnapshot().context,
        currentStopId: 'colosseum',
        currentStopIndex: 0,
      },
    })

    renderStoryPage()

    expect(screen.getByText('Journey map')).toBeInTheDocument()
  })
})
