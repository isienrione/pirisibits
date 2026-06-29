import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TourLanding from '../TourLanding'

describe('TourLanding', () => {
  it('shows intro content and purchase options on one page', () => {
    render(
      <TourLanding
        ownedTourIds={[]}
        ownsAllTours={false}
        onPurchaseProduct={vi.fn()}
        onStartTour={vi.fn()}
        onTryFreePreview={vi.fn()}
      />
    )

    expect(
      screen.getByRole('heading', {
        name: /detailed, entertaining self-guided audio tour of rome/i,
      })
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try for free/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /complete rome/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^roman forum$/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: /^heart of ancient rome$/i })).toBeInTheDocument()
  })

  it('lists the bundle before single tour options', () => {
    render(
      <TourLanding
        ownedTourIds={[]}
        ownsAllTours={false}
        onPurchaseProduct={vi.fn()}
        onStartTour={vi.fn()}
        onTryFreePreview={vi.fn()}
      />
    )

    expect(screen.getByRole('heading', { level: 3, name: /^complete rome$/i })).toBeInTheDocument()
    expect(screen.getByText(/^Single tours$/i)).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /buy \$10/i })).toHaveLength(2)
    expect(screen.getByRole('button', { name: /buy \$15/i })).toBeInTheDocument()
  })

  it('shows add to home screen install panel', () => {
    render(
      <TourLanding
        ownedTourIds={[]}
        ownsAllTours={false}
        onPurchaseProduct={vi.fn()}
        onStartTour={vi.fn()}
        onTryFreePreview={vi.fn()}
      />
    )

    expect(screen.getByText(/add chronowalk to your home screen/i)).toBeInTheDocument()
  })

  it('starts selected tour when owned', () => {
    const onStartTour = vi.fn()
    render(
      <TourLanding
        ownedTourIds={['heart-of-ancient-rome']}
        ownsAllTours={false}
        onPurchaseProduct={vi.fn()}
        onStartTour={onStartTour}
        onTryFreePreview={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /start heart of ancient rome/i }))
    expect(onStartTour).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'heart-of-ancient-rome', title: 'Heart of Ancient Rome' })
    )
  })

  it('shows free preview for users who already own tours', () => {
    const onTryFreePreview = vi.fn()
    render(
      <TourLanding
        ownedTourIds={['heart-of-ancient-rome']}
        ownsAllTours={false}
        onPurchaseProduct={vi.fn()}
        onStartTour={vi.fn()}
        onTryFreePreview={onTryFreePreview}
      />
    )

    expect(screen.getByRole('button', { name: /try for free/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /try for free/i }))
    expect(onTryFreePreview).toHaveBeenCalledTimes(1)
  })
})
