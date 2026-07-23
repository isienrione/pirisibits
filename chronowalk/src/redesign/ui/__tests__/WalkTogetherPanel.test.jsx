import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { writeAccessEntitlement, writeDeviceCredential } from '../../../lib/accessSession.js'

const refreshFamilyBundle = vi.fn()
const createBundleInvite = vi.fn()
const revokeBundleSeat = vi.fn()
const createWalkSession = vi.fn()
const updateWalkSessionState = vi.fn()

vi.mock('../../../lib/familyWalk.js', async () => {
  const actual = await vi.importActual('../../../lib/familyWalk.js')
  return {
    ...actual,
    refreshFamilyBundle: (...args) => refreshFamilyBundle(...args),
    createBundleInvite: (...args) => createBundleInvite(...args),
    revokeBundleSeat: (...args) => revokeBundleSeat(...args),
    createWalkSession: (...args) => createWalkSession(...args),
    updateWalkSessionState: (...args) => updateWalkSessionState(...args),
    subscribeWalkSession: () => () => {},
    discoverActiveWalkSession: async () => null,
  }
})

vi.mock('../../../hooks/useOfflineAudio.js', () => ({
  useOfflineAudio: () => ({
    isReady: false,
    isDownloading: false,
    progress: null,
    error: null,
    startDownload: vi.fn(),
  }),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

import SettingsBottomSheet from '../SettingsBottomSheet.jsx'
import WalkTogetherPanel from '../WalkTogetherPanel.jsx'
import AppEntryFamily from '../../screens/AppEntryFamily.jsx'
import { FamilyWalkProvider } from '../../context/FamilyWalkContext.jsx'
import {
  buildInviteShareUrl,
  bundleMetaForProductId,
} from '../../../lib/familyWalk.js'

function seedOrganizer({ productId = 'rome-family', seatLimit = 4 } = {}) {
  writeDeviceCredential('test-device-credential-abcdefgh')
  writeAccessEntitlement({
    purchasedProductId: productId,
    contentProductId: 'rome-complete',
    seatLimit,
    role: 'owner',
    bundleStatus: 'active',
    offlineLeaseExpiresAt: Date.now() + 60_000,
  })
}

function seedMember({ productId = 'rome-couple', seatLimit = 2 } = {}) {
  writeDeviceCredential('test-member-credential-abcdefgh')
  writeAccessEntitlement({
    purchasedProductId: productId,
    contentProductId: 'rome-complete',
    seatLimit,
    role: 'member',
    bundleStatus: 'active',
    offlineLeaseExpiresAt: Date.now() + 60_000,
  })
}

function seatsFor(seatLimit) {
  const seats = [
    { id: 'seat-owner', label: 'Owner', role: 'owner', status: 'claimed', claimedAt: '2026-07-01' },
  ]
  for (let i = 2; i <= seatLimit; i += 1) {
    seats.push({
      id: `seat-member-${i}`,
      label: `Seat ${i}`,
      role: 'member',
      status: 'open',
      claimedAt: null,
    })
  }
  return seats
}

function organizerView({ productId = 'rome-family', seatLimit = 4 } = {}) {
  return {
    ok: true,
    id: 'bundle-1',
    bundleId: 'bundle-1',
    purchasedProductId: productId,
    contentProductId: 'rome-complete',
    seatLimit,
    role: 'owner',
    isOwner: true,
    bundleStatus: 'active',
    seats: seatsFor(seatLimit),
  }
}

describe('Walk together settings + management', () => {
  beforeEach(() => {
    localStorage.clear()
    mockNavigate.mockReset()
    refreshFamilyBundle.mockReset()
    createBundleInvite.mockReset()
    revokeBundleSeat.mockReset()
    createWalkSession.mockReset()
    updateWalkSessionState.mockReset()
  })

  it('shows Walk together in Settings for a verified Family organizer after onboarding', async () => {
    seedOrganizer({ productId: 'rome-family', seatLimit: 4 })
    refreshFamilyBundle.mockResolvedValue(organizerView({ productId: 'rome-family', seatLimit: 4 }))

    render(
      <MemoryRouter>
        <FamilyWalkProvider>
          <SettingsBottomSheet open onClose={vi.fn()} />
        </FamilyWalkProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByTestId('settings-walk-together')).toBeInTheDocument()
    expect(screen.getByText('Walk together')).toBeInTheDocument()
    expect(screen.getByText(/Invite people and manage your shared tour/i)).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('settings-walk-together'))
    expect(mockNavigate).toHaveBeenCalledWith('/walk-together')
  })

  it('lets a verified organizer open Walk together from Settings for seat management', async () => {
    seedOrganizer({ productId: 'rome-couple', seatLimit: 2 })
    refreshFamilyBundle.mockResolvedValue(organizerView({ productId: 'rome-couple', seatLimit: 2 }))

    render(
      <MemoryRouter>
        <FamilyWalkProvider>
          <SettingsBottomSheet open onClose={vi.fn()} />
        </FamilyWalkProvider>
      </MemoryRouter>,
    )

    const entry = await screen.findByTestId('settings-walk-together')
    expect(entry).toHaveTextContent(/Invite people and manage your shared tour/i)
    fireEvent.click(entry)
    expect(mockNavigate).toHaveBeenCalledWith('/walk-together')
  })

  it('hides Walk together for solo purchases and keeps the tier selector out of Settings', async () => {
    writeDeviceCredential('solo-credential-abcdefghijkl')
    writeAccessEntitlement({
      purchasedProductId: 'rome-complete',
      contentProductId: 'rome-complete',
      seatLimit: 1,
      role: 'solo',
      bundleStatus: null,
      offlineLeaseExpiresAt: Date.now() + 60_000,
    })
    refreshFamilyBundle.mockResolvedValue(null)

    render(
      <MemoryRouter>
        <FamilyWalkProvider>
          <SettingsBottomSheet open onClose={vi.fn()} />
        </FamilyWalkProvider>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.queryByTestId('settings-walk-together')).not.toBeInTheDocument()
    })
    expect(screen.queryByText(/Create couple/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Couple$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Family$/i })).not.toBeInTheDocument()
  })

  it('shows Couple organizer with two seats and Roma Eterna 21 stops from server state', async () => {
    seedOrganizer({ productId: 'rome-couple', seatLimit: 2 })
    refreshFamilyBundle.mockResolvedValue(organizerView({ productId: 'rome-couple', seatLimit: 2 }))

    render(
      <MemoryRouter>
        <FamilyWalkProvider>
          <WalkTogetherPanel />
        </FamilyWalkProvider>
      </MemoryRouter>,
    )

    const panel = await screen.findByTestId('walk-together-panel')
    expect(panel).toHaveAttribute('data-bundle', 'couple')
    expect(screen.getByRole('heading', { name: 'Couple Bundle' })).toBeInTheDocument()
    expect(screen.getByText(/Complete Roma Eterna · All 21 stops/i)).toBeInTheDocument()
    expect(screen.getByText('1 of 2 travelers joined')).toBeInTheDocument()
    expect(screen.getByText('1/2 seats in use')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Your walking party' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Shared walk controls' })).toBeInTheDocument()
    expect(screen.queryByText(/Create couple\/family bundle/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Couple$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Family$/i })).not.toBeInTheDocument()
  })

  it('shows Family organizer with four seats from server state', async () => {
    seedOrganizer({ productId: 'rome-family', seatLimit: 4 })
    refreshFamilyBundle.mockResolvedValue(organizerView({ productId: 'rome-family', seatLimit: 4 }))

    render(
      <MemoryRouter>
        <FamilyWalkProvider>
          <WalkTogetherPanel />
        </FamilyWalkProvider>
      </MemoryRouter>,
    )

    const panel = await screen.findByTestId('walk-together-panel')
    expect(panel).toHaveAttribute('data-bundle', 'family')
    expect(screen.getByRole('heading', { name: 'Family Bundle' })).toBeInTheDocument()
    expect(screen.getByText('1 of 4 travelers joined')).toBeInTheDocument()
    expect(screen.getByText('1/4 seats in use')).toBeInTheDocument()
    expect(screen.getByLabelText('1 of 4 travelers joined').querySelectorAll('li')).toHaveLength(4)
    expect(screen.getAllByRole('button', { name: /Create invitation/i }).length).toBe(3)
  })

  it('orders seats and renders claimed, invitation-ready, and open states distinctly', async () => {
    seedOrganizer({ productId: 'rome-family', seatLimit: 4 })
    refreshFamilyBundle.mockResolvedValue({
      ...organizerView({ productId: 'rome-family', seatLimit: 4 }),
      seats: [
        { id: 'seat-owner', label: 'Owner', role: 'owner', status: 'claimed', claimedAt: '2026-07-01' },
        { id: 'seat-member-2', label: 'Seat 2', role: 'member', status: 'open', claimedAt: null },
        {
          id: 'seat-member-3',
          label: 'Seat 3',
          role: 'member',
          status: 'claimed',
          claimedAt: '2026-07-02',
        },
        { id: 'seat-member-4', label: 'Seat 4', role: 'member', status: 'open', claimedAt: null },
      ],
    })

    render(
      <MemoryRouter>
        <FamilyWalkProvider>
          <WalkTogetherPanel />
        </FamilyWalkProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByTestId('walk-together-seat-seat-owner')).toHaveAttribute(
      'data-seat-status',
      'organizer',
    )
    expect(screen.getByTestId('walk-together-seat-seat-member-3')).toHaveAttribute(
      'data-seat-status',
      'claimed',
    )
    expect(screen.getByTestId('walk-together-seat-seat-member-2')).toHaveAttribute(
      'data-seat-status',
      'open',
    )
    expect(screen.getByText('Organizer')).toBeInTheDocument()
    expect(screen.getByText('Joined on a device')).toBeInTheDocument()
    expect(screen.getAllByText('Open seat').length).toBeGreaterThanOrEqual(1)

    const seatButtons = screen.getAllByTestId(/walk-together-seat-/)
    expect(seatButtons[0]).toHaveAttribute('data-testid', 'walk-together-seat-seat-owner')
    expect(seatButtons[1]).toHaveAttribute('data-testid', 'walk-together-seat-seat-member-3')
  })

  it('lets an organizer create an invitation only for an open seat', async () => {
    seedOrganizer({ productId: 'rome-couple', seatLimit: 2 })
    refreshFamilyBundle.mockResolvedValue(organizerView({ productId: 'rome-couple', seatLimit: 2 }))
    createBundleInvite.mockResolvedValue({
      ok: true,
      invite: 'INVITESECRET123456',
      seatId: 'seat-member-2',
      expiresAt: '2026-07-23T00:00:00Z',
    })

    render(
      <MemoryRouter>
        <FamilyWalkProvider>
          <WalkTogetherPanel />
        </FamilyWalkProvider>
      </MemoryRouter>,
    )

    const createBtn = await screen.findByRole('button', { name: /Create invitation/i })
    fireEvent.click(createBtn)
    await waitFor(() => expect(createBundleInvite).toHaveBeenCalled())
    expect(createBundleInvite).toHaveBeenCalledWith({ seatId: 'seat-member-2' })
    expect(await screen.findByTestId('walk-together-invite-code')).toHaveTextContent(
      'INVITESECRET123456',
    )
  })

  it('does not let members create or revoke invitations', async () => {
    seedMember({ productId: 'rome-family', seatLimit: 4 })
    refreshFamilyBundle.mockResolvedValue({
      ok: true,
      purchasedProductId: 'rome-family',
      contentProductId: 'rome-complete',
      seatLimit: 4,
      role: 'member',
      isOwner: false,
      bundleStatus: 'active',
      seats: null,
    })

    render(
      <MemoryRouter>
        <FamilyWalkProvider>
          <WalkTogetherPanel />
        </FamilyWalkProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByText(/You belong to a shared Couple\/Family walk/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /You’re walking together|You're walking together/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Your walking party' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Shared walk controls' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Create invitation/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Revoke seat/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('switch', { name: 'Shared tour syncing' })).not.toBeInTheDocument()
    expect(screen.queryByRole('switch', { name: 'Only leader resumes' })).not.toBeInTheDocument()
    expect(createBundleInvite).not.toHaveBeenCalled()
    expect(revokeBundleSeat).not.toHaveBeenCalled()
  })

  it('keeps invitation copy/share and revoke handlers wired for organizers', async () => {
    seedOrganizer({ productId: 'rome-couple', seatLimit: 2 })
    refreshFamilyBundle.mockResolvedValue(organizerView({ productId: 'rome-couple', seatLimit: 2 }))
    createBundleInvite.mockResolvedValue({
      ok: true,
      invite: 'INVITESECRET123456',
      seatId: 'seat-member-2',
      expiresAt: '2026-07-23T00:00:00Z',
    })
    revokeBundleSeat.mockResolvedValue({
      ok: true,
      ...organizerView({ productId: 'rome-couple', seatLimit: 2 }),
      seats: [
        { id: 'seat-owner', label: 'Owner', role: 'owner', status: 'claimed', claimedAt: '2026-07-01' },
        { id: 'seat-member-2', label: 'Seat 2', role: 'member', status: 'revoked', claimedAt: null },
      ],
    })

    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })

    render(
      <MemoryRouter>
        <FamilyWalkProvider>
          <WalkTogetherPanel />
        </FamilyWalkProvider>
      </MemoryRouter>,
    )

    fireEvent.click(await screen.findByRole('button', { name: /Create invitation/i }))
    expect(await screen.findByTestId('walk-together-invite-code')).toHaveTextContent(
      'INVITESECRET123456',
    )
    expect(screen.getByTestId('walk-together-seat-seat-member-2')).toHaveAttribute(
      'data-seat-status',
      'invite-ready',
    )

    fireEvent.click(screen.getByRole('button', { name: /Copy invitation link/i }))
    await waitFor(() => expect(writeText).toHaveBeenCalled())
    expect(screen.getByText(/Invite link copied/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Revoke seat for Walker 2/i }))
    await waitFor(() => expect(revokeBundleSeat).toHaveBeenCalled())
    expect(revokeBundleSeat).toHaveBeenCalledWith({ seatId: 'seat-member-2' })
  })

  it('wires shared-walk sync switches without exposing them as a dashboard', async () => {
    seedOrganizer({ productId: 'rome-family', seatLimit: 4 })
    refreshFamilyBundle.mockResolvedValue(organizerView({ productId: 'rome-family', seatLimit: 4 }))
    createWalkSession.mockResolvedValue({
      id: 'session-1',
      joinCode: 'JOIN12',
      syncEnabled: true,
      resumePolicy: 'leader',
      leaderSeatId: 'seat-owner',
      updatedAt: '2026-07-23T00:00:00Z',
    })
    updateWalkSessionState.mockImplementation(async (_id, patch) => ({
      id: 'session-1',
      joinCode: 'JOIN12',
      syncEnabled: patch.syncEnabled ?? true,
      resumePolicy: patch.resumePolicy ?? 'leader',
      leaderSeatId: 'seat-owner',
      updatedAt: '2026-07-23T00:00:01Z',
    }))

    render(
      <MemoryRouter>
        <FamilyWalkProvider>
          <WalkTogetherPanel />
        </FamilyWalkProvider>
      </MemoryRouter>,
    )

    fireEvent.click(await screen.findByRole('button', { name: /Start shared tour syncing/i }))
    await waitFor(() => expect(createWalkSession).toHaveBeenCalled())
    expect(await screen.findByTestId('walk-together-session')).toBeInTheDocument()

    const syncSwitch = screen.getByRole('switch', { name: 'Shared tour syncing' })
    const resumeSwitch = screen.getByRole('switch', { name: 'Only leader resumes' })
    expect(syncSwitch).toHaveAttribute('aria-checked', 'true')
    expect(resumeSwitch).toHaveAttribute('aria-checked', 'true')

    fireEvent.click(syncSwitch)
    await waitFor(() => expect(updateWalkSessionState).toHaveBeenCalled())
    expect(updateWalkSessionState).toHaveBeenCalledWith(
      'session-1',
      expect.objectContaining({ syncEnabled: false }),
    )
  })

  it('fails closed when credential is missing', async () => {
    refreshFamilyBundle.mockResolvedValue(null)

    render(
      <MemoryRouter>
        <FamilyWalkProvider>
          <WalkTogetherPanel />
        </FamilyWalkProvider>
      </MemoryRouter>,
    )

    expect(
      await screen.findByText(/available after a Couple or Family Bundle purchase/i),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Create invitation/i })).not.toBeInTheDocument()
  })

  it('keeps the Couple/Family selector out of paid app entry', async () => {
    seedOrganizer({ productId: 'rome-couple', seatLimit: 2 })
    refreshFamilyBundle.mockResolvedValue(organizerView({ productId: 'rome-couple', seatLimit: 2 }))

    render(
      <MemoryRouter>
        <FamilyWalkProvider>
          <AppEntryFamily onSkip={vi.fn()} />
        </FamilyWalkProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByTestId('app-entry-family')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Couple$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Family$/i })).not.toBeInTheDocument()
    expect(screen.getByText(/Settings → Walk together/i)).toBeInTheDocument()
  })

  it('skips app entry invite step for solo purchases', async () => {
    writeAccessEntitlement({
      purchasedProductId: 'rome-central',
      contentProductId: 'rome-central',
      seatLimit: 1,
      role: 'solo',
      offlineLeaseExpiresAt: Date.now() + 60_000,
    })
    refreshFamilyBundle.mockResolvedValue(null)
    const onSkip = vi.fn()

    render(
      <MemoryRouter>
        <FamilyWalkProvider>
          <AppEntryFamily onSkip={onSkip} />
        </FamilyWalkProvider>
      </MemoryRouter>,
    )

    await waitFor(() => expect(onSkip).toHaveBeenCalled())
  })
})

describe('invite link helpers', () => {
  it('builds invite URLs from the site origin helper in canonical lowercase', () => {
    const url = buildInviteShareUrl('abc123secret')
    expect(url).toMatch(/\/invite\?code=abc123secret$/)
    expect(buildInviteShareUrl('ABC123SECRET')).toMatch(/\/invite\?code=abc123secret$/)
    expect(url).not.toContain('undefined')
  })

  it('maps product ids to server seat limits', () => {
    expect(bundleMetaForProductId('rome-couple')).toMatchObject({
      seatLimit: 2,
      contentProductId: 'rome-complete',
      stopCount: 21,
    })
    expect(bundleMetaForProductId('rome-family')).toMatchObject({
      seatLimit: 4,
      contentProductId: 'rome-complete',
      stopCount: 21,
    })
    expect(bundleMetaForProductId('rome-complete')).toBeNull()
  })
})
