import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import JourneyLetter from '../JourneyLetter'

describe('JourneyLetter', () => {
  it('renders a personal letter with refined typography', () => {
    render(
      <JourneyLetter
        salutation="Dear Livia,"
        paragraphs={[
          'You set out on foot through a city that has never stopped remembering itself.',
          'You listened.',
        ]}
        signOff="With gratitude,"
        signature="ChronoWalk"
        onReturnHome={vi.fn()}
      />
    )

    expect(screen.getByTestId('journey-letter')).toBeInTheDocument()
    expect(screen.getByText('Dear Livia,')).toBeInTheDocument()
    expect(screen.getByText(/never stopped remembering/i)).toBeInTheDocument()
    expect(screen.getByText('ChronoWalk')).toBeInTheDocument()
  })

  it('returns home from the primary action', () => {
    const onReturnHome = vi.fn()

    render(
      <JourneyLetter
        salutation="Dear Marco,"
        paragraphs={['You listened.']}
        signOff="With gratitude,"
        signature="ChronoWalk"
        onReturnHome={onReturnHome}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /return home/i }))
    expect(onReturnHome).toHaveBeenCalledTimes(1)
  })

  it('opens the timeline when provided', () => {
    const onViewTimeline = vi.fn()

    render(
      <JourneyLetter
        salutation="Dear Livia,"
        paragraphs={['You listened.']}
        signOff="With gratitude,"
        signature="ChronoWalk"
        onViewTimeline={onViewTimeline}
        onReturnHome={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /your timeline/i }))
    expect(onViewTimeline).toHaveBeenCalledTimes(1)
  })
})
