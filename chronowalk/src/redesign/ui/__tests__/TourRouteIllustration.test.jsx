import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import TourRouteIllustration from '../TourRouteIllustration.jsx'
import { loadRomeManifest } from '../../../content/manifest.js'

describe('TourRouteIllustration', () => {
  it('renders an illustrated route with numbered stops', () => {
    const manifest = loadRomeManifest()
    render(<TourRouteIllustration manifest={manifest} context={{ path: 'a' }} />)

    expect(screen.getByTestId('tour-route-illustration')).toBeInTheDocument()
    expect(screen.getByLabelText(/tour route with \d+ stops/i)).toBeInTheDocument()
  })
})
