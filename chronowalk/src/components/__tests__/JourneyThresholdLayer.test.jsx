import { describe, expect, it, beforeEach, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ThresholdChromeProvider } from '../../context/ThresholdChromeContext.jsx'
import { JourneyThresholdLayer } from '../../app/pages/ThresholdPage.jsx'
import {
  beginJourney,
  getJourneySnapshot,
  resetJourney,
  transitionJourney,
  JOURNEY_STATES,
} from '../../state/journey.js'

vi.mock('../../hooks/useReducedMotion.js', () => ({
  useReducedMotion: () => true,
}))

vi.mock('../../audio/thresholdAudio.js', () => ({
  ThresholdAudioCrossfade: class {
    start() {}
    stop() {}
    rampToThen() {}
    rampToNow() {}
  },
}))

async function crossThreshold() {
  expect(await screen.findByText(/press and hold to cross/i)).toBeInTheDocument()

  const surface = document.querySelector('.threshold-root')
  expect(surface).toBeTruthy()
  fireEvent.pointerDown(surface, { pointerId: 1, clientX: 100, clientY: 100 })
}

describe('JourneyThresholdLayer', () => {
  beforeEach(() => {
    localStorage.clear()
    resetJourney()
  })

  it('advances the journey after threshold completion', async () => {
    beginJourney({ pace: 'classic' })
    transitionJourney(JOURNEY_STATES.THRESHOLD, { currentSequenceIndex: 0 })

    render(
      <ThresholdChromeProvider>
        <JourneyThresholdLayer />
      </ThresholdChromeProvider>
    )

    await crossThreshold()

    expect(await screen.findByTestId('threshold-continue')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('threshold-continue'))

    const snapshot = getJourneySnapshot()
    expect(snapshot.state).toBe(JOURNEY_STATES.WALKING)
    expect(snapshot.context.completedWaypointIds).toContain('w01')
    expect(snapshot.context.currentSequenceIndex).toBe(1)
  })

  it('does not offer a back-to-story loop after crossing', async () => {
    beginJourney({ pace: 'classic' })
    transitionJourney(JOURNEY_STATES.THRESHOLD, { currentSequenceIndex: 0 })

    render(
      <ThresholdChromeProvider>
        <JourneyThresholdLayer />
      </ThresholdChromeProvider>
    )

    await crossThreshold()

    expect(await screen.findByTestId('threshold-continue')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /back to story/i })).not.toBeInTheDocument()
  })

  it('allows skipping the hold interaction to continue walking', async () => {
    beginJourney({ pace: 'classic' })
    transitionJourney(JOURNEY_STATES.THRESHOLD, { currentSequenceIndex: 0 })

    render(
      <ThresholdChromeProvider>
        <JourneyThresholdLayer />
      </ThresholdChromeProvider>
    )

    fireEvent.click(await screen.findByTestId('threshold-skip'))

    const snapshot = getJourneySnapshot()
    expect(snapshot.state).toBe(JOURNEY_STATES.WALKING)
    expect(snapshot.context.completedWaypointIds).toContain('w01')
  })
})
