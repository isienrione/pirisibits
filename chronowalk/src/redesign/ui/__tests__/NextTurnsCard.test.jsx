import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import NextTurnsCard, { formatNextTurnLine } from '../NextTurnsCard.jsx'

const steps = [
  { instruction: 'Exit the Colosseum and turn left', distanceM: 120, type: 'depart' },
  { instruction: 'Continue on Via dei Fori Imperiali', distanceM: 180, type: 'continue' },
  { instruction: 'Arrive at the Arch of Titus', distanceM: 40, type: 'arrive' },
]

describe('NextTurnsCard', () => {
  it('formats instruction with distance', () => {
    expect(formatNextTurnLine(steps[0])).toBe('Exit the Colosseum and turn left · 120 m')
    expect(formatNextTurnLine({ instruction: 'Continue' })).toBe('Continue')
  })

  it('renders a vertical timeline with destination thumbnail', () => {
    render(
      <NextTurnsCard
        steps={steps}
        currentStepIndex={0}
        destinationTitle="Arch of Titus"
        destinationPhoto="/waypoints/arch-of-titus/exterior/modern-exterior.jpg"
        maxVisible={4}
      />,
    )

    expect(screen.getByTestId('next-turns-card')).toBeInTheDocument()
    expect(screen.getByText('Next turns')).toBeInTheDocument()
    expect(screen.getByText('Arch of Titus')).toBeInTheDocument()
    expect(document.querySelector('.cw-next-turns-card__thumb')).toHaveAttribute(
      'src',
      '/waypoints/arch-of-titus/exterior/modern-exterior.jpg',
    )
    expect(
      screen.getByRole('list', { name: /upcoming maneuvers to arch of titus/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('Exit the Colosseum and turn left · 120 m')).toBeInTheDocument()
    expect(screen.getByText('Continue on Via dei Fori Imperiali · 180 m')).toBeInTheDocument()
  })

  it('offers retry and Google Maps when routing fails', () => {
    const onRetry = vi.fn()
    const onOpenExternalMaps = vi.fn()

    render(
      <NextTurnsCard
        error="Could not load walking directions. Try again or open Google Maps."
        destinationTitle="Pantheon"
        onRetry={onRetry}
        externalMapsUrl="https://www.google.com/maps/dir/?api=1&destination=41.9,12.4&travelmode=walking"
        onOpenExternalMaps={onOpenExternalMaps}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(onRetry).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: /open in google maps/i }))
    expect(onOpenExternalMaps).toHaveBeenCalledTimes(1)
  })
})
