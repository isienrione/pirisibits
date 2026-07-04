import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import JourneyCompleteMoment from '../JourneyCompleteMoment'

describe('JourneyCompleteMoment', () => {
  it('renders a restrained immersion completion moment', () => {
    render(
      <JourneyCompleteMoment
        headline="You walked Ancient Rome."
        subline="The city you crossed is still beneath your feet."
        heroImage="/ancient.jpg"
        onViewSummary={vi.fn()}
      />
    )

    expect(screen.getByTestId('journey-complete-moment')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 1, name: /you walked ancient rome/i })
    ).toBeInTheDocument()
    expect(screen.getByText(/beneath your feet/i)).toBeInTheDocument()
    expect(screen.queryByText(/badge|trophy|confetti/i)).not.toBeInTheDocument()
  })

  it('opens the summary on primary action', () => {
    const onViewSummary = vi.fn()

    render(
      <JourneyCompleteMoment
        headline="You walked Ancient Rome."
        subline="The city you crossed is still beneath your feet."
        heroImage="/ancient.jpg"
        onViewSummary={onViewSummary}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /view summary/i }))
    expect(onViewSummary).toHaveBeenCalledTimes(1)
  })
})
