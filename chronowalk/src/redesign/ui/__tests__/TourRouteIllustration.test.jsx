import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import TourRouteIllustration from '../TourRouteIllustration.jsx'
import { loadRomeManifest } from '../../../content/manifest.js'
import { JOURNEY_PACE } from '../../../data/romePacing.js'

describe('TourRouteIllustration', () => {
  it('renders an illustrated route with numbered stops', () => {
    const manifest = loadRomeManifest()
    render(<TourRouteIllustration manifest={manifest} context={{ path: 'a', pace: JOURNEY_PACE.CLASSIC }} />)

    expect(screen.getByTestId('tour-route-illustration')).toBeInTheDocument()
    expect(screen.getByLabelText(/tour route with \d+ stops/i)).toBeInTheDocument()
  })

  it('shows more stops for heroic than classic pace', () => {
    const manifest = loadRomeManifest()
    const { rerender } = render(
      <TourRouteIllustration manifest={manifest} context={{ path: 'a', pace: JOURNEY_PACE.CLASSIC }} />,
    )
    const classicLabel = screen.getByLabelText(/tour route with (\d+) stops/i)
    const classicCount = Number(classicLabel.getAttribute('aria-label')?.match(/(\d+)/)?.[1])

    rerender(<TourRouteIllustration manifest={manifest} context={{ path: 'a', pace: JOURNEY_PACE.HEROIC }} />)
    const heroicLabel = screen.getByLabelText(/tour route with (\d+) stops/i)
    const heroicCount = Number(heroicLabel.getAttribute('aria-label')?.match(/(\d+)/)?.[1])

    expect(heroicCount).toBeGreaterThan(classicCount)
  })
})
