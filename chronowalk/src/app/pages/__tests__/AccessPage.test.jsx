import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AccessPage } from '../AccessPage'
import { ACCESS_KEY } from '../../../lib/config'
import { JOURNEY_STATES, transitionJourney } from '../../../state/journey'

const validateMock = vi.fn()
const pullMock = vi.fn()

vi.mock('../../../lib/access', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    validateAccessToken: (...args) => validateMock(...args),
  }
})

vi.mock('../../../lib/journeyCloud.js', () => ({
  pullJourneyProgress: (...args) => pullMock(...args),
  pushJourneyProgress: vi.fn(),
  scheduleJourneyCloudPush: vi.fn(),
}))

function renderAccessPage(initialEntry = '/access') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/access" element={<AccessPage />} />
        <Route path="/setup" element={<div>Setup route</div>} />
        <Route path="/begin" element={<div>Begin route</div>} />
        <Route path="/access/confirmed" element={<div>Confirmed route</div>} />
        <Route path="/journey" element={<div>Journey route</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('AccessPage', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    transitionJourney(JOURNEY_STATES.IDLE)
    validateMock.mockReset()
    pullMock.mockReset()
    pullMock.mockResolvedValue(null)
  })

  it('sends owners without saved progress into setup', () => {
    localStorage.setItem(ACCESS_KEY, 'true')

    renderAccessPage()

    expect(screen.getByText('Setup route')).toBeInTheDocument()
  })

  it('offers resume to owners with a real in-progress journey', () => {
    localStorage.setItem(ACCESS_KEY, 'true')
    transitionJourney(JOURNEY_STATES.WALKING, { currentSequenceIndex: 3 })

    renderAccessPage()

    expect(screen.getByText('Begin route')).toBeInTheDocument()
  })

  it('grants access, stores tier, and sends first-time purchasers to confirmation', async () => {
    validateMock.mockResolvedValue({ ok: true, source: 'dev', productId: 'rome-essential' })

    renderAccessPage('/access?token=dev')

    await waitFor(() => {
      expect(screen.getByText('Confirmed route')).toBeInTheDocument()
    })

    expect(localStorage.getItem(ACCESS_KEY)).toBe('true')
    expect(localStorage.getItem('cw_purchased_tier_v1')).toBe('rome-essential')
  })

  it('hydrates cloud progress before routing to resume', async () => {
    validateMock.mockResolvedValue({ ok: true, source: 'staging', productId: 'rome-complete' })
    pullMock.mockResolvedValue({
      state: JOURNEY_STATES.WALKING,
      context: {
        currentSequenceIndex: 5,
        completedWaypointIds: ['w01'],
        lastActiveAt: Date.now(),
      },
    })

    renderAccessPage('/access?token=550e8400-e29b-41d4-a716-446655440000')

    await waitFor(() => {
      expect(screen.getByText('Begin route')).toBeInTheDocument()
    })
  })

  it('shows restore UI when token validation fails', async () => {
    validateMock.mockResolvedValue({ ok: false, reason: 'invalid_format' })

    renderAccessPage('/access?token=bad-token')

    expect(await screen.findByText(/this link is not valid/i)).toBeInTheDocument()
    expect(localStorage.getItem(ACCESS_KEY)).toBeNull()
  })
})
