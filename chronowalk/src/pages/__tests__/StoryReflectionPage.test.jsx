import { describe, expect, it, beforeEach, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import StoryReflectionPage from '../StoryReflectionPage'
import {
  JOURNEY_STATES,
  defaultJourneySnapshot,
  hydrateJourney,
} from '../../state/journeyState'
import { readJourneyRecap } from '../../utils/journeyRecapStorage'
import { ROUTES } from '../../routes/paths'

function renderReflectionPage() {
  return render(
    <MemoryRouter initialEntries={[ROUTES.storyReflection]}>
      <Routes>
        <Route path={ROUTES.storyReflection} element={<StoryReflectionPage />} />
        <Route path={ROUTES.landmark} element={<div>Landmark card</div>} />
        <Route path={ROUTES.journey} element={<div>Journey map</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('StoryReflectionPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    hydrateJourney({
      state: JOURNEY_STATES.STORY,
      context: {
        ...defaultJourneySnapshot().context,
        currentStopId: 'pantheon',
        currentStopIndex: 1,
      },
    })
  })

  it('renders the reflection pause in immersion mode', () => {
    renderReflectionPage()

    expect(screen.getByTestId('story-reflection-moment')).toBeInTheDocument()
    expect(screen.getByText(/two thousand years.*dome/i)).toBeInTheDocument()
  })

  it('returns to the landmark card on continue', () => {
    renderReflectionPage()

    fireEvent.click(screen.getByRole('button', { name: /^continue$/i }))

    expect(screen.getByText('Landmark card')).toBeInTheDocument()
  })

  it('records a journal reflection for the current stop', () => {
    renderReflectionPage()

    const recap = readJourneyRecap()
    expect(recap.journal).toHaveLength(1)
    expect(recap.journal[0].stopId).toBe('pantheon')
    expect(recap.journal[0].text).toMatch(/two thousand years/i)
  })

  it('redirects outside story state', () => {
    hydrateJourney({
      state: JOURNEY_STATES.WALKING,
      context: {
        ...defaultJourneySnapshot().context,
        currentStopId: 'pantheon',
        currentStopIndex: 1,
      },
    })

    renderReflectionPage()

    expect(screen.getByText('Journey map')).toBeInTheDocument()
  })
})
