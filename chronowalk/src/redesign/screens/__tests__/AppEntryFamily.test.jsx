import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { writeAccessEntitlement, writeDeviceCredential } from '../../../lib/accessSession.js'

const refreshFamilyBundle = vi.fn()
const discoverActiveWalkSession = vi.fn(async () => null)

vi.mock('../../../lib/familyWalk.js', async () => {
  const actual = await vi.importActual('../../../lib/familyWalk.js')
  return {
    ...actual,
    refreshFamilyBundle: (...args) => refreshFamilyBundle(...args),
    discoverActiveWalkSession: (...args) => discoverActiveWalkSession(...args),
    subscribeWalkSession: () => () => {},
    createBundleInvite: vi.fn(),
    revokeBundleSeat: vi.fn(),
    createWalkSession: vi.fn(),
    updateWalkSessionState: vi.fn(),
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

import AppEntryFamily from '../AppEntryFamily.jsx'
import { FamilyWalkProvider } from '../../context/FamilyWalkContext.jsx'

function seedCredential(role, productId, seatLimit) {
  writeDeviceCredential('test-device-credential-abcdefghijklmnop')
  writeAccessEntitlement({
    purchasedProductId: productId,
    contentProductId: productId.startsWith('rome-couple') || productId.startsWith('rome-family')
      ? 'rome-complete'
      : productId,
    seatLimit,
    role,
    bundleStatus: 'active',
    offlineLeaseExpiresAt: Date.now() + 60_000,
  })
}

function organizerBundle({ productId = 'rome-couple', seatLimit = 2 } = {}) {
  const seats = [
    { id: 'seat-owner', label: 'You', role: 'owner', status: 'claimed', claimedAt: '2026-07-01' },
  ]
  for (let i = 2; i <= seatLimit; i += 1) {
    seats.push({
      id: `seat-member-${i}`,
      label: `Walker ${i}`,
      role: 'member',
      status: 'open',
      claimedAt: null,
    })
  }
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
    seats,
  }
}

function memberBundle({ productId = 'rome-couple', seatLimit = 2 } = {}) {
  return {
    ok: true,
    id: 'bundle-1',
    bundleId: 'bundle-1',
    purchasedProductId: productId,
    contentProductId: 'rome-complete',
    seatLimit,
    role: 'member',
    isOwner: false,
    bundleStatus: 'active',
    seats: null,
  }
}

function renderEntry(onSkip = vi.fn()) {
  return {
    onSkip,
    ...render(
      <MemoryRouter>
        <FamilyWalkProvider>
          <AppEntryFamily onSkip={onSkip} />
        </FamilyWalkProvider>
      </MemoryRouter>,
    ),
  }
}

describe('AppEntryFamily lifecycle', () => {
  beforeEach(() => {
    localStorage.clear()
    refreshFamilyBundle.mockReset()
    refreshFamilyBundle.mockResolvedValue(null)
    discoverActiveWalkSession.mockReset()
    discoverActiveWalkSession.mockResolvedValue(null)
  })

  it('Couple organizer resolves and sees 2-seat bundle management', async () => {
    seedCredential('owner', 'rome-couple', 2)
    refreshFamilyBundle.mockResolvedValue(organizerBundle({ productId: 'rome-couple', seatLimit: 2 }))

    renderEntry()

    expect(await screen.findByTestId('app-entry-family')).toHaveAttribute('data-phase', 'organizer')
    expect(screen.getByText('Invite someone to your shared tour.')).toBeInTheDocument()
    expect(await screen.findByTestId('walk-together-occupancy')).toHaveTextContent(/1 of 2/)
    expect(screen.getByRole('button', { name: /Create invitation/i })).toBeInTheDocument()
    expect(screen.queryByText('Loading your bundle…')).not.toBeInTheDocument()
  })

  it('Family organizer resolves and sees 4-seat bundle management', async () => {
    seedCredential('owner', 'rome-family', 4)
    refreshFamilyBundle.mockResolvedValue(organizerBundle({ productId: 'rome-family', seatLimit: 4 }))

    renderEntry()

    expect(await screen.findByTestId('app-entry-family')).toHaveAttribute('data-phase', 'organizer')
    expect(await screen.findByTestId('walk-together-occupancy')).toHaveTextContent(/1 of 4/)
    expect(screen.getAllByTestId(/walk-together-seat-/)).toHaveLength(4)
    expect(screen.queryByText('Loading your bundle…')).not.toBeInTheDocument()
  })

  it('organizer never remains indefinitely on Loading your bundle when session discovery hangs', async () => {
    seedCredential('owner', 'rome-couple', 2)
    refreshFamilyBundle.mockResolvedValue(organizerBundle({ productId: 'rome-couple', seatLimit: 2 }))
    discoverActiveWalkSession.mockImplementation(() => new Promise(() => {}))

    renderEntry()

    expect(await screen.findByTestId('app-entry-family')).toHaveAttribute('data-phase', 'organizer')
    expect(screen.queryByText('Loading your bundle…')).not.toBeInTheDocument()
    expect(await screen.findByTestId('walk-together-panel')).toBeInTheDocument()
  })

  it('invited Couple member automatically skips without invite management', async () => {
    seedCredential('member', 'rome-couple', 2)
    refreshFamilyBundle.mockResolvedValue(memberBundle({ productId: 'rome-couple', seatLimit: 2 }))
    const { onSkip } = renderEntry()

    await waitFor(() => expect(onSkip).toHaveBeenCalledTimes(1))
    expect(screen.queryByText('Invite someone to your shared tour.')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Create invitation/i })).not.toBeInTheDocument()
    expect(screen.queryByText('Loading your bundle…')).not.toBeInTheDocument()
  })

  it('invited Family member automatically skips without invite management', async () => {
    seedCredential('member', 'rome-family', 4)
    refreshFamilyBundle.mockResolvedValue(memberBundle({ productId: 'rome-family', seatLimit: 4 }))
    const { onSkip } = renderEntry()

    await waitFor(() => expect(onSkip).toHaveBeenCalledTimes(1))
    expect(screen.queryByText(/Invite someone/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Revoke seat/i })).not.toBeInTheDocument()
  })

  it('solo SKUs skip the step', async () => {
    seedCredential('solo', 'rome-central', 1)
    refreshFamilyBundle.mockResolvedValue(null)
    const { onSkip } = renderEntry()

    await waitFor(() => expect(onSkip).toHaveBeenCalledTimes(1))
    expect(screen.queryByTestId('app-entry-family')).not.toBeInTheDocument()
  })

  it('slow bundle resolution does not prematurely classify an organizer as member or solo', async () => {
    seedCredential('owner', 'rome-family', 4)
    let release
    const pending = new Promise((resolve) => {
      release = () => resolve(organizerBundle({ productId: 'rome-family', seatLimit: 4 }))
    })
    refreshFamilyBundle.mockImplementation(() => pending)
    const { onSkip } = renderEntry()

    expect(await screen.findByTestId('app-entry-family')).toHaveAttribute('data-phase', 'resolving')
    expect(screen.getByText('Loading your bundle…')).toBeInTheDocument()
    expect(onSkip).not.toHaveBeenCalled()
    expect(screen.queryByText('Invite someone to your shared tour.')).not.toBeInTheDocument()

    await act(async () => {
      release()
      await pending
    })

    expect(await screen.findByTestId('app-entry-family')).toHaveAttribute('data-phase', 'organizer')
    expect(onSkip).not.toHaveBeenCalled()
    expect(await screen.findByTestId('walk-together-occupancy')).toHaveTextContent(/1 of 4/)
  })

  it('recoverable organizer load failure shows Retry and Continue without inviting', async () => {
    seedCredential('owner', 'rome-couple', 2)
    // Boot refresh + entry resolve both hit the failure path.
    refreshFamilyBundle.mockRejectedValue(new Error('network_down'))
    const { onSkip } = renderEntry()

    expect(await screen.findByTestId('app-entry-family')).toHaveAttribute('data-phase', 'error')
    expect(screen.getByTestId('app-entry-family-retry')).toBeInTheDocument()
    expect(screen.getByTestId('app-entry-family-continue-without')).toBeInTheDocument()
    expect(onSkip).not.toHaveBeenCalled()
  })

  it('Retry successfully loads the bundle after a failure', async () => {
    seedCredential('owner', 'rome-couple', 2)
    refreshFamilyBundle
      .mockRejectedValueOnce(new Error('network_down')) // provider boot
      .mockRejectedValueOnce(new Error('network_down')) // entry resolve
      .mockResolvedValue(organizerBundle({ productId: 'rome-couple', seatLimit: 2 }))

    renderEntry()

    expect(await screen.findByTestId('app-entry-family')).toHaveAttribute('data-phase', 'error')
    fireEvent.click(screen.getByTestId('app-entry-family-retry'))

    expect(await screen.findByTestId('app-entry-family')).toHaveAttribute('data-phase', 'organizer')
    expect(await screen.findByTestId('walk-together-occupancy')).toHaveTextContent(/1 of 2/)
  })

  it('onSkip/finishEntry runs exactly once for members', async () => {
    seedCredential('member', 'rome-couple', 2)
    refreshFamilyBundle.mockResolvedValue(memberBundle())
    const { onSkip } = renderEntry()

    await waitFor(() => expect(onSkip).toHaveBeenCalledTimes(1))
    await act(async () => {
      await Promise.resolve()
    })
    expect(onSkip).toHaveBeenCalledTimes(1)
  })

  it('Continue without inviting finishes exactly once', async () => {
    seedCredential('owner', 'rome-couple', 2)
    refreshFamilyBundle.mockRejectedValue(new Error('network_down'))
    const { onSkip } = renderEntry()

    await screen.findByTestId('app-entry-family-continue-without')
    fireEvent.click(screen.getByTestId('app-entry-family-continue-without'))
    fireEvent.click(screen.getByTestId('app-entry-family-continue-without'))
    expect(onSkip).toHaveBeenCalledTimes(1)
  })

  it('does not reintroduce client-side bundle minting or tier selection', async () => {
    seedCredential('owner', 'rome-couple', 2)
    refreshFamilyBundle.mockResolvedValue(organizerBundle())
    renderEntry()

    expect(await screen.findByTestId('app-entry-family')).toHaveAttribute('data-phase', 'organizer')
    expect(screen.queryByRole('button', { name: /^Couple$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Family$/i })).not.toBeInTheDocument()
  })
})
