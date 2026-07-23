import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import WalkingCompanionScreen from '../WalkingCompanionScreen.jsx'

vi.mock('../../../hooks/useWalkingDirections.js', () => ({
  useWalkingDirections: () => ({
    directions: {
      distanceM: 335,
      durationSec: 240,
      steps: [
        { instruction: 'Head north on Via dei Fori Imperiali', distanceM: 180, type: 'depart' },
        { instruction: 'Turn right toward the Colosseum', distanceM: 140, type: 'turn' },
      ],
      geometry: {
        type: 'LineString',
        coordinates: [
          [12.4922, 41.8902],
          [12.493, 41.891],
        ],
      },
    },
    loading: false,
    error: null,
    retry: vi.fn(),
  }),
}))

describe('WalkingCompanionScreen', () => {
  function MockMap(props) {
    return <div data-testid="walking-map" data-directions={Boolean(props.directionsGeometry)}>Map</div>
  }

  it('shows map with next turns and wires directions onto the map', () => {
    render(
      <WalkingCompanionScreen
        title="Arch of Titus"
        distanceM={335}
        userPosition={{ lat: 41.889, lng: 12.491 }}
        destination={{ lat: 41.8902, lng: 12.4922 }}
        map={<MockMap />}
        onBeginChapter={vi.fn()}
      />
    )

    expect(screen.getByTestId('walking-map')).toBeInTheDocument()
    expect(screen.getByTestId('walking-map')).toHaveAttribute('data-directions', 'true')
    expect(screen.getByTestId('next-turns-card')).toBeInTheDocument()
    expect(screen.getByText('Next turns')).toBeInTheDocument()
    expect(screen.getByTestId('walking-distance-meta')).toHaveTextContent('335 m · 4 min')
    expect(screen.getByRole('button', { name: /open the arch of titus story/i })).toBeInTheDocument()
  })

  it('toggles to the full steps list', () => {
    render(
      <WalkingCompanionScreen
        title="Colosseum interior"
        distanceM={120}
        userPosition={{ lat: 41.889, lng: 12.491 }}
        destination={{ lat: 41.8902, lng: 12.4922 }}
        map={<MockMap />}
      />
    )

    fireEvent.click(screen.getByRole('tab', { name: 'Steps' }))

    expect(screen.queryByTestId('walking-map')).not.toBeInTheDocument()
    expect(screen.getByText('Step 1 of 2')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Map' }))

    expect(screen.getByTestId('walking-map')).toBeInTheDocument()
    expect(screen.getByText('Next turns')).toBeInTheDocument()
  })

  it('shows an accessible Settings control when onOpenSettings is provided', () => {
    const onOpenSettings = vi.fn()
    render(
      <WalkingCompanionScreen
        title="Arch of Titus"
        distanceM={200}
        userPosition={{ lat: 41.889, lng: 12.491 }}
        destination={{ lat: 41.8902, lng: 12.4922 }}
        map={<MockMap />}
        onOpenSettings={onOpenSettings}
      />,
    )

    const settingsBtn = screen.getByRole('button', { name: 'Open settings' })
    expect(settingsBtn).toHaveAttribute('data-testid', 'walking-open-settings')
    fireEvent.click(settingsBtn)
    expect(onOpenSettings).toHaveBeenCalledTimes(1)
  })

  it('hides the route toggle after arrival but keeps the story CTA', () => {
    render(
      <WalkingCompanionScreen
        title="Colosseum interior"
        arrived
        map={<div data-testid="walking-map">Map</div>}        onBeginChapter={vi.fn()}
      />
    )

    expect(screen.queryByRole('tab', { name: 'Steps' })).not.toBeInTheDocument()
    expect(screen.getByText('You have arrived')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /open the colosseum interior story/i })).toBeInTheDocument()
  })
})
