import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
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
  enableLocationForTourBounded: vi.fn().mockResolvedValue({
    permission: 'granted',
    fixStatus: 'available',
    locationEnabled: true,
    position: { lat: 41.89, lng: 12.49 },
    shouldAdvance: true,
    access: 'granted',
  }),
  enableLocationForTour: vi.fn().mockResolvedValue({
    permission: 'granted',
    fixStatus: 'available',
    locationEnabled: true,
    position: { lat: 41.89, lng: 12.49 },
    shouldAdvance: true,
    access: 'granted',
  }),
  requestLocationAccess: vi.fn().mockResolvedValue('granted'),
  LOCATION_PERMISSION: {
    PROMPT: 'prompt',
    GRANTED: 'granted',
    DENIED: 'denied',
    UNAVAILABLE: 'unavailable',
  },
  LOCATION_FIX_STATUS: {
    IDLE: 'idle',
    SEARCHING: 'searching',
    AVAILABLE: 'available',
    UNAVAILABLE: 'unavailable',
  },
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
  beforeEach(async () => {
    beginMock.mockClear()
    resumeMock.mockClear()
    resetMock.mockClear()
    trackMock.mockClear()
    const { enableLocationForTourBounded } = await import('../../../lib/locationAccess')
    enableLocationForTourBounded.mockReset()
    enableLocationForTourBounded.mockResolvedValue({
      permission: 'granted',
      fixStatus: 'available',
      locationEnabled: true,
      position: { lat: 41.89, lng: 12.49 },
      shouldAdvance: true,
      access: 'granted',
    })
  })

  it('shows the pace selector copy from the acts model', () => {
    renderBeginFlow()

    expect(screen.getByRole('heading', { name: /rome is yours/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /roma eterna/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /roma antica/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /roma historica/i })).toBeInTheDocument()
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
    const { enableLocationForTourBounded } = await import('../../../lib/locationAccess')
    enableLocationForTourBounded.mockResolvedValueOnce({
      permission: 'denied',
      fixStatus: 'idle',
      locationEnabled: false,
      position: null,
      shouldAdvance: true,
      access: 'denied',
    })

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

  it('starts the journey when permission is granted even if GPS is still searching', async () => {
    const { enableLocationForTourBounded } = await import('../../../lib/locationAccess')
    let resolveFix
    enableLocationForTourBounded.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFix = () =>
            resolve({
              permission: 'granted',
              fixStatus: 'searching',
              locationEnabled: true,
              position: null,
              shouldAdvance: true,
              access: 'granted',
            })
        }),
    )

    renderBeginFlow()
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    fireEvent.click(screen.getByRole('button', { name: /enable location & start/i }))

    expect(screen.getByRole('button', { name: /requesting access/i })).toBeDisabled()

    await act(async () => {
      resolveFix()
    })

    await waitFor(() => {
      expect(screen.getByText('Journey route')).toBeInTheDocument()
    })
    expect(beginMock).toHaveBeenCalled()
  })

  it('exits Requesting access when permission resolve is slow / unavailable', async () => {
    const { enableLocationForTourBounded } = await import('../../../lib/locationAccess')
    enableLocationForTourBounded.mockResolvedValueOnce({
      permission: 'unavailable',
      fixStatus: 'unavailable',
      locationEnabled: false,
      position: null,
      shouldAdvance: true,
      access: 'unavailable',
      timedOut: true,
    })

    renderBeginFlow()
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    fireEvent.click(screen.getByRole('button', { name: /enable location & start/i }))

    expect(
      await screen.findByRole('heading', {
        name: /location permission is taking longer than expected/i,
      }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /requesting access/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue anyway/i })).toBeEnabled()
    expect(screen.getByRole('button', { name: /try again/i })).toBeEnabled()
    expect(beginMock).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /continue anyway/i }))
    await waitFor(() => {
      expect(screen.getByText('Journey route')).toBeInTheDocument()
    })
  })

  it('never awaits a GPS fix before leaving the permission screen', async () => {
    const { enableLocationForTourBounded } = await import('../../../lib/locationAccess')
    enableLocationForTourBounded.mockResolvedValueOnce({
      permission: 'granted',
      fixStatus: 'searching',
      locationEnabled: true,
      position: null,
      shouldAdvance: true,
      access: 'granted',
    })

    renderBeginFlow()
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    fireEvent.click(screen.getByRole('button', { name: /enable location & start/i }))

    await waitFor(() => {
      expect(screen.getByText('Journey route')).toBeInTheDocument()
    })
    expect(enableLocationForTourBounded).toHaveBeenCalledWith(
      expect.objectContaining({ waitForFix: false }),
    )
  })
})
