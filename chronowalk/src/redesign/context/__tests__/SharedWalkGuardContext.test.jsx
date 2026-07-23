import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { SharedWalkGuardProvider, useSharedWalkGuard } from '../SharedWalkGuardContext.jsx'

const jumpToWaypointInJourney = vi.fn(() => true)

vi.mock('../../../lib/jumpToWaypoint.js', () => ({
  jumpToWaypointInJourney: (...args) => jumpToWaypointInJourney(...args),
}))

vi.mock('../../../content/manifest.js', async () => {
  const actual = await vi.importActual('../../../content/manifest.js')
  return {
    ...actual,
    loadRomeManifest: () => ({
      waypointsById: {
        w01: { id: 'w01', title: 'Piazza del Popolo' },
        w02: { id: 'w02', title: 'Ara Pacis' },
      },
      waypoints: [
        { id: 'w01', title: 'Piazza del Popolo' },
        { id: 'w02', title: 'Ara Pacis' },
      ],
      transits: [],
    }),
    getWaypoint: (_m, id) =>
      id === 'w01'
        ? { id: 'w01', title: 'Piazza del Popolo' }
        : id === 'w02'
          ? { id: 'w02', title: 'Ara Pacis' }
          : null,
  }
})

vi.mock('../../../state/journey.js', async () => {
  const actual = await vi.importActual('../../../state/journey.js')
  return {
    ...actual,
    getJourneySnapshot: () => ({
      state: 'walking',
      context: {
        path: 'a',
        currentSequenceIndex: 0,
        promotedOptionalIds: [],
      },
    }),
  }
})

// Stable mock for family context — tests set `familyState.current`
const familyState = { current: null }
vi.mock('../FamilyWalkContext.jsx', () => ({
  useOptionalFamilyWalk: () => familyState.current,
}))

function Probe({ onReady }) {
  const guard = useSharedWalkGuard()
  return (
    <div>
      <button
        type="button"
        data-testid="jump-same"
        onClick={() =>
          void guard.requestJumpToWaypoint({}, 'w01', {}, 'walking').then((ok) => onReady?.(ok))
        }
      >
        Same stop
      </button>
      <button
        type="button"
        data-testid="jump-other"
        onClick={() =>
          void guard.requestJumpToWaypoint({}, 'w02', {}, 'walking').then((ok) => onReady?.(ok))
        }
      >
        Other stop
      </button>
      <button
        type="button"
        data-testid="rejoin"
        onClick={() => void guard.requestRejoinSharedWalk().then((next) => onReady?.(next))}
      >
        Rejoin
      </button>
      <span data-testid="guard-flag">{String(guard.shouldGuardStopChange('w02'))}</span>
    </div>
  )
}

function mount(onReady = vi.fn()) {
  return render(
    <SharedWalkGuardProvider>
      <Probe onReady={onReady} />
    </SharedWalkGuardProvider>,
  )
}

describe('SharedWalkGuardContext', () => {
  beforeEach(() => {
    jumpToWaypointInJourney.mockClear()
    jumpToWaypointInJourney.mockReturnValue(true)
    familyState.current = null
  })

  it('does not warn when destination matches the group stop', async () => {
    const onReady = vi.fn()
    familyState.current = {
      isLeader: false,
      isWalkingIndependently: false,
      syncEnabled: true,
      session: { id: 's1', waypointId: 'w01', syncEnabled: true, syncParticipation: 'synced' },
      detachFromSharedWalk: vi.fn(),
      rejoinSharedWalk: vi.fn(),
    }
    mount(onReady)
    // Different stop would be guarded; same-stop jump below must not warn.
    expect(screen.getByTestId('guard-flag')).toHaveTextContent('true')
    fireEvent.click(screen.getByTestId('jump-same'))
    await waitFor(() => expect(onReady).toHaveBeenCalledWith(true))
    expect(jumpToWaypointInJourney).toHaveBeenCalled()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(familyState.current.detachFromSharedWalk).not.toHaveBeenCalled()
  })

  it('does not warn for the leader', async () => {
    const onReady = vi.fn()
    familyState.current = {
      isLeader: true,
      isWalkingIndependently: false,
      syncEnabled: true,
      session: { id: 's1', waypointId: 'w01', syncEnabled: true },
      detachFromSharedWalk: vi.fn(),
    }
    mount(onReady)
    fireEvent.click(screen.getByTestId('jump-other'))
    await waitFor(() => expect(onReady).toHaveBeenCalledWith(true))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(familyState.current.detachFromSharedWalk).not.toHaveBeenCalled()
  })

  it('does not warn when already walking independently', async () => {
    const onReady = vi.fn()
    familyState.current = {
      isLeader: false,
      isWalkingIndependently: true,
      syncEnabled: false,
      session: {
        id: 's1',
        waypointId: 'w01',
        syncEnabled: true,
        syncParticipation: 'independent',
      },
      detachFromSharedWalk: vi.fn(),
    }
    mount(onReady)
    fireEvent.click(screen.getByTestId('jump-other'))
    await waitFor(() => expect(onReady).toHaveBeenCalledWith(true))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('warns when a synced follower selects a different stop', async () => {
    familyState.current = {
      isLeader: false,
      isWalkingIndependently: false,
      syncEnabled: true,
      session: { id: 's1', waypointId: 'w01', syncEnabled: true, syncParticipation: 'synced' },
      detachFromSharedWalk: vi.fn(async () => ({
        id: 's1',
        waypointId: 'w01',
        syncParticipation: 'independent',
      })),
      rejoinSharedWalk: vi.fn(),
    }
    mount()
    fireEvent.click(screen.getByTestId('jump-other'))
    expect(await screen.findByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByText('Leave the shared walk?')).toBeInTheDocument()
    expect(screen.getByText(/Piazza del Popolo/)).toBeInTheDocument()
    expect(screen.getByText(/Ara Pacis/)).toBeInTheDocument()
    expect(jumpToWaypointInJourney).not.toHaveBeenCalled()
  })

  it('Stay with group closes without navigating or detaching', async () => {
    const onReady = vi.fn()
    familyState.current = {
      isLeader: false,
      isWalkingIndependently: false,
      syncEnabled: true,
      session: { id: 's1', waypointId: 'w01', syncEnabled: true, syncParticipation: 'synced' },
      detachFromSharedWalk: vi.fn(),
    }
    mount(onReady)
    fireEvent.click(screen.getByTestId('jump-other'))
    fireEvent.click(await screen.findByRole('button', { name: 'Stay with group' }))
    await waitFor(() => expect(onReady).toHaveBeenCalledWith(false))
    expect(familyState.current.detachFromSharedWalk).not.toHaveBeenCalled()
    expect(jumpToWaypointInJourney).not.toHaveBeenCalled()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('failed detach does not navigate', async () => {
    familyState.current = {
      isLeader: false,
      isWalkingIndependently: false,
      syncEnabled: true,
      session: { id: 's1', waypointId: 'w01', syncEnabled: true, syncParticipation: 'synced' },
      detachFromSharedWalk: vi.fn(async () => {
        const err = new Error('detach_failed')
        err.code = 'detach_failed'
        throw err
      }),
    }
    mount()
    fireEvent.click(screen.getByTestId('jump-other'))
    fireEvent.click(await screen.findByRole('button', { name: 'Continue on my own' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/Could not leave shared syncing/)
    expect(jumpToWaypointInJourney).not.toHaveBeenCalled()
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
  })

  it('Continue on my own detaches then navigates', async () => {
    const onReady = vi.fn()
    const detachFromSharedWalk = vi.fn(async () => ({
      id: 's1',
      waypointId: 'w01',
      syncParticipation: 'independent',
    }))
    familyState.current = {
      isLeader: false,
      isWalkingIndependently: false,
      syncEnabled: true,
      session: { id: 's1', waypointId: 'w01', syncEnabled: true, syncParticipation: 'synced' },
      detachFromSharedWalk,
    }
    mount(onReady)
    fireEvent.click(screen.getByTestId('jump-other'))
    fireEvent.click(await screen.findByRole('button', { name: 'Continue on my own' }))
    await waitFor(() => expect(detachFromSharedWalk).toHaveBeenCalled())
    await waitFor(() => expect(jumpToWaypointInJourney).toHaveBeenCalled())
    await waitFor(() => expect(onReady).toHaveBeenCalledWith(true))
    expect(detachFromSharedWalk.mock.invocationCallOrder[0]).toBeLessThan(
      jumpToWaypointInJourney.mock.invocationCallOrder[0],
    )
  })

  it('rejoin confirmation names the leader stop when diverged', async () => {
    const rejoinSharedWalk = vi.fn(async () => ({
      id: 's1',
      waypointId: 'w01',
      syncParticipation: 'synced',
    }))
    familyState.current = {
      isLeader: false,
      isWalkingIndependently: true,
      syncEnabled: false,
      session: {
        id: 's1',
        waypointId: 'w01',
        syncEnabled: true,
        syncParticipation: 'independent',
      },
      rejoinSharedWalk,
      detachFromSharedWalk: vi.fn(),
    }

    // Local stop mocked as sequence index 0 → treat as different from leader for dialog:
    // getJourneySnapshot returns index 0; getStepIdAtIndex from real manifest may not be w02.
    // Force guard by making leader stop differ and local stop resolve differently via mock already.
    // With empty path sequence, currentJourneyStepId may be null → alreadyWithGroup is false when leaderStop set.
    mount()
    fireEvent.click(screen.getByTestId('rejoin'))
    expect(await screen.findByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByText('Rejoin your group?')).toBeInTheDocument()
    expect(screen.getByText(/Piazza del Popolo/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Not now' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(rejoinSharedWalk).not.toHaveBeenCalled()
  })

  it('Rejoin group restores participation and jumps to leader stop', async () => {
    const onReady = vi.fn()
    const rejoinSharedWalk = vi.fn(async () => ({
      id: 's1',
      waypointId: 'w01',
      syncParticipation: 'synced',
    }))
    familyState.current = {
      isLeader: false,
      isWalkingIndependently: true,
      syncEnabled: false,
      session: {
        id: 's1',
        waypointId: 'w01',
        syncEnabled: true,
        syncParticipation: 'independent',
      },
      rejoinSharedWalk,
    }
    mount(onReady)
    fireEvent.click(screen.getByTestId('rejoin'))
    fireEvent.click(await screen.findByRole('button', { name: 'Rejoin group' }))
    await waitFor(() => expect(rejoinSharedWalk).toHaveBeenCalled())
    await waitFor(() =>
      expect(jumpToWaypointInJourney).toHaveBeenCalledWith(
        expect.anything(),
        'w01',
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ targetState: 'walking' }),
      ),
    )
  })
})
