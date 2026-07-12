import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import WalkingDirectionsGuide from '../WalkingDirectionsGuide'

const directions = {
  distanceM: 320,
  steps: [
    { instruction: 'Head north on Via dei Fori Imperiali', distanceM: 180, type: 'depart' },
    { instruction: 'Turn right toward the Colosseum', distanceM: 140, type: 'turn' },
  ],
}

describe('WalkingDirectionsGuide', () => {
  it('renders calm turn-by-turn guidance with large readable typography', () => {
    render(
      <WalkingDirectionsGuide
        destinationTitle="Palatine Hill"
        directions={directions}
        loading={false}
        error={null}
        currentStepIndex={0}
        onDismiss={vi.fn()}
      />
    )

    expect(screen.getByText('Walking directions')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: /palatine hill/i })).toBeInTheDocument()
    expect(screen.getByText('Head north on Via dei Fori Imperiali')).toBeInTheDocument()
    expect(screen.getByText('180 m')).toBeInTheDocument()
    expect(screen.getByText('Then')).toBeInTheDocument()
    expect(screen.getByText('Turn right toward the Colosseum')).toBeInTheDocument()
    expect(screen.getByText('Step 1 of 2')).toBeInTheDocument()
  })

  it('is easy to dismiss from close control and back link', () => {
    const onDismiss = vi.fn()

    render(
      <WalkingDirectionsGuide
        destinationTitle="Palatine Hill"
        directions={directions}
        loading={false}
        error={null}
        currentStepIndex={0}
        onDismiss={onDismiss}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /close walking directions/i }))
    expect(onDismiss).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: /back to map/i }))
    expect(onDismiss).toHaveBeenCalledTimes(2)
  })

  it('shows a calm loading state', () => {
    render(
      <WalkingDirectionsGuide
        destinationTitle="Palatine Hill"
        directions={null}
        loading
        error={null}
        onDismiss={vi.fn()}
      />
    )

    expect(screen.getByText(/finding your route/i)).toBeInTheDocument()
  })
})
