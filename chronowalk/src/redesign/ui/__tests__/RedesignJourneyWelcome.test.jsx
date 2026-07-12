import { describe, expect, it, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import RedesignJourneyWelcome from '../RedesignJourneyWelcome.jsx'
import { beginJourney, resetJourney } from '../../../state/journey.js'
import { JOURNEY_PACE } from '../../../data/romePacing.js'

describe('RedesignJourneyWelcome', () => {
  beforeEach(() => {
    localStorage.clear()
    resetJourney()
    beginJourney({ pace: 'classic' })
  })

  it('shows the illustrated route as the hero', () => {
    render(<RedesignJourneyWelcome onUnlock={() => {}} />)

    expect(screen.getByTestId('journey-welcome')).toBeInTheDocument()
    expect(screen.getByText(/your rome awaits/i)).toBeInTheDocument()
    expect(screen.getByText(/one living city/i)).toBeInTheDocument()
    expect(screen.getByTestId('tour-route-illustration')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /begin your walk/i })).toBeInTheDocument()
  })

  it('reflects heroic pace stop count on the welcome screen', () => {
    resetJourney()
    beginJourney({ pace: JOURNEY_PACE.HEROIC })

    render(<RedesignJourneyWelcome onUnlock={() => {}} />)

    expect(screen.getByText(/18 stops/i)).toBeInTheDocument()
  })
})
