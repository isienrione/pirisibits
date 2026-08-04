import { describe, expect, it, beforeEach, vi } from 'vitest'
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
    expect(screen.getByText(/Head to The Colosseum/i)).toBeInTheDocument()
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
    expect(screen.getByText(/Play and pause anytime/i)).toBeInTheDocument()
    expect(screen.getByTestId('tour-onboarding-cards')).toHaveAttribute('data-blocking', 'true')
  })

  it('uses a light temporary tip surface', () => {
    const { container } = render(
      <TourOnboardingCards
        state="story"
        stepType="waypoint"
        stopTitle="The Colosseum"
        hasReconstruction
      />,
    )

    expect(container.querySelector('.cw-tour-onboarding-cards__backdrop')).toBeTruthy()
    expect(screen.getByText(/Quick tip/i)).toBeInTheDocument()
  })

  it('reports blocking while visible and clears it when closed', () => {
    const onBlockingChange = vi.fn()
    render(
      <TourOnboardingCards
        state="story"
        stepType="waypoint"
        stopTitle="The Colosseum"
        hasReconstruction
        onBlockingChange={onBlockingChange}
      />,
    )

    expect(onBlockingChange).toHaveBeenCalledWith(true)
    fireEvent.click(screen.getByRole('button', { name: /Close tutorial/i }))
    expect(localStorage.getItem('cw_tour_onboarding_complete')).toBe('true')
    expect(onBlockingChange).toHaveBeenCalledWith(false)
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
    fireEvent.click(screen.getByRole('button', { name: 'Start listening' }))

    expect(localStorage.getItem('cw_tour_onboarding_complete')).toBe('true')
  })
})
