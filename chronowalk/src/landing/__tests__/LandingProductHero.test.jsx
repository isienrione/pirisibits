import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import LandingProductHero from '../v4/LandingProductHero.jsx'

vi.mock('../landingAnalytics.js', () => ({
  LANDING_ANALYTICS_SECTIONS: { HERO: 'hero' },
}))

describe('LandingProductHero story slide enlarge', () => {
  it('opens a zoomable viewer when a story slide is enlarged', () => {
    render(<LandingProductHero onPreview={() => {}} onChooseTour={() => {}} />)

    fireEvent.click(screen.getByRole('tab', { name: /ChronoWalk Rome/i }))
    fireEvent.click(screen.getByRole('button', { name: /Enlarge ChronoWalk Rome/i }))

    const dialog = screen.getByRole('dialog', { name: /ChronoWalk Rome/i })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveTextContent(/Pinch or double-tap to zoom/i)
    expect(within(dialog).getByRole('button', { name: 'Zoom in' })).toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole('button', { name: 'Close viewer' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('keeps package hotspots while offering enlarge on the packages slide', () => {
    render(<LandingProductHero onPreview={() => {}} onChooseTour={() => {}} />)

    fireEvent.click(screen.getByRole('tab', { name: /Choose your Roman walk/i }))
    expect(screen.getByRole('link', { name: 'Roma Eterna package' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Enlarge Choose your Roman walk/i }))
    expect(screen.getByRole('dialog', { name: /Choose your Roman walk/i })).toBeInTheDocument()
  })
})

describe('LandingProductHero CTA hierarchy', () => {
  it('shows the unpaid complete-stop CTA with Pantheon helper copy', () => {
    const onPreview = vi.fn()
    render(<LandingProductHero onPreview={onPreview} onChooseTour={() => {}} onGetApp={() => {}} />)

    const freeCta = screen.getByRole('button', {
      name: 'Experience a complete Pantheon stop for free',
    })
    expect(freeCta).toHaveTextContent('Experience a complete stop')
    expect(screen.getByText('The Pantheon · 4 minutes · Free · No signup')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Unlock all 21 stops' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'How does ChronoWalk work?' })).toBeInTheDocument()
    expect(screen.getByText('Explore what ChronoWalk includes')).toBeInTheDocument()

    fireEvent.click(freeCta)
    expect(onPreview).toHaveBeenCalledWith('hero')
  })

  it('preserves Continue your walk without Pantheon helper copy', () => {
    const onContinueWalk = vi.fn()
    render(
      <LandingProductHero
        onPreview={() => {}}
        onChooseTour={() => {}}
        onGetApp={() => {}}
        onContinueWalk={onContinueWalk}
      />,
    )

    expect(screen.getByRole('button', { name: 'Continue your walk' })).toBeInTheDocument()
    expect(screen.queryByText('The Pantheon · 4 minutes · Free · No signup')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /complete Pantheon stop/i })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Continue your walk' }))
    expect(onContinueWalk).toHaveBeenCalledTimes(1)
  })
})
