import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TourCompleteView from '../TourCompleteView'

const tour = {
  id: 'rome-core',
  title: 'Heart of Ancient Rome',
  stopIds: ['colosseum', 'pantheon'],
}

describe('TourCompleteView', () => {
  it('renders completion stats and actions', () => {
    const onViewSummary = vi.fn()
    render(
      <TourCompleteView
        tour={tour}
        visitedCount={2}
        walkedMeters={1200}
        startedAtMs={Date.now() - 45 * 60 * 1000}
        onViewSummary={onViewSummary}
        onDismiss={vi.fn()}
      />
    )

    expect(screen.getByText(/journey complete/i)).toBeInTheDocument()
    expect(screen.getByText('2/2')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /view summary/i }))
    expect(onViewSummary).toHaveBeenCalledTimes(1)
  })
})
