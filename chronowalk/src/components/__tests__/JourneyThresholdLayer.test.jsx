import { describe, expect, it, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ThresholdChromeProvider } from '../../context/ThresholdChromeContext.jsx'
import { JourneyThresholdLayer } from '../../app/pages/ThresholdPage.jsx'
import { beginJourney, getJourneySnapshot, resetJourney, transitionJourney, JOURNEY_STATES } from '../../state/journey.js'

describe('JourneyThresholdLayer', () => {
  beforeEach(() => {
    localStorage.clear()
    resetJourney()
  })

  it('returns to story when dismissed', async () => {
    beginJourney({ pace: 'classic' })
    transitionJourney(JOURNEY_STATES.THRESHOLD)

    render(
      <ThresholdChromeProvider>
        <JourneyThresholdLayer />
      </ThresholdChromeProvider>
    )

    expect(await screen.findByRole('button', { name: /return to story/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /return to story/i }))
    expect(getJourneySnapshot().state).toBe(JOURNEY_STATES.STORY)
  })
})
