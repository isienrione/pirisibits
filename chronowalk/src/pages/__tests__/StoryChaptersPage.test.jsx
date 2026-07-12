import { describe, expect, it, beforeEach, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import StoryChaptersPage from '../StoryChaptersPage'
import {
  JOURNEY_STATES,
  defaultJourneySnapshot,
  getJourneySnapshot,
  hydrateJourney,
} from '../../state/journeyState'
import { ROUTES } from '../../routes/paths'

function renderChaptersPage() {
  return render(
    <MemoryRouter initialEntries={[ROUTES.storyChapters]}>
      <Routes>
        <Route path={ROUTES.storyChapters} element={<StoryChaptersPage />} />
        <Route path={ROUTES.story} element={<div>Story player</div>} />
        <Route path={ROUTES.landmark} element={<div>Landmark card</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('StoryChaptersPage', () => {
  beforeEach(() => {
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

  it('renders story chapters in immersion mode', () => {
    renderChaptersPage()

    expect(screen.getByTestId('story-chapters-timeline')).toBeInTheDocument()
    expect(screen.getByText('The Architecture')).toBeInTheDocument()
  })

  it('replays a chapter by updating progress and returning to the player', () => {
    renderChaptersPage()

    fireEvent.click(screen.getByRole('button', { name: /the threshold/i }))

    expect(getJourneySnapshot().context.audioProgress).toBe(0)
    expect(screen.getByText('Story player')).toBeInTheDocument()
  })
})
