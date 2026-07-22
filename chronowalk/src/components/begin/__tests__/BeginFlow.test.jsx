import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import BeginFlow from '../BeginFlow'
import { JOURNEY_PACE } from '../../../data/romePacing'

const beginMock = vi.fn()
const resumeMock = vi.fn()
const resetMock = vi.fn()
const trackMock = vi.fn()

vi.mock('../../../hooks/useV2Journey', () => ({
  useV2Journey: () => ({
    begin: beginMock,
    resume: resumeMock,
    reset: resetMock,
    isResumable: false,
  }),
}))

vi.mock('../../../lib/locationAccess', () => ({
  requestLocationAccess: vi.fn().mockResolvedValue('granted'),
}))

vi.mock('../../../lib/track', () => ({
  track: (...args) => trackMock(...args),
  TRACK_EVENTS: {
    JOURNEY_BEGIN: 'journey_begin',
    RESUME: 'resume',
    GPS_FALLBACK_USED: 'gps_fallback_used',
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
    resumeMock.mockClear()
    resetMock.mockClear()
    trackMock.mockClear()
  })

  it('shows the pace selector copy from the acts model', () => {
    renderBeginFlow()

    expect(screen.getByRole('heading', { name: /rome is yours/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /roma eterna/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /roma antica/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /roma centrale/i })).toBeInTheDocument()
    expect(screen.getByText(/nothing is skipped forever/i)).toBeInTheDocument()
  })

  it('lets the traveler pick a pace and reach the location prompt', () => {
    renderBeginFlow()

    fireEvent.click(screen.getByRole('button', { name: /roma eterna/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    expect(screen.getByRole('heading', { name: /enable location/i })).toBeInTheDocument()
    expect(screen.getByText('Roma Eterna')).toBeInTheDocument()
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

  it('shows recovery copy when location permission is denied', async () => {
    const { requestLocationAccess } = await import('../../../lib/locationAccess')
    requestLocationAccess.mockResolvedValueOnce('denied')

    renderBeginFlow()

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    fireEvent.click(screen.getByRole('button', { name: /enable location & start/i }))

    expect(await screen.findByRole('heading', { name: /location access is off/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue without location/i })).toBeInTheDocument()
    expect(trackMock).toHaveBeenCalledWith('gps_fallback_used', {
      source: 'begin_flow',
      result: 'denied',
    })

    fireEvent.click(screen.getByRole('button', { name: /continue without location/i }))

    await waitFor(() => {
      expect(screen.getByText('Journey route')).toBeInTheDocument()
    })
    expect(beginMock).toHaveBeenCalled()
  })
})
