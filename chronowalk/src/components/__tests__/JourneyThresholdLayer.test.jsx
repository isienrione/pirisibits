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

    expect(await screen.findByRole('button', { name: /continue walking/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /continue walking/i }))

    const snapshot = getJourneySnapshot()
    expect(snapshot.state).toBe(JOURNEY_STATES.WALKING)
    expect(snapshot.context.completedWaypointIds).toContain('w01')
    expect(snapshot.context.currentSequenceIndex).toBe(1)
  })

  it('returns to story when back is chosen after threshold', async () => {
    beginJourney({ pace: 'classic' })
    transitionJourney(JOURNEY_STATES.THRESHOLD, { currentSequenceIndex: 0 })

    render(
      <ThresholdChromeProvider>
        <JourneyThresholdLayer />
      </ThresholdChromeProvider>
    )

    await crossThreshold()

    fireEvent.click(await screen.findByRole('button', { name: /back to story/i }))

    const snapshot = getJourneySnapshot()
    expect(snapshot.state).toBe(JOURNEY_STATES.STORY)
    expect(snapshot.context.currentSequenceIndex).toBe(0)
  })
})
