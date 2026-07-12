import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import WalkingCompanionScreen from '../WalkingCompanionScreen.jsx'

vi.mock('../../../hooks/useWalkingDirections.js', () => ({
  useWalkingDirections: () => ({
    directions: {
      distanceM: 320,
      steps: [
        { instruction: 'Head north on Via dei Fori Imperiali', distanceM: 180, type: 'depart' },
        { instruction: 'Turn right toward the Colosseum', distanceM: 140, type: 'turn' },
      ],
      geometry: [
        [12.4922, 41.8902],
        [12.493, 41.891],
      ],
    },
    loading: false,
    error: null,
  }),
}))

describe('WalkingCompanionScreen', () => {
  function MockMap(props) {
    return <div data-testid="walking-map" data-directions={Boolean(props.directionsGeometry)}>Map</div>
  }

  it('toggles between map and step-by-step directions', () => {
    render(
      <WalkingCompanionScreen
        title="Colosseum interior"
        distanceM={120}
        userPosition={{ lat: 41.889, lng: 12.491 }}
        destination={{ lat: 41.8902, lng: 12.4922 }}
        map={<MockMap />}
      />
    )

    expect(screen.getByTestId('walking-map')).toBeInTheDocument()
    expect(screen.queryByTestId('walking-directions-steps')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Steps' }))

    expect(screen.queryByTestId('walking-map')).not.toBeInTheDocument()
    expect(screen.getByTestId('walking-directions-steps')).toBeInTheDocument()
    expect(screen.getByText('Step 1 of 2')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Map' }))

    expect(screen.getByTestId('walking-map')).toBeInTheDocument()
    expect(screen.queryByTestId('walking-directions-steps')).not.toBeInTheDocument()
  })

  it('hides the route toggle after arrival', () => {
    render(
      <WalkingCompanionScreen
        title="Colosseum interior"
        arrived
        map={<div data-testid="walking-map">Map</div>}
      />
    )

    expect(screen.queryByRole('tab', { name: 'Steps' })).not.toBeInTheDocument()
    expect(screen.getByText('You have arrived')).toBeInTheDocument()
  })
})
