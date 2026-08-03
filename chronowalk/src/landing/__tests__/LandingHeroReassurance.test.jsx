import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import LandingHeroReassurance from '../v4/LandingHeroReassurance.jsx'
import { LANDING_CONTENT } from '../landingData.js'

describe('LandingHeroReassurance', () => {
  it('renders the four factual items as a noninteractive list', () => {
    render(<LandingHeroReassurance />)

    const region = screen.getByRole('region', { name: /Why ChronoWalk is easy to start/i })
    expect(region).toBeInTheDocument()

    for (const item of LANDING_CONTENT.heroReassurance.items) {
      expect(screen.getByText(item.label)).toBeInTheDocument()
      expect(screen.getByText(item.support)).toBeInTheDocument()
    }

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
