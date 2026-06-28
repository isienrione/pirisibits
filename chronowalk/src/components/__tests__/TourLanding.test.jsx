import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TourLanding from '../TourLanding'

describe('TourLanding', () => {
  it('shows the intro screen before purchases', () => {
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
    expect(screen.getByRole('button', { name: /try a bit for free/i })).toBeInTheDocument()
  })

  it('shows the bundle first on the catalog screen', () => {
    render(
      <TourLanding
        ownedTourIds={[]}
        ownsAllTours={false}
        onPurchaseProduct={vi.fn()}
        onStartTour={vi.fn()}
        onTryFreePreview={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /see tours & pricing/i }))

    const headings = screen.getAllByRole('heading', { level: 3 })
    expect(headings[0]).toHaveTextContent(/complete rome/i)
    expect(screen.getByRole('heading', { name: /^roman forum$/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: /^heart of ancient rome$/i })).toBeInTheDocument()
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
        onTryFreePreview={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /start heart of ancient rome/i }))
    expect(onStartTour).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'heart-of-ancient-rome', title: 'Heart of Ancient Rome' })
    )
  })
})
