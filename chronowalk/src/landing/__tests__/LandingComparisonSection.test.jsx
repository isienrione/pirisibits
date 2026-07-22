import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import LandingComparisonSection from '../LandingComparisonSection.jsx'
import LandingWhyChronoWalkSection from '../LandingWhyChronoWalkSection.jsx'

describe('comparison matrix retirement', () => {
  it('no longer renders the competitor comparison table', () => {
    const { container } = render(<LandingComparisonSection />)
    expect(container).toBeEmptyDOMElement()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('renders Why ChronoWalk as promise-led points without naming rivals', () => {
    render(<LandingWhyChronoWalkSection />)

    expect(
      screen.getByRole('heading', { level: 2, name: /tied to the stones/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /yours to keep/i })).toBeInTheDocument()
    expect(screen.getByText(/stories tied to the place where they happened/i)).toBeInTheDocument()
    expect(
      screen.getByText(/evidence-based reconstructions from the viewpoint in front of you/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/a route that pauses when you do/i)).toBeInTheDocument()
    expect(screen.queryByText(/other audio tour apps/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/free walking tours/i)).not.toBeInTheDocument()
  })
})
