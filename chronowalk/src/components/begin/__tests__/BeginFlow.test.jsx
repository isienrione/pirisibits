import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import BeginFlow from '../BeginFlow'
import { JOURNEY_PACE } from '../../../data/romePacing'
import { clearTourEntitlements, purchaseTourProduct } from '../../../services/tourEntitlements'

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
    clearTourEntitlements()
    purchaseTourProduct('rome-complete')
  })

  it('shows post-purchase review copy without pricing', () => {
    renderBeginFlow()

    expect(screen.getByRole('heading', { name: /review & begin/i })).toBeInTheDocument()
    expect(screen.getAllByText(/roma eterna/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/at your own pace/i)).toBeInTheDocument()
    expect(screen.queryByText(/€\d|\$\d/)).not.toBeInTheDocument()
    expect(screen.getByText(/confirm your layout next/i)).toBeInTheDocument()
  })

  it('lets the traveler pick a start mode and reach the location prompt', () => {
    renderBeginFlow()

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    expect(screen.getByRole('heading', { name: /enable location/i })).toBeInTheDocument()
    expect(screen.getAllByText('Roma Eterna').length).toBeGreaterThan(0)
  })

  it('starts the purchased full route after location permission', async () => {
    renderBeginFlow()

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    fireEvent.click(screen.getByRole('button', { name: /enable location & start/i }))

    await waitFor(() => {
      expect(screen.getByText('Journey route')).toBeInTheDocument()
    })

    expect(beginMock).toHaveBeenCalledWith({ pace: JOURNEY_PACE.HEROIC, waypointIndex: 0 })
    expect(trackMock).toHaveBeenCalledWith('journey_begin', {
      pace: JOURNEY_PACE.HEROIC,
      waypoint_index: 0,
      product_id: 'rome-complete',
      start_mode: 'full',
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
