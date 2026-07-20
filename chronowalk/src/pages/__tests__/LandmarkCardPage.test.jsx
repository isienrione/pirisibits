import { describe, expect, it, beforeEach, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import LandmarkCardPage from '../LandmarkCardPage'
import StoryAudioPage from '../StoryAudioPage'
import {
  JOURNEY_STATES,
  defaultJourneySnapshot,
  getJourneySnapshot,
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
    isDownloaded: false,
  }),
}))

function renderLandmarkPage(initialEntry = ROUTES.landmark) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path={ROUTES.landmark} element={<LandmarkCardPage />} />
        <Route path={ROUTES.journey} element={<div>Journey map</div>} />
        <Route path={ROUTES.arrival} element={<div>Arrival ceremony</div>} />
        <Route path={ROUTES.story} element={<StoryAudioPage />} />
        <Route path={ROUTES.threshold} element={<div>Threshold reveal</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('LandmarkCardPage', () => {
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

  it('renders landmark card in story state', () => {
    renderLandmarkPage()

    expect(screen.getByTestId('landmark-card')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: /colosseum/i })).toBeInTheDocument()
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

    renderLandmarkPage()

    expect(screen.getByText('Journey map')).toBeInTheDocument()
  })

  it('routes begin story to the story screen', () => {
    renderLandmarkPage()

    fireEvent.click(screen.getByRole('button', { name: /begin story/i }))

    expect(screen.getByTestId('story-audio-player')).toBeInTheDocument()
  })

  it('enters threshold when see ancient rome is chosen', () => {
    renderLandmarkPage()

    fireEvent.click(screen.getByRole('button', { name: /see ancient rome/i }))

    expect(getJourneySnapshot().state).toBe(JOURNEY_STATES.THRESHOLD)
    expect(screen.getByText('Threshold reveal')).toBeInTheDocument()
  })
})
