import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AccessPage } from '../AccessPage'
import { markAppEntryComplete, clearAppEntryComplete } from '../../../lib/appEntry.js'
import { JOURNEY_STATES, transitionJourney } from '../../../state/journey'
import { grantTestAccess } from '../../../test/grantTestAccess.js'
import { hasValidLocalAccess } from '../../../lib/accessSession.js'

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
        <Route path="/home" element={<div>Home route</div>} />
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
    clearAppEntryComplete()
    transitionJourney(JOURNEY_STATES.IDLE)
    validateMock.mockReset()
    pullMock.mockReset()
    pullMock.mockResolvedValue(null)
  })

  it('sends owners who finished app entry into home', () => {
    grantTestAccess()
    markAppEntryComplete()

    renderAccessPage()

    expect(screen.getByText('Home route')).toBeInTheDocument()
  })

  it('sends new owners into app entry setup', () => {
    grantTestAccess()

    renderAccessPage()

    expect(screen.getByText('Setup route')).toBeInTheDocument()
  })

  it('sends owners with a real in-progress journey to home', () => {
    grantTestAccess()
    transitionJourney(JOURNEY_STATES.WALKING, { currentSequenceIndex: 3 })

    renderAccessPage()

    expect(screen.getByText('Home route')).toBeInTheDocument()
  })

  it('grants access and sends first-time purchasers into app entry', async () => {
    validateMock.mockResolvedValue({
      ok: true,
      source: 'dev',
      productId: 'rome-essential',
      purchasedProductId: 'rome-essential',
      contentProductId: 'rome-essential',
      seatLimit: 1,
      role: 'solo',
      deviceCredential: 'dev-credential-dev',
    })

    renderAccessPage('/access?token=dev')

    await waitFor(() => {
      expect(screen.getByText('Setup route')).toBeInTheDocument()
    })

    expect(hasValidLocalAccess()).toBe(true)
    expect(localStorage.getItem('cw_purchased_tier_v1')).toBe('rome-essential')
  })

  it('always validates a token URL even when unrelated local access exists', async () => {
    grantTestAccess({ credential: 'unrelated-local-credential-aaaaaaaaaaaaaaaa' })
    expect(hasValidLocalAccess()).toBe(true)

    validateMock.mockResolvedValue({ ok: false, reason: 'invalid' })

    renderAccessPage('/access?token=00000000-0000-4000-8000-000000000000')

    expect(await screen.findByText(/this link is not valid/i)).toBeInTheDocument()
    expect(validateMock).toHaveBeenCalledWith('00000000-0000-4000-8000-000000000000')
  })

  it('hydrates cloud progress before routing to resume', async () => {
    validateMock.mockImplementation(async () => {
      grantTestAccess({
        credential: 'hydrated-device-credential-bbbbbbbbbbbbbbbb',
        purchasedProductId: 'rome-complete',
        contentProductId: 'rome-complete',
      })
      transitionJourney(JOURNEY_STATES.WALKING, {
        currentSequenceIndex: 5,
        completedWaypointIds: ['w01'],
      })
      return {
        ok: true,
        source: 'supabase',
        productId: 'rome-complete',
        purchasedProductId: 'rome-complete',
        contentProductId: 'rome-complete',
        seatLimit: 1,
        role: 'solo',
        deviceCredential: 'hydrated-device-credential-bbbbbbbbbbbbbbbb',
      }
    })
    pullMock.mockResolvedValue({
      state: JOURNEY_STATES.WALKING,
      context: {
        currentSequenceIndex: 5,
        completedWaypointIds: ['w01'],
        lastActiveAt: Date.now(),
      },
    })

    renderAccessPage('/access?token=00000000-0000-4000-8000-000000000000')

    // Fresh unlock always opens App Entry (offline + A2HS) before resume/begin.
    await waitFor(() => {
      expect(screen.getByText('Setup route')).toBeInTheDocument()
    })
    expect(pullMock).toHaveBeenCalled()
  })

  it('shows restore UI when token validation fails', async () => {
    validateMock.mockResolvedValue({ ok: false, reason: 'invalid_format' })

    renderAccessPage('/access?token=bad-token')

    expect(await screen.findByText(/this link is not valid/i)).toBeInTheDocument()
    expect(hasValidLocalAccess()).toBe(false)
  })
})
