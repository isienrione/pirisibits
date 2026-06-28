import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TourLanding from '../TourLanding'

describe('TourLanding', () => {
  it('shows purchasable tour options before any purchase', () => {
    render(
      <TourLanding
        ownedTourIds={[]}
        ownsAllTours={false}
        onPurchaseProduct={vi.fn()}
        onStartTour={vi.fn()}
      />
    )

    expect(screen.getByRole('heading', { name: /rome walking tours/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^roman forum$/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: /^heart of ancient rome$/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /complete rome/i })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /buy \$10/i })).toHaveLength(2)
    expect(screen.getByRole('button', { name: /buy \$15/i })).toBeInTheDocument()
  })

  it('starts selected tour when owned', () => {
    const onStartTour = vi.fn()
    render(
      <TourLanding
        ownedTourIds={['heart-of-ancient-rome']}
        ownsAllTours={false}
        onPurchaseProduct={vi.fn()}
        onStartTour={onStartTour}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /start heart of ancient rome/i }))
    expect(onStartTour).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'heart-of-ancient-rome', title: 'Heart of Ancient Rome' })
    )
  })
})
