import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { JOURNEY_STATE } from '../../../hooks/useGeoLocation'
import { OfflineRouteMap } from '../OfflineRouteMap'

const stops = [
  {
    id: 'colosseum',
    title: 'Colosseum',
    status: 'current',
    landmark: { lat: 41.8902, lng: 12.4922 },
  },
  {
    id: 'roman-forum',
    title: 'Roman Forum',
    status: 'upcoming',
    landmark: { lat: 41.8925, lng: 12.4853 },
  },
]

describe('OfflineRouteMap', () => {
  it('shows route overview, waypoints, and walking guidance', () => {
    render(
      <OfflineRouteMap
        tour={{ id: 'rome-core', stopIds: ['colosseum', 'roman-forum'] }}
        stops={stops}
        activeTargetId="colosseum"
        userPos={{ lat: 41.8898, lng: 12.4915 }}
        state={JOURNEY_STATE.TRANSIT}
        distance={180}
      />
    )

    expect(screen.getByRole('heading', { name: /walking overview/i })).toBeInTheDocument()
    expect(screen.getByText(/current waypoint/i)).toBeInTheDocument()
    expect(screen.getAllByText('Colosseum').length).toBeGreaterThan(0)
    expect(screen.getByText('Next waypoint', { selector: 'p' })).toBeInTheDocument()
    expect(screen.getAllByText('Roman Forum').length).toBeGreaterThan(0)
    expect(screen.getByText(/walking guidance/i)).toBeInTheDocument()
    expect(screen.getByText(/distance to next waypoint:/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/simplified tour route overview/i)).toBeInTheDocument()
  })
})
