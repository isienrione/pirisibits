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
    expect(screen.getByRole('heading', { name: /forum cluster/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /rome city loop/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /complete rome/i })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /buy \$10/i })).toHaveLength(2)
    expect(screen.getByRole('button', { name: /buy \$15/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /start forum cluster/i })).not.toBeInTheDocument()
  })

  it('starts selected tour when owned', () => {
    const onStartTour = vi.fn()
    render(
      <TourLanding
        ownedTourIds={['rome-forum-cluster']}
        ownsAllTours={false}
        onPurchaseProduct={vi.fn()}
        onStartTour={onStartTour}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /start forum cluster/i }))
    expect(onStartTour).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'rome-forum-cluster', title: 'Forum Cluster' })
    )
  })
})
