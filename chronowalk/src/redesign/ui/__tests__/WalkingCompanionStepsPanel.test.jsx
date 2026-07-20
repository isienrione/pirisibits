import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import WalkingCompanionStepsPanel from '../WalkingCompanionStepsPanel.jsx'

const steps = [
  { instruction: 'Head north on Via dei Fori Imperiali', distanceM: 180, type: 'depart' },
  { instruction: 'Turn right toward the Colosseum', distanceM: 140, type: 'turn' },
]

describe('WalkingCompanionStepsPanel', () => {
  it('shows loading state', () => {
    render(
      <WalkingCompanionStepsPanel
        loading
        destinationTitle="Colosseum interior"
      />
    )

    expect(screen.getByText(/finding your route/i)).toBeInTheDocument()
  })

  it('shows turn-by-turn steps with current and next guidance', () => {
    render(
      <WalkingCompanionStepsPanel
        steps={steps}
        currentStepIndex={0}
        destinationTitle="Colosseum interior"
      />
    )

    expect(screen.getByText('Step 1 of 2')).toBeInTheDocument()
    expect(screen.getAllByText('Head north on Via dei Fori Imperiali').length).toBeGreaterThan(0)
    expect(screen.getAllByText('180 m').length).toBeGreaterThan(0)
    expect(screen.getByText('Then')).toBeInTheDocument()
    expect(screen.getAllByText('Turn right toward the Colosseum').length).toBeGreaterThan(0)
    expect(screen.getByRole('list', { name: /steps to colosseum interior/i })).toBeInTheDocument()
  })

  it('renders a compact Next turns timeline under the map', () => {
    render(
      <WalkingCompanionStepsPanel
        steps={steps}
        currentStepIndex={0}
        destinationTitle="Arch of Titus"
        variant="timeline"
        maxVisible={4}
      />
    )

    expect(screen.getByText('Next turns')).toBeInTheDocument()
    expect(screen.getByRole('list', { name: /next turns to arch of titus/i })).toBeInTheDocument()
    expect(screen.getByText('Head north on Via dei Fori Imperiali')).toBeInTheDocument()
  })
})
