import { describe, expect, it, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import JourneyMapPage from '../JourneyMapPage'
import {
  JOURNEY_STATES,
  defaultJourneySnapshot,
  getJourneySnapshot,
  hydrateJourney,
} from '../../state/journeyState'
import { loadRomeTourManifest } from '../../content/romeTourManifest'
import { LOCATION_STATUS } from '../../hooks/useGeoLocation'
import { ROUTES } from '../../routes/paths'

const navigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigate,
  }
})

vi.mock('../../hooks/useGeoLocation', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useGeoLocation: () => ({
      position: null,
      state: actual.JOURNEY_STATE.TRANSIT,
      distance: 420,
      locationStatus: LOCATION_STATUS.WAITING,
    }),
  }
})

vi.mock('../../hooks/useJourneyGeoSync', () => ({
  useJourneyGeoSync: () => {},
}))

function renderJourneyMap() {
  return render(
    <MemoryRouter initialEntries={[ROUTES.journey]}>
      <Routes>
        <Route path={ROUTES.journey} element={<JourneyMapPage />} />
        <Route path={ROUTES.arrival} element={<div>Arrival ceremony</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('JourneyMapPage', () => {
  const manifest = loadRomeTourManifest()
  const first = manifest.stops[0]

  beforeEach(() => {
    navigate.mockClear()
    hydrateJourney(defaultJourneySnapshot())
  })

  it('renders explorer journey map with persistent bottom card', () => {
    hydrateJourney({
      state: JOURNEY_STATES.WALKING,
      context: {
        ...defaultJourneySnapshot().context,
        currentStopId: first.id,
        currentStopIndex: first.number - 1,
      },
    })

    renderJourneyMap()

    expect(screen.getByText('Rome')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: /journey map/i })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /journey route map/i })).toBeInTheDocument()
    expect(screen.getByTestId('journey-bottom-card')).toBeInTheDocument()
    expect(screen.getByText('Walking')).toBeInTheDocument()
  })

  it('initializes idle journey into walking on mount', () => {
    hydrateJourney(defaultJourneySnapshot())

    renderJourneyMap()

    expect(getJourneySnapshot().state).toBe(JOURNEY_STATES.WALKING)
    expect(getJourneySnapshot().context.currentStopId).toBe(first.id)
    expect(screen.getByTestId('journey-bottom-card')).toBeInTheDocument()
  })

  it('enters immersion arrival when journey reaches arrived state', () => {
    hydrateJourney({
      state: JOURNEY_STATES.ARRIVED,
      context: {
        ...defaultJourneySnapshot().context,
        currentStopId: first.id,
        currentStopIndex: first.number - 1,
      },
    })

    renderJourneyMap()

    expect(navigate).toHaveBeenCalledWith(ROUTES.arrival, { replace: true })
  })
})
