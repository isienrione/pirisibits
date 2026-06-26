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
  currentStopId: 'colosseum',
  progress: {
    targetStopIndex: 0,
    arrivedStopIds: ['colosseum'],
    transitLegActive: false,
  },
  targetStopId: 'colosseum',
  nextWaypoint: { id: 'pantheon', title: 'Pantheon' },
  transitLegActive: false,
  state: JOURNEY_STATE.ARRIVAL,
  distance: 12,
  onContinueTour: vi.fn(),
}

describe('TourHud', () => {
  it('renders the premium top navigation bar', () => {
    render(<TourHud {...baseProps} waypointExploreActive={false} />)

    expect(screen.getByText('Heart of Ancient Rome')).toBeInTheDocument()
    expect(screen.getAllByText('Colosseum').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('hides continue button while the waypoint card is open', () => {
    render(<TourHud {...baseProps} waypointExploreActive />)

    expect(screen.queryByRole('button', { name: /walk to pantheon/i })).toBeNull()
  })

  it('shows continue button after the waypoint card is dismissed', () => {
    render(<TourHud {...baseProps} waypointExploreActive={false} />)

    expect(screen.getByRole('button', { name: /walk to pantheon/i })).toBeInTheDocument()
  })

  it('shows transit guidance while en route', () => {
    render(
      <TourHud
        {...baseProps}
        currentStopId="pantheon"
        progress={{ targetStopIndex: 1, arrivedStopIds: ['colosseum'], transitLegActive: true }}
        targetStopId="pantheon"
        transitLegActive
        state={JOURNEY_STATE.TRANSIT}
        distance={240}
        waypointExploreActive={false}
      />
    )

    expect(screen.getByText(/transit narration is playing/i)).toBeInTheDocument()
    expect(screen.getByText('240 m')).toBeInTheDocument()
  })
})
