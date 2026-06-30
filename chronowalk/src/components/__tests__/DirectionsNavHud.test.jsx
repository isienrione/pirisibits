import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import DirectionsNavHud from '../DirectionsNavHud'
import { LOCATION_STATUS } from '../../hooks/useGeoLocation'

const directions = {
  distanceM: 320,
  steps: [
    { instruction: 'Head north on Via dei Fori Imperiali', distanceM: 180, type: 'depart' },
    { instruction: 'Turn right toward the Colosseum', distanceM: 140, type: 'turn' },
  ],
  geometry: {
    type: 'LineString',
    coordinates: [
      [12.49, 41.89],
      [12.491, 41.891],
    ],
  },
}

describe('DirectionsNavHud', () => {
  it('renders map-first walking guidance with step counter and GPS pill', () => {
    render(
      <DirectionsNavHud
        destinationTitle="Colosseum"
        directions={directions}
        loading={false}
        error={null}
        currentStepIndex={0}
        routeProgress={0.2}
        locationStatus={LOCATION_STATUS.GRANTED}
        routingOrigin={{ lat: 41.88, lng: 12.48 }}
        routingDestination={{ lat: 41.89, lng: 12.49 }}
        onClose={vi.fn()}
        hasBottomNav
      />
    )

    expect(screen.getByText('Step 1 of 2')).toBeInTheDocument()
    expect(screen.getByText('Good GPS signal')).toBeInTheDocument()
    expect(screen.getByText('Walk to')).toBeInTheDocument()
    expect(screen.getAllByText('Colosseum').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('320 m')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: /walking route progress/i })).toBeInTheDocument()
  })

  it('opens the secondary step list sheet from the bottom card', () => {
    render(
      <DirectionsNavHud
        destinationTitle="Colosseum"
        directions={directions}
        loading={false}
        error={null}
        currentStepIndex={1}
        routeProgress={0.6}
        locationStatus={LOCATION_STATUS.GRANTED}
        onClose={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /view steps/i }))

    expect(screen.getByText('Turn-by-turn')).toBeInTheDocument()
    expect(screen.getByText('Head north on Via dei Fori Imperiali')).toBeInTheDocument()
    expect(screen.getByText('Turn right toward the Colosseum')).toBeInTheDocument()
  })
})
