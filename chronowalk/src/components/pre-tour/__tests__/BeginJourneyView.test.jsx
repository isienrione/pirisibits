import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { BeginJourneyView } from '../views/BeginJourneyView'

describe('BeginJourneyView', () => {
  it('renders the cinematic tour start hierarchy', () => {
    render(
      <BeginJourneyView
        tourId="heart-of-ancient-rome"
        onStartJourney={vi.fn()}
        onBack={vi.fn()}
      />
    )

    expect(screen.getByText('ChronoWalk')).toBeInTheDocument()
    expect(screen.getByText(/heart of ancient rome/i)).toBeInTheDocument()
    expect(screen.getByText(/place-aware stories/i)).toBeInTheDocument()
    expect(screen.getByText('GPS guided')).toBeInTheDocument()
    expect(screen.getByText('Audio stories')).toBeInTheDocument()
    expect(screen.getByText('Visual reveals')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /start tour/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /preview stops/i })).toBeInTheDocument()
    expect(screen.getByText(/we use your location only while the tour is active/i)).toBeInTheDocument()
  })

  it('reveals stops and offline download when preview is toggled', () => {
    render(
      <BeginJourneyView
        tourId="heart-of-ancient-rome"
        onStartJourney={vi.fn()}
        onBack={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /preview stops/i }))

    expect(screen.getByText('Colosseum')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /hide stops/i })).toBeInTheDocument()
  })

  it('calls onStartJourney from the gold CTA', () => {
    const onStartJourney = vi.fn()
    render(
      <BeginJourneyView
        tourId="heart-of-ancient-rome"
        onStartJourney={onStartJourney}
        onBack={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /start tour/i }))

    expect(onStartJourney).toHaveBeenCalledTimes(1)
    expect(onStartJourney.mock.calls[0][0].id).toBe('heart-of-ancient-rome')
  })
})
