import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import BeginFlow from '../BeginFlow'
import { JOURNEY_PACE } from '../../../data/romePacing'

const beginMock = vi.fn()
const trackMock = vi.fn()

vi.mock('../../../hooks/useJourney', () => ({
  useJourney: () => ({
    begin: beginMock,
  }),
}))

vi.mock('../../../lib/locationAccess', () => ({
  requestLocationAccess: vi.fn().mockResolvedValue('granted'),
}))

vi.mock('../../../lib/track', () => ({
  track: (...args) => trackMock(...args),
  TRACK_EVENTS: {
    JOURNEY_BEGIN: 'journey_begin',
  },
}))

function renderBeginFlow() {
  return render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<BeginFlow />} />
        <Route path="/journey" element={<div>Journey route</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('BeginFlow', () => {
  beforeEach(() => {
    beginMock.mockClear()
    trackMock.mockClear()
  })

  it('shows the pace selector copy from the acts model', () => {
    renderBeginFlow()

    expect(screen.getByRole('heading', { name: /rome is yours/i })).toBeInTheDocument()
    expect(screen.getByText('The Classic Split')).toBeInTheDocument()
    expect(screen.getByText('The Heroic Day')).toBeInTheDocument()
    expect(screen.getByText(/nothing is skipped forever/i)).toBeInTheDocument()
  })

  it('lets the traveler pick a pace and reach the location prompt', () => {
    renderBeginFlow()

    fireEvent.click(screen.getByRole('button', { name: /the heroic day/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    expect(screen.getByRole('heading', { name: /enable location/i })).toBeInTheDocument()
    expect(screen.getByText('The Heroic Day')).toBeInTheDocument()
  })

  it('starts the journey at the Colosseum after location permission', async () => {
    renderBeginFlow()

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    fireEvent.click(screen.getByRole('button', { name: /enable location & start/i }))

    await waitFor(() => {
      expect(screen.getByText('Journey route')).toBeInTheDocument()
    })

    expect(beginMock).toHaveBeenCalledWith({ pace: JOURNEY_PACE.CLASSIC, waypointIndex: 0 })
    expect(trackMock).toHaveBeenCalledWith('journey_begin', {
      pace: JOURNEY_PACE.CLASSIC,
      waypoint_index: 0,
    })
  })
})
