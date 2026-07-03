import { describe, expect, it, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import MapScreen from '../MapScreen.jsx'
import { beginJourney, resetJourney } from '../../../state/journey.js'

vi.mock('../../TourMap.jsx', () => ({
  default: () => <div data-testid="tour-map">Map</div>,
}))

vi.mock('../../DirectionsNavHud.jsx', () => ({
  default: () => null,
}))

vi.mock('../../../hooks/useJourneyGeo.js', () => ({
  useJourneyGeo: () => ({
    position: { lat: 41.89, lng: 12.49 },
    distance: 520,
    insideGeofence: false,
    approachingGeofence: false,
    state: 'TRANSIT',
    locationStatus: 'granted',
    retryLocation: vi.fn(),
  }),
}))

function renderMap() {
  return render(
    <MemoryRouter>
      <MapScreen />
    </MemoryRouter>
  )
}

describe('MapScreen', () => {
  beforeEach(() => {
    localStorage.clear()
    resetJourney()
  })

  it('renders the map when a journey is active', async () => {
    beginJourney({ pace: 'classic' })
    renderMap()

    expect(await screen.findByTestId('tour-map')).toBeInTheDocument()
    expect(screen.getByText('Back to walk')).toBeInTheDocument()
    expect(screen.getByText('Position live')).toBeInTheDocument()
    expect(screen.getByText('Off route')).toBeInTheDocument()
  })
})
