import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { writeAccessEntitlement, writeDeviceCredential } from '../../../lib/accessSession.js'
import {
  beginJourney,
  getJourneySnapshot,
  JOURNEY_STATES,
  resetJourney,
  transitionJourney,
} from '../../../state/journey.js'
import { FamilyWalkProvider } from '../../context/FamilyWalkContext.jsx'
import RedesignWalkTogetherPage from '../RedesignWalkTogetherPage.jsx'

const refreshFamilyBundle = vi.fn()
const createBundleInvite = vi.fn()
const revokeBundleSeat = vi.fn()
const createWalkSession = vi.fn()

vi.mock('../../../lib/familyWalk.js', async () => {
  const actual = await vi.importActual('../../../lib/familyWalk.js')
  return {
    ...actual,
    refreshFamilyBundle: (...args) => refreshFamilyBundle(...args),
    createBundleInvite: (...args) => createBundleInvite(...args),
    revokeBundleSeat: (...args) => revokeBundleSeat(...args),
    createWalkSession: (...args) => createWalkSession(...args),
  }
})

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

function seedOrganizer() {
  writeDeviceCredential('test-device-credential-abcdefgh')
  writeAccessEntitlement({
    purchasedProductId: 'rome-family',
    contentProductId: 'rome-complete',
    seatLimit: 4,
    role: 'owner',
    bundleStatus: 'active',
    offlineLeaseExpiresAt: Date.now() + 60_000,
  })
}

function seedMember() {
  writeDeviceCredential('test-member-credential-abcdefgh')
  writeAccessEntitlement({
    purchasedProductId: 'rome-couple',
    contentProductId: 'rome-complete',
    seatLimit: 2,
    role: 'member',
    bundleStatus: 'active',
    offlineLeaseExpiresAt: Date.now() + 60_000,
  })
}

function organizerView() {
  return {
    ok: true,
    id: 'bundle-1',
    bundleId: 'bundle-1',
    purchasedProductId: 'rome-family',
    contentProductId: 'rome-complete',
    seatLimit: 4,
    role: 'owner',
    isOwner: true,
    bundleStatus: 'active',
    seats: [
      { id: 'seat-owner', label: 'Owner', role: 'owner', status: 'claimed', claimedAt: '2026-07-01' },
      { id: 'seat-member-2', label: 'Seat 2', role: 'member', status: 'open', claimedAt: null },
      { id: 'seat-member-3', label: 'Seat 3', role: 'member', status: 'open', claimedAt: null },
      { id: 'seat-member-4', label: 'Seat 4', role: 'member', status: 'open', claimedAt: null },
    ],
  }
}

function renderPage(initialPath = '/walk-together') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <FamilyWalkProvider>
        <Routes>
          <Route path="/walk-together" element={<RedesignWalkTogetherPage />} />
        </Routes>
      </FamilyWalkProvider>
    </MemoryRouter>,
  )
}

describe('RedesignWalkTogetherPage navigation', () => {
  beforeEach(() => {
    localStorage.clear()
    mockNavigate.mockReset()
    refreshFamilyBundle.mockReset()
    createBundleInvite.mockReset()
    revokeBundleSeat.mockReset()
    createWalkSession.mockReset()
    resetJourney()
  })

  it('shows Continue to your walk and Back to Settings for an organizer', async () => {
    seedOrganizer()
    refreshFamilyBundle.mockResolvedValue(organizerView())
    beginJourney({ pace: 'classic' })
    transitionJourney(JOURNEY_STATES.STORY, { currentSequenceIndex: 4 })

    renderPage()

    expect(await screen.findByTestId('walk-together-page')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Back to Settings' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue to your walk' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Create invitation/i }).length).toBeGreaterThan(0)

    const continueBtn = screen.getByTestId('walk-together-continue')
    expect(continueBtn).toHaveStyle({ minHeight: '44px' })

    fireEvent.click(continueBtn)
    expect(mockNavigate).toHaveBeenCalledWith('/journey')
    expect(getJourneySnapshot().state).toBe(JOURNEY_STATES.STORY)
    expect(getJourneySnapshot().context.currentSequenceIndex).toBe(4)
    expect(createWalkSession).not.toHaveBeenCalled()
  })

  it('returns members to the active walk without organizer controls', async () => {
    seedMember()
    refreshFamilyBundle.mockResolvedValue({
      ok: true,
      purchasedProductId: 'rome-couple',
      contentProductId: 'rome-complete',
      seatLimit: 2,
      role: 'member',
      isOwner: false,
      bundleStatus: 'active',
      seats: null,
    })
    beginJourney({ pace: 'classic' })
    transitionJourney(JOURNEY_STATES.WALKING, { currentSequenceIndex: 2 })

    renderPage('/walk-together')

    expect(await screen.findByText(/You belong to a shared Couple\/Family walk/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Create invitation/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Revoke seat/i })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Continue to your walk' }))
    expect(mockNavigate).toHaveBeenCalledWith('/journey')
    expect(createWalkSession).not.toHaveBeenCalled()
    expect(createBundleInvite).not.toHaveBeenCalled()
  })

  it('works when /walk-together is opened directly with no useful history', async () => {
    seedOrganizer()
    refreshFamilyBundle.mockResolvedValue(organizerView())
    beginJourney({ pace: 'classic' })
    transitionJourney(JOURNEY_STATES.APPROACHING, { currentSequenceIndex: 1 })

    renderPage('/walk-together')

    expect(await screen.findByTestId('walk-together-page')).toBeInTheDocument()
    const continueBtn = await screen.findByTestId('walk-together-continue')
    expect(continueBtn).toHaveAccessibleName('Continue to your walk')

    fireEvent.click(screen.getByRole('button', { name: 'Back to Settings' }))
    expect(mockNavigate).toHaveBeenCalledWith('/settings')

    fireEvent.click(continueBtn)
    expect(mockNavigate).toHaveBeenCalledWith('/journey')
    expect(getJourneySnapshot().context.currentSequenceIndex).toBe(1)
    expect(createWalkSession).not.toHaveBeenCalled()
  })

  it('still offers Continue when bundle access is unavailable', async () => {
    refreshFamilyBundle.mockResolvedValue(null)
    markEntryAndJourney()

    renderPage()

    expect(
      await screen.findByText(/available after a Couple or Family Bundle purchase/i),
    ).toBeInTheDocument()
    fireEvent.click(await screen.findByRole('button', { name: 'Continue to your walk' }))
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/journey'))
  })
})

function markEntryAndJourney() {
  beginJourney({ pace: 'classic' })
  transitionJourney(JOURNEY_STATES.STORY, { currentSequenceIndex: 0 })
}
