import { describe, expect, it, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import MapScreen from '../MapScreen.jsx'
import { beginJourney, resetJourney } from '../../../state/journey.js'
import { JOURNEY_STATES } from '../../../state/journey.js'

vi.mock('../../TourMap.jsx', () => ({
  default: () => <div data-testid="tour-map">Map</div>,
}))

vi.mock('../../DirectionsNavHud.jsx', () => ({
  default: ({ onClose }) => (
    <div data-testid="directions-hud">
      <button type="button" onClick={onClose}>
        Close directions
      </button>
    </div>
  ),
}))

vi.mock('../../../hooks/useJourneyGeo.js', () => ({
  useJourneyGeo: () => ({
    position: { lat: 41.89, lng: 12.49 },
    distance: 520,
    insideGeofence: false,
    approachingGeofence: false,
    state: 'TRANSIT',
    locationStatus: 'granted',
    accuracy: 12,
    retryLocation: vi.fn(),
  }),
}))

vi.mock('../../../hooks/useWalkingCompanion.js', () => ({
  useWalkingCompanion: () => ({ mode: 'normal', stationaryMs: 0 }),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

function renderMap(variant = 'legacy') {
  return render(
    <MemoryRouter>
      <MapScreen variant={variant} />
    </MemoryRouter>
  )
}

describe('MapScreen', () => {
  beforeEach(() => {
    localStorage.clear()
    resetJourney()
    mockNavigate.mockReset()
  })

  it('renders the map when a journey is active', async () => {
    beginJourney({ pace: 'classic' })
    renderMap()

    expect(await screen.findByTestId('tour-map')).toBeInTheDocument()
    expect(screen.getByText('Back to walk')).toBeInTheDocument()
    expect(screen.getByText('Position live')).toBeInTheDocument()
  })

  it('shows tour-start card and opens in-app directions instead of journal', async () => {
    beginJourney({ pace: 'classic' })
    renderMap('redesign')

    expect(await screen.findByText(/Tour begins at/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Get walking directions' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Get walking directions' }))
    expect(await screen.findByTestId('directions-hud')).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalledWith(expect.stringMatching(/^\/journal\//))
  })

  it('transitions to story from arrived card', async () => {
    beginJourney({ pace: 'classic' })
    const { transitionJourney, getJourneySnapshot } = await import('../../../state/journey.js')
    transitionJourney(JOURNEY_STATES.ARRIVED)

    renderMap('redesign')

    expect(await screen.findByText("You've arrived")).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Open story' }))

    expect(getJourneySnapshot().state).toBe(JOURNEY_STATES.STORY)
    expect(mockNavigate).toHaveBeenCalledWith('/journey')
  })
})
