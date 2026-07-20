import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import JourneyDevPanel from '../JourneyDevPanel.jsx'
import { defaultJourneySnapshot, hydrateJourney } from '../../../state/journeyState'

describe('JourneyDevPanel', () => {
  it('renders state transition controls in dev', () => {
    hydrateJourney(defaultJourneySnapshot())

    render(<JourneyDevPanel />)

    expect(screen.getByTestId('journey-dev-panel')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'walking' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'threshold' })).toBeInTheDocument()
  })
})
