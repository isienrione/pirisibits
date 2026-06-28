import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TourIntroScreen from '../TourIntroScreen'

describe('TourIntroScreen', () => {
  it('introduces the self-guided audio tour experience', () => {
    render(<TourIntroScreen onTryFreePreview={vi.fn()} onViewTours={vi.fn()} />)

    expect(
      screen.getByRole('heading', {
        name: /detailed, entertaining self-guided audio tour of rome/i,
      })
    ).toBeInTheDocument()
    expect(screen.getByText(/^Your pace$/i)).toBeInTheDocument()
    expect(screen.getByText(/^Expert companion$/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /two routes, twenty landmarks/i })).toBeInTheDocument()
  })

  it('starts the free preview and opens the catalog', () => {
    const onTryFreePreview = vi.fn()
    const onViewTours = vi.fn()

    render(<TourIntroScreen onTryFreePreview={onTryFreePreview} onViewTours={onViewTours} />)

    fireEvent.click(screen.getByRole('button', { name: /try a bit for free/i }))
    expect(onTryFreePreview).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: /see tours & pricing/i }))
    expect(onViewTours).toHaveBeenCalledTimes(1)
  })
})
