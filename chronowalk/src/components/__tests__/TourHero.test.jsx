import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TourHero from '../TourHero'
import { ROME_CORE_TOUR } from '../../data/rome-core-tour'

describe('TourHero', () => {
  it('renders the premium landing hierarchy', () => {
    render(<TourHero tour={ROME_CORE_TOUR} onStartTour={vi.fn()} />)

    expect(screen.getByText('ChronoWalk')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /heart of ancient rome/i })).toBeInTheDocument()
    expect(screen.getByText(/place-aware audio/i)).toBeInTheDocument()
    expect(screen.getByText('GPS guided')).toBeInTheDocument()
    expect(screen.getByText('Audio stories')).toBeInTheDocument()
    expect(screen.getByText('Historical reveals')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /start tour/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /preview stops/i })).toBeInTheDocument()
    expect(screen.getByText(/location is used only/i)).toBeInTheDocument()
  })

  it('reveals the stop list when preview is toggled', () => {
    render(<TourHero tour={ROME_CORE_TOUR} onStartTour={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /preview stops/i }))

    expect(screen.getByText('Colosseum')).toBeInTheDocument()
    expect(screen.getByText('Pantheon')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /hide stops/i })).toBeInTheDocument()
  })

  it('calls onStartTour from the primary CTA', () => {
    const onStartTour = vi.fn()
    render(<TourHero tour={ROME_CORE_TOUR} onStartTour={onStartTour} />)

    fireEvent.click(screen.getByRole('button', { name: /start tour/i }))

    expect(onStartTour).toHaveBeenCalledTimes(1)
  })
})
