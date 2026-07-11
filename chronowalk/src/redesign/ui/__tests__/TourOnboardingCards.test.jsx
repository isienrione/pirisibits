import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TourOnboardingCards from '../TourOnboardingCards.jsx'

describe('TourOnboardingCards', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows the walk card on the first stop', () => {
    render(
      <TourOnboardingCards
        state="walking"
        stepType="waypoint"
        stopTitle="The Colosseum"
      />,
    )

    expect(screen.getByTestId('tour-onboarding-cards')).toHaveAttribute('data-phase', 'walk')
    expect(screen.getByText(/Head toward The Colosseum/i)).toBeInTheDocument()
  })

  it('shows the listen card first during story playback', () => {
    render(
      <TourOnboardingCards
        state="story"
        stepType="waypoint"
        stopTitle="The Colosseum"
        hasReconstruction
      />,
    )

    expect(screen.getByTestId('tour-onboarding-cards')).toHaveAttribute('data-phase', 'listen')
    expect(screen.getByText(/Play and pause narration/i)).toBeInTheDocument()
  })

  it('marks onboarding complete after the final card is dismissed', () => {
    render(
      <TourOnboardingCards
        state="story"
        stepType="waypoint"
        stopTitle="The Colosseum"
        hasReconstruction
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.click(screen.getByRole('button', { name: 'Got it' }))

    expect(localStorage.getItem('cw_tour_onboarding_complete')).toBe('true')
  })
})
