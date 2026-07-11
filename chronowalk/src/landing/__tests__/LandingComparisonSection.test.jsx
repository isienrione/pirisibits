import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import LandingComparisonSection from '../LandingComparisonSection.jsx'

describe('LandingComparisonSection', () => {
  it('renders feature cards for mobile-friendly comparison', () => {
    render(<LandingComparisonSection />)

    const cards = document.querySelector('.cw-v2-compare__cards')
    expect(cards).toBeTruthy()
    expect(screen.getByRole('heading', { name: /while you walk/i })).toBeInTheDocument()
    expect(cards).toHaveTextContent(/eyes on rome — stories trigger when you arrive/i)
    expect(cards).toHaveTextContent(/other audio tour apps/i)
    expect(cards).toHaveTextContent(/often screen-first — map, quizzes, or checklists in the sun/i)
  })

  it('keeps the desktop comparison table in the document for wide screens', () => {
    render(<LandingComparisonSection />)

    expect(screen.getByRole('table', { name: /freedom to wander/i })).toBeInTheDocument()
    expect(screen.getAllByText(/museum audioguides/i).length).toBeGreaterThan(0)
  })
})
