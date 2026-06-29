import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TourIntroContent } from '../TourIntroContent'

describe('TourIntroContent', () => {
  it('introduces the self-guided audio tour experience', () => {
    render(<TourIntroContent onTryFreePreview={vi.fn()} onViewTours={vi.fn()} />)

    expect(
      screen.getByRole('heading', {
        name: /detailed, entertaining self-guided audio tour of rome/i,
      })
    ).toBeInTheDocument()
    expect(screen.getByText(/^Your pace$/i)).toBeInTheDocument()
    expect(screen.getByText(/^Expert companion$/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /two routes, 20 landmarks/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /forum cluster · 8 stops/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /city loop · 12 stops/i })).toBeInTheDocument()
    expect(screen.getByText('Basilica of Maxentius')).toBeInTheDocument()
    expect(screen.getByText('Curia Julia')).toBeInTheDocument()
    expect(screen.getByText('Capitoline Hill')).toBeInTheDocument()
  })

  it('starts the free preview and opens the catalog', () => {
    const onTryFreePreview = vi.fn()
    const onViewTours = vi.fn()

    render(<TourIntroContent onTryFreePreview={onTryFreePreview} onViewTours={onViewTours} />)

    fireEvent.click(screen.getByRole('button', { name: /try for free/i }))
    expect(onTryFreePreview).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: /see tours & pricing/i }))
    expect(onViewTours).toHaveBeenCalledTimes(1)
  })
})
