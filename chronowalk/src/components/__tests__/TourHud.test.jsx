import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import TourHud from '../TourHud'
import { JOURNEY_STATE } from '../../hooks/useGeoLocation'

const tour = {
  id: 'rome-core',
  title: 'Heart of Ancient Rome',
  stopIds: ['colosseum', 'pantheon'],
}

const baseProps = {
  tour,
  progress: {
    targetStopIndex: 0,
    arrivedStopIds: ['colosseum'],
    transitLegActive: false,
  },
  targetStopId: 'colosseum',
  nextWaypoint: { id: 'pantheon', title: 'The Pantheon' },
  transitLegActive: false,
  state: JOURNEY_STATE.ARRIVAL,
  onContinueTour: vi.fn(),
}

describe('TourHud', () => {
  it('hides continue button while the waypoint card is open', () => {
    render(<TourHud {...baseProps} waypointExploreActive />)

    expect(screen.queryByRole('button', { name: /walk to the pantheon/i })).toBeNull()
  })

  it('shows continue button after the waypoint card is dismissed', () => {
    render(<TourHud {...baseProps} waypointExploreActive={false} />)

    expect(screen.getByRole('button', { name: /walk to the pantheon/i })).toBeInTheDocument()
  })

  it('shows transit guidance while en route', () => {
    render(
      <TourHud
        {...baseProps}
        progress={{ targetStopIndex: 1, arrivedStopIds: ['colosseum'], transitLegActive: true }}
        transitLegActive
        waypointExploreActive={false}
      />
    )

    expect(screen.getByText(/transit narration is playing/i)).toBeInTheDocument()
  })
})
