import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import BeginFlow from '../BeginFlow'
import manifest from '../../../../public/tours/rome/manifest.json'

const beginMock = vi.fn()
const trackMock = vi.fn()

vi.mock('../../../hooks/useJourney', () => ({
  useJourney: () => ({
    begin: beginMock,
  }),
  useTourManifest: () => ({
    manifest,
    loading: false,
    error: null,
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

  it('lets the traveler pick a day and reach the location prompt', () => {
    renderBeginFlow()

    fireEvent.click(screen.getByRole('button', { name: /day 2/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    expect(screen.getByRole('heading', { name: /enable location/i })).toBeInTheDocument()
    expect(screen.getByText(/day 2 · the living city/i)).toBeInTheDocument()
  })

  it('starts the journey after location permission', async () => {
    renderBeginFlow()

    fireEvent.click(screen.getByRole('button', { name: /day 1/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    fireEvent.click(screen.getByRole('button', { name: /enable location & start/i }))

    await waitFor(() => {
      expect(screen.getByText('Journey route')).toBeInTheDocument()
    })

    expect(beginMock).toHaveBeenCalledWith({ dayNumber: 1, waypointIndex: 0 })
    expect(trackMock).toHaveBeenCalledWith('journey_begin', {
      day_number: 1,
      waypoint_index: 0,
    })
  })
})
