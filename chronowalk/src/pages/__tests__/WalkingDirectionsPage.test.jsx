import { describe, expect, it, beforeEach, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import WalkingDirectionsPage from '../WalkingDirectionsPage'
import {
  JOURNEY_STATES,
  defaultJourneySnapshot,
  hydrateJourney,
} from '../../state/journeyState'
import { loadRomeTourManifest } from '../../content/romeTourManifest'
import { ROUTES } from '../../routes/paths'

const mockDirections = {
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

vi.mock('../../hooks/useGeoLocation', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useGeoLocation: () => ({
      position: { lat: 41.88, lng: 12.48 },
      state: actual.JOURNEY_STATE.TRANSIT,
      distance: 420,
      locationStatus: actual.LOCATION_STATUS.GRANTED,
    }),
  }
})

vi.mock('../../hooks/useWalkingDirections', () => ({
  useWalkingDirections: () => ({
    directions: mockDirections,
    loading: false,
    error: null,
    routingOrigin: { lat: 41.88, lng: 12.48 },
    routingDestination: { lat: 41.89, lng: 12.49 },
  }),
}))

function renderWalkingDirections(initialEntry = ROUTES.walkingDirections) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path={ROUTES.walkingDirections} element={<WalkingDirectionsPage />} />
        <Route path={ROUTES.journey} element={<div>Journey map</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('WalkingDirectionsPage', () => {
  const manifest = loadRomeTourManifest()
  const colosseum = manifest.stopsById.colosseum

  beforeEach(() => {
    hydrateJourney({
      state: JOURNEY_STATES.WALKING,
      context: {
        ...defaultJourneySnapshot().context,
        currentStopId: colosseum.id,
        currentStopIndex: colosseum.number - 1,
      },
    })
  })

  it('renders request-only walking directions when walking', () => {
    renderWalkingDirections()

    expect(screen.getByText('Walking directions')).toBeInTheDocument()
    expect(screen.getByText('Head north on Via dei Fori Imperiali')).toBeInTheDocument()
  })

  it('returns to journey map when dismissed', () => {
    renderWalkingDirections()

    fireEvent.click(screen.getByRole('button', { name: /back to map/i }))

    expect(screen.getByText('Journey map')).toBeInTheDocument()
  })

  it('redirects to journey map when not in walking flow', () => {
    hydrateJourney({
      state: JOURNEY_STATES.ARRIVED,
      context: {
        ...defaultJourneySnapshot().context,
        currentStopId: colosseum.id,
        currentStopIndex: colosseum.number - 1,
      },
    })

    renderWalkingDirections()

    expect(screen.getByText('Journey map')).toBeInTheDocument()
  })
})
