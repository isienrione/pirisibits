import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TourLanding from '../TourLanding'

describe('TourLanding pre-tour screen stack', () => {
  it('shows welcome screen first for new users', () => {
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
    expect(screen.getByRole('button', { name: /browse tours & pricing/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /complete rome/i })).not.toBeInTheDocument()
  })

  it('navigates to catalog as a separate screen', () => {
    render(
      <TourLanding
        ownedTourIds={[]}
        ownsAllTours={false}
        onPurchaseProduct={vi.fn()}
        onStartTour={vi.fn()}
        onTryFreePreview={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /browse tours & pricing/i }))

    expect(screen.getByRole('heading', { name: /choose your walk/i })).toBeInTheDocument()
    expect(screen.getByText(/complete rome/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
  })

  it('opens tour detail from catalog', () => {
    render(
      <TourLanding
        ownedTourIds={[]}
        ownsAllTours={false}
        onPurchaseProduct={vi.fn()}
        onStartTour={vi.fn()}
        onTryFreePreview={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /browse tours & pricing/i }))
    fireEvent.click(screen.getByRole('heading', { name: /complete rome/i }))

    expect(screen.getByRole('button', { name: /purchase \$15/i })).toBeInTheDocument()
    expect(screen.getByText(/included landmarks/i)).toBeInTheDocument()
  })

  it('shows owned home for returning purchasers', () => {
    render(
      <TourLanding
        ownedTourIds={['heart-of-ancient-rome']}
        ownsAllTours={false}
        onPurchaseProduct={vi.fn()}
        onStartTour={vi.fn()}
        onTryFreePreview={vi.fn()}
      />
    )

    expect(screen.getByRole('heading', { name: /your rome walking tours/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue with heart of ancient rome/i })).toBeInTheDocument()
  })

  it('walks through permissions before starting a owned tour', () => {
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

    fireEvent.click(screen.getByRole('button', { name: /continue with heart of ancient rome/i }))
    fireEvent.click(screen.getByRole('button', { name: /start tour/i }))
    expect(screen.getByRole('heading', { name: /enable location for gps guidance/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /continue without enabling/i }))
    expect(onStartTour).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'heart-of-ancient-rome' })
    )
  })

  it('navigates to free preview screen before launching', () => {
    const onTryFreePreview = vi.fn()
    render(
      <TourLanding
        ownedTourIds={[]}
        ownsAllTours={false}
        onPurchaseProduct={vi.fn()}
        onStartTour={vi.fn()}
        onTryFreePreview={onTryFreePreview}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /^try for free$/i }))
    expect(screen.getByRole('heading', { name: /walk the colosseum for free/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /start free preview/i }))
    fireEvent.click(screen.getByRole('button', { name: /continue without enabling/i }))
    expect(onTryFreePreview).toHaveBeenCalledTimes(1)
  })
})
