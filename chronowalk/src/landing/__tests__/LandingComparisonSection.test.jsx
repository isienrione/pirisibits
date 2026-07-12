import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import LandingComparisonSection from '../LandingComparisonSection.jsx'

describe('LandingComparisonSection', () => {
  it('renders labeled comparison rows for mobile-friendly reading', () => {
    render(<LandingComparisonSection />)

    const table = screen.getByRole('table', { name: /freedom to wander/i })
    const whileYouWalk = within(table).getByRole('rowheader', { name: /while you walk/i })
    const row = whileYouWalk.closest('[role="row"]')
    expect(row).toBeTruthy()

    expect(within(row).getByText(/^ChronoWalk$/)).toBeInTheDocument()
    expect(within(row).getByText(/other audio tour apps/i)).toBeInTheDocument()
    expect(within(row).getByText(/eyes on rome — stories trigger when you arrive/i)).toBeInTheDocument()
    expect(
      within(row).getByText(/often screen-first — map, quizzes, or checklists in the sun/i),
    ).toBeInTheDocument()
  })

  it('keeps column headers for the desktop table layout', () => {
    render(<LandingComparisonSection />)

    expect(screen.getByRole('columnheader', { name: /ChronoWalk/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /museum audioguides/i })).toBeInTheDocument()
  })
})
