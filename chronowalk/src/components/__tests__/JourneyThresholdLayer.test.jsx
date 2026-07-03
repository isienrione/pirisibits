import { describe, expect, it, beforeEach } from 'vitest'
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

describe('JourneyThresholdLayer', () => {
  beforeEach(() => {
    localStorage.clear()
    resetJourney()
  })

  it('advances to walking when dismissed after threshold', async () => {
    beginJourney({ pace: 'classic' })
    transitionJourney(JOURNEY_STATES.THRESHOLD, { currentSequenceIndex: 0 })

    render(
      <ThresholdChromeProvider>
        <JourneyThresholdLayer />
      </ThresholdChromeProvider>
    )

    expect(await screen.findByRole('button', { name: /continue walking/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /continue walking/i }))

    const snapshot = getJourneySnapshot()
    expect(snapshot.state).toBe(JOURNEY_STATES.WALKING)
    expect(snapshot.context.completedWaypointIds).toContain('w01')
    expect(snapshot.context.currentSequenceIndex).toBe(1)
  })
})
