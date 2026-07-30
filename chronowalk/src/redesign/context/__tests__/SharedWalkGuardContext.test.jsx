import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { SharedWalkGuardProvider, useSharedWalkGuard } from '../SharedWalkGuardContext.jsx'

const jumpToWaypointInJourney = vi.fn(() => true)
const getStepIdAtIndex = vi.fn(() => 'w01')

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
      journey: { sequences: { a: ['w01', 'w02', 't01'] } },
    }),
    getWaypoint: (_m, id) =>
      id === 'w01'
        ? { id: 'w01', title: 'Piazza del Popolo' }
        : id === 'w02'
          ? { id: 'w02', title: 'Ara Pacis' }
          : null,
    getStepIdAtIndex: (...args) => getStepIdAtIndex(...args),
  }
})

vi.mock('../../../state/journey.js', async () => {
  const actual = await vi.importActual('../../../state/journey.js')
  return {
    ...actual,
    getJourneySnapshot: () => ({
      state: 'story',
      context: {
        path: 'a',
        currentSequenceIndex: 0,
        promotedOptionalIds: [],
      },
    }),
  }
})

// Stable mock for family context - tests set `familyState.current`
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
        data-testid="advance-other"
        onClick={() =>
          void guard
            .requestAdvanceToWaypoint('w02', () => {
              onReady?.('advanced')
              return true
            })
            .then((ok) => {
              if (ok !== true) onReady?.(ok)
            })
        }
      >
        Advance other
      </button>
      <button
        type="button"
        data-testid="rejoin"
        onClick={() => void guard.requestRejoinSharedWalk().then((next) => onReady?.(next))}
      >
        Rejoin
      </button>
      <span data-testid="guard-flag">{String(guard.shouldGuardStopChange('w02'))}</span>
      <span data-testid="guard-same">{String(guard.shouldGuardStopChange('w01'))}</span>
      <span data-testid="unresolved">{String(guard.isFollowerSessionUnresolved)}</span>
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

function syncedFollower(overrides = {}) {
  return {
    isLeader: false,
    isOrganizer: false,
    isMember: true,
    hasBundleAccess: true,
    busy: false,
    isWalkingIndependently: false,
    syncEnabled: true,
    session: {
      id: 's1',
      waypointId: 'w01',
      syncEnabled: true,
      syncParticipation: 'synced',
      mySeatId: 'seat-2',
      leaderSeatId: 'seat-1',
    },
    detachFromSharedWalk: vi.fn(async () => ({
      id: 's1',
      waypointId: 'w01',
      syncParticipation: 'independent',
      mySeatId: 'seat-2',
      leaderSeatId: 'seat-1',
    })),
    rejoinSharedWalk: vi.fn(),
    ...overrides,
  }
}

describe('SharedWalkGuardContext', () => {
  beforeEach(() => {
    jumpToWaypointInJourney.mockClear()
    jumpToWaypointInJourney.mockReturnValue(true)
    getStepIdAtIndex.mockClear()
    getStepIdAtIndex.mockReturnValue('w01')
    familyState.current = null
  })

  it('does not warn when destination matches the group stop', async () => {
    const onReady = vi.fn()
    familyState.current = syncedFollower()
    mount(onReady)
    expect(screen.getByTestId('guard-flag')).toHaveTextContent('true')
    expect(screen.getByTestId('guard-same')).toHaveTextContent('false')
    fireEvent.click(screen.getByTestId('jump-same'))
    await waitFor(() => expect(onReady).toHaveBeenCalledWith(true))
    expect(jumpToWaypointInJourney).toHaveBeenCalled()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(familyState.current.detachFromSharedWalk).not.toHaveBeenCalled()
  })

  it('does not warn for the leader', async () => {
    const onReady = vi.fn()
    familyState.current = syncedFollower({
      isLeader: true,
      isOrganizer: true,
      isMember: false,
      session: {
        id: 's1',
        waypointId: 'w01',
        syncEnabled: true,
        syncParticipation: 'synced',
        mySeatId: 'seat-1',
        leaderSeatId: 'seat-1',
      },
    })
    mount(onReady)
    fireEvent.click(screen.getByTestId('jump-other'))
    await waitFor(() => expect(onReady).toHaveBeenCalledWith(true))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(familyState.current.detachFromSharedWalk).not.toHaveBeenCalled()
  })

  it('does not warn when already walking independently', async () => {
    const onReady = vi.fn()
    familyState.current = syncedFollower({
      isWalkingIndependently: true,
      syncEnabled: false,
      session: {
        id: 's1',
        waypointId: 'w01',
        syncEnabled: true,
        syncParticipation: 'independent',
        mySeatId: 'seat-2',
        leaderSeatId: 'seat-1',
      },
    })
    mount(onReady)
    fireEvent.click(screen.getByTestId('jump-other'))
    await waitFor(() => expect(onReady).toHaveBeenCalledWith(true))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('warns when a synced follower selects a different stop', async () => {
    familyState.current = syncedFollower()
    mount()
    fireEvent.click(screen.getByTestId('jump-other'))
    expect(await screen.findByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByText('Leave the shared walk?')).toBeInTheDocument()
    expect(screen.getByText(/Piazza del Popolo/)).toBeInTheDocument()
    expect(screen.getByText(/Ara Pacis/)).toBeInTheDocument()
    expect(jumpToWaypointInJourney).not.toHaveBeenCalled()
  })

  it('JourneyShell-style advance warns before navigation when follower leaves group stop', async () => {
    const onReady = vi.fn()
    familyState.current = syncedFollower()
    mount(onReady)
    fireEvent.click(screen.getByTestId('advance-other'))
    expect(await screen.findByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByText('Leave the shared walk?')).toBeInTheDocument()
    expect(onReady).not.toHaveBeenCalledWith('advanced')
    expect(familyState.current.detachFromSharedWalk).not.toHaveBeenCalled()
  })

  it('fail-closes when session waypointId is still null (local stop fallback)', async () => {
    // Production race: pause/resume works before leader clock publishes waypointId.
    // Path A is w01→w02 consecutive - Continue must still warn.
    getStepIdAtIndex.mockReturnValue('w01')
    familyState.current = syncedFollower({
      session: {
        id: 's1',
        waypointId: null,
        syncEnabled: true,
        syncParticipation: 'synced',
        mySeatId: 'seat-2',
        leaderSeatId: 'seat-1',
      },
    })
    mount()
    expect(screen.getByTestId('guard-flag')).toHaveTextContent('true')
    fireEvent.click(screen.getByTestId('advance-other'))
    expect(await screen.findByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByText('Leave the shared walk?')).toBeInTheDocument()
  })

  it('Stay with group closes without navigating or detaching', async () => {
    const onReady = vi.fn()
    familyState.current = syncedFollower()
    mount(onReady)
    fireEvent.click(screen.getByTestId('jump-other'))
    fireEvent.click(await screen.findByRole('button', { name: 'Stay with group' }))
    await waitFor(() => expect(onReady).toHaveBeenCalledWith(false))
    expect(familyState.current.detachFromSharedWalk).not.toHaveBeenCalled()
    expect(jumpToWaypointInJourney).not.toHaveBeenCalled()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('failed detach does not navigate', async () => {
    familyState.current = syncedFollower({
      detachFromSharedWalk: vi.fn(async () => {
        const err = new Error('detach_failed')
        err.code = 'detach_failed'
        throw err
      }),
    })
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
      mySeatId: 'seat-2',
      leaderSeatId: 'seat-1',
    }))
    familyState.current = syncedFollower({ detachFromSharedWalk })
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

  it('advance Continue on my own detaches only then runs execute', async () => {
    const onReady = vi.fn()
    const detachFromSharedWalk = vi.fn(async () => ({
      id: 's1',
      waypointId: 'w01',
      syncParticipation: 'independent',
      mySeatId: 'seat-2',
      leaderSeatId: 'seat-1',
    }))
    familyState.current = syncedFollower({ detachFromSharedWalk })
    mount(onReady)
    fireEvent.click(screen.getByTestId('advance-other'))
    fireEvent.click(await screen.findByRole('button', { name: 'Continue on my own' }))
    await waitFor(() => expect(detachFromSharedWalk).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(onReady).toHaveBeenCalledWith('advanced'))
    expect(detachFromSharedWalk.mock.invocationCallOrder[0]).toBeLessThan(
      onReady.mock.invocationCallOrder.find((n, i) => onReady.mock.calls[i]?.[0] === 'advanced') ??
        Infinity,
    )
  })

  it('blocks follower navigation while session/role is still resolving', async () => {
    const onReady = vi.fn()
    familyState.current = {
      isLeader: false,
      isOrganizer: false,
      isMember: true,
      hasBundleAccess: true,
      busy: true,
      isWalkingIndependently: false,
      syncEnabled: false,
      session: null,
      detachFromSharedWalk: vi.fn(),
    }
    mount(onReady)
    expect(screen.getByTestId('unresolved')).toHaveTextContent('true')
    fireEvent.click(screen.getByTestId('advance-other'))
    expect(await screen.findByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByText('Checking shared walk…')).toBeInTheDocument()
    expect(onReady).not.toHaveBeenCalledWith('advanced')
    fireEvent.click(screen.getByRole('button', { name: 'Stay here' }))
    await waitFor(() => expect(onReady).toHaveBeenCalledWith(false))
    expect(familyState.current.detachFromSharedWalk).not.toHaveBeenCalled()
  })

  it('rejoin confirmation names the leader stop when diverged', async () => {
    const rejoinSharedWalk = vi.fn(async () => ({
      id: 's1',
      waypointId: 'w01',
      syncParticipation: 'synced',
    }))
    familyState.current = syncedFollower({
      isWalkingIndependently: true,
      syncEnabled: false,
      session: {
        id: 's1',
        waypointId: 'w01',
        syncEnabled: true,
        syncParticipation: 'independent',
        mySeatId: 'seat-2',
        leaderSeatId: 'seat-1',
      },
      rejoinSharedWalk,
    })
    // Local stop differs from leader stop so rejoin confirms.
    getStepIdAtIndex.mockReturnValue('w02')
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
    familyState.current = syncedFollower({
      isWalkingIndependently: true,
      syncEnabled: false,
      session: {
        id: 's1',
        waypointId: 'w01',
        syncEnabled: true,
        syncParticipation: 'independent',
        mySeatId: 'seat-2',
        leaderSeatId: 'seat-1',
      },
      rejoinSharedWalk,
    })
    getStepIdAtIndex.mockReturnValue('w02')
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
