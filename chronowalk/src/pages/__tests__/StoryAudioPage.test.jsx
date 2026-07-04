import { describe, expect, it, beforeEach, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import StoryAudioPage from '../StoryAudioPage'
import {
  JOURNEY_STATES,
  defaultJourneySnapshot,
  hydrateJourney,
} from '../../state/journeyState'
import { ROUTES } from '../../routes/paths'

let capturedOnEnded

vi.mock('../../hooks/useStoryAudio', () => ({
  useStoryAudio: (options) => {
    capturedOnEnded = options.onEnded
    return {
      isPlaying: false,
      duration: 180,
      currentTime: 0,
      progress: 0,
      toggle: vi.fn(),
      seekBy: vi.fn(),
      seekToProgress: vi.fn(),
    }
  },
}))

vi.mock('../../hooks/useOfflineDownload', () => ({
  useOfflineDownload: () => ({
    isDownloaded: true,
  }),
}))

vi.mock('../../utils/journeyRecapStorage', () => ({
  recordAudioListened: vi.fn(),
}))

function renderStoryPage() {
  return render(
    <MemoryRouter initialEntries={[ROUTES.story]}>
      <Routes>
        <Route path={ROUTES.story} element={<StoryAudioPage />} />
        <Route path={ROUTES.storyChapters} element={<div>Story chapters</div>} />
        <Route path={ROUTES.storyTranscript} element={<div>Story transcript</div>} />
        <Route path={ROUTES.storyReflection} element={<div>Story reflection</div>} />
        <Route path={ROUTES.landmark} element={<div>Landmark card</div>} />
        <Route path={ROUTES.journey} element={<div>Journey map</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('StoryAudioPage', () => {
  beforeEach(() => {
    capturedOnEnded = undefined
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

  it('routes to reflection when the story ends', async () => {
    const { recordAudioListened } = await import('../../utils/journeyRecapStorage')

    renderStoryPage()

    expect(typeof capturedOnEnded).toBe('function')
    capturedOnEnded()

    await waitFor(() => {
      expect(recordAudioListened).toHaveBeenCalledWith('colosseum')
      expect(screen.getByText('Story reflection')).toBeInTheDocument()
    })
  })

  it('opens the chapter timeline from the player', () => {
    renderStoryPage()

    fireEvent.click(screen.getByRole('button', { name: /chapters/i }))

    expect(screen.getByText('Story chapters')).toBeInTheDocument()
  })

  it('opens the transcript reader from the player', () => {
    renderStoryPage()

    fireEvent.click(screen.getByRole('button', { name: /^transcript$/i }))

    expect(screen.getByText('Story transcript')).toBeInTheDocument()
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
