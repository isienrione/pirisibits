import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import JourneyShell from '../JourneyShell.jsx'
import { SettingsSheetProvider } from '../../../redesign/context/SettingsSheetContext.jsx'
import { SharedWalkGuardProvider } from '../../../redesign/context/SharedWalkGuardContext.jsx'
import {
  beginJourney,
  resetJourney,
  transitionJourney,
  getJourneySnapshot,
  JOURNEY_STATES,
} from '../../../state/journey.js'

const playWaypointMock = vi.fn().mockResolvedValue(true)

const audioMock = vi.hoisted(() => ({
  narrationPlaying: false,
  ready: true,
  progress: {
    currentTime: 0,
    duration: 0,
    chapterIndex: 0,
    chapterCount: 1,
    itemIndex: 0,
    itemCount: 1,
    playing: false,
    paused: false,
  },
}))

vi.mock('../../../hooks/useAudioEngine.js', () => ({
  useAudioEngine: () => ({
    ready: audioMock.ready,
    get narrationPlaying() {
      return audioMock.narrationPlaying
    },
    playbackInterrupted: false,
    get progress() {
      return audioMock.progress
    },
    playbackRate: 1,
    setPlaybackRate: vi.fn(),
    narrationEnded: { nonce: 0, kind: null, id: null },
    unlock: vi.fn().mockResolvedValue(true),
    primeForGesture: vi.fn(),
    playWaypoint: playWaypointMock,
    playTransit: vi.fn().mockResolvedValue(undefined),
    playResumeCue: vi.fn().mockResolvedValue(undefined),
    playArrivalChime: vi.fn().mockResolvedValue(true),
    cancelArrivalChime: vi.fn(),
    playCompletionChime: vi.fn().mockResolvedValue(undefined),
    endTransit: vi.fn(),
    stopNarration: vi.fn(),
    resumePlayback: vi.fn().mockResolvedValue(undefined),
    pauseNarration: vi.fn(),
    resumeNarration: vi.fn(),
    toggleNarration: vi.fn(),
    seekNarration: vi.fn(),
    skipNarration: vi.fn(),
    jumpToChapter: vi.fn(),
    setPath: vi.fn(),
    getActiveStopId: () => null,
  }),
}))

vi.mock('../../../hooks/useJourneyGeo.js', () => ({
  useJourneyGeo: () => ({
    distance: 120,
    insideGeofence: false,
    approachingGeofence: false,
    state: 'TRANSIT',
    locationStatus: 'granted',
    position: { lat: 41.8902, lng: 12.4922 },
    retryLocation: vi.fn(),
  }),
}))

vi.mock('../../../hooks/useOfflineAudio.js', () => ({
  useOfflineAudio: () => ({
    isReady: false,
    isDownloading: false,
    progress: null,
    error: null,
    startDownload: vi.fn(),
  }),
}))

vi.mock('../../../lib/track.js', () => ({
  track: vi.fn(),
  getAnalyticsConsent: vi.fn(() => null),
  setAnalyticsConsent: vi.fn(),
  subscribeAnalyticsConsent: vi.fn(() => () => {}),
  TRACK_EVENTS: {
    WAYPOINT_ARRIVED: 'waypoint_arrived',
    STORY_COMPLETE: 'story_complete',
    OPTIONAL_WAYPOINT_PROMOTED: 'optional_waypoint_promoted',
    RESUME: 'resume',
    DAY_COMPLETE: 'day_complete',
    PAUSE: 'pause',
    TRANSCRIPT_OPEN: 'transcript_open',
    GPS_FALLBACK_USED: 'gps_fallback_used',
    THRESHOLD_HOLD: 'threshold_hold',
  },
}))

const familyState = vi.hoisted(() => ({ current: null }))

vi.mock('../../../redesign/context/FamilyWalkContext.jsx', async () => {
  const actual = await vi.importActual('../../../redesign/context/FamilyWalkContext.jsx')
  return {
    ...actual,
    useOptionalFamilyWalk: () => familyState.current,
    useFamilyWalkContext: () => familyState.current,
  }
})

function syncedFollower(overrides = {}) {
  return {
    isLeader: false,
    isOrganizer: false,
    isMember: true,
    hasBundleAccess: true,
    busy: false,
    isWalkingIndependently: false,
    syncEnabled: true,
    isActivelySynced: true,
    session: {
      id: 's1',
      joinCode: 'ABCDE',
      waypointId: 'w01',
      syncEnabled: true,
      syncParticipation: 'synced',
      mySeatId: 'seat-2',
      leaderSeatId: 'seat-1',
      resumePolicy: 'leader',
      updatedAt: new Date().toISOString(),
    },
    detachFromSharedWalk: vi.fn(async () => ({
      id: 's1',
      waypointId: 'w01',
      syncParticipation: 'independent',
      mySeatId: 'seat-2',
      leaderSeatId: 'seat-1',
    })),
    rejoinSharedWalk: vi.fn(),
    setSyncEnabled: vi.fn(),
    publishClock: vi.fn(),
    publishPause: vi.fn(),
    publishResume: vi.fn(),
    publishSeek: vi.fn(),
    markApplyingRemote: vi.fn(),
    isApplyingRemote: () => false,
    canResumeForAll: false,
    resumePolicy: 'leader',
    ...overrides,
  }
}

function renderGuardedShell() {
  return render(
    <MemoryRouter>
      <SettingsSheetProvider>
        <SharedWalkGuardProvider>
          <JourneyShell variant="redesign" />
        </SharedWalkGuardProvider>
      </SettingsSheetProvider>
    </MemoryRouter>,
  )
}

describe('JourneyShell shared-walk Continue guard', () => {
  beforeEach(() => {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    localStorage.clear()
    resetJourney()
    familyState.current = null
    audioMock.narrationPlaying = false
    audioMock.ready = true
    audioMock.progress = {
      currentTime: 90,
      duration: 100,
      chapterIndex: 0,
      chapterCount: 1,
      itemIndex: 0,
      itemCount: 1,
      playing: false,
      paused: true,
    }
    playWaypointMock.mockClear()
  })

  it('shows leave warning on story Continue when synced follower leaves group stop', async () => {
    familyState.current = syncedFollower()
    beginJourney({ pace: 'classic' })
    transitionJourney(JOURNEY_STATES.STORY, { currentSequenceIndex: 0 })
    renderGuardedShell()

    expect(await screen.findByRole('heading', { name: /the colosseum/i })).toBeInTheDocument()
    const beforeIndex = getJourneySnapshot().context.currentSequenceIndex

    fireEvent.click(screen.getByTestId('story-continue'))

    expect(await screen.findByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByText('Leave the shared walk?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Stay with group' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue on my own' })).toBeInTheDocument()
    expect(getJourneySnapshot().context.currentSequenceIndex).toBe(beforeIndex)
    expect(familyState.current.detachFromSharedWalk).not.toHaveBeenCalled()
  })

  it('Stay with group keeps the follower on the shared stop', async () => {
    familyState.current = syncedFollower()
    beginJourney({ pace: 'classic' })
    transitionJourney(JOURNEY_STATES.STORY, { currentSequenceIndex: 0 })
    renderGuardedShell()

    await screen.findByRole('heading', { name: /the colosseum/i })
    const beforeIndex = getJourneySnapshot().context.currentSequenceIndex
    fireEvent.click(screen.getByTestId('story-continue'))
    fireEvent.click(await screen.findByRole('button', { name: 'Stay with group' }))

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(getJourneySnapshot().context.currentSequenceIndex).toBe(beforeIndex)
    expect(getJourneySnapshot().state).toBe(JOURNEY_STATES.STORY)
    expect(familyState.current.detachFromSharedWalk).not.toHaveBeenCalled()
  })

  it('Continue on my own detaches then advances the JourneyShell sequence', async () => {
    familyState.current = syncedFollower()
    beginJourney({ pace: 'classic' })
    transitionJourney(JOURNEY_STATES.STORY, { currentSequenceIndex: 0 })
    renderGuardedShell()

    await screen.findByRole('heading', { name: /the colosseum/i })
    fireEvent.click(screen.getByTestId('story-continue'))
    fireEvent.click(await screen.findByRole('button', { name: 'Continue on my own' }))

    await waitFor(() => expect(familyState.current.detachFromSharedWalk).toHaveBeenCalledTimes(1))
    await waitFor(() =>
      expect(getJourneySnapshot().context.currentSequenceIndex).toBeGreaterThan(0),
    )
  })

  it('still warns when session waypointId is null (leader clock not yet published)', async () => {
    familyState.current = syncedFollower({
      session: {
        id: 's1',
        joinCode: 'ABCDE',
        waypointId: null,
        syncEnabled: true,
        syncParticipation: 'synced',
        mySeatId: 'seat-2',
        leaderSeatId: 'seat-1',
        resumePolicy: 'leader',
        updatedAt: new Date().toISOString(),
      },
    })
    beginJourney({ pace: 'classic' })
    transitionJourney(JOURNEY_STATES.STORY, { currentSequenceIndex: 0 })
    renderGuardedShell()

    await screen.findByRole('heading', { name: /the colosseum/i })
    const beforeIndex = getJourneySnapshot().context.currentSequenceIndex
    fireEvent.click(screen.getByTestId('story-continue'))

    expect(await screen.findByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByText('Leave the shared walk?')).toBeInTheDocument()
    expect(getJourneySnapshot().context.currentSequenceIndex).toBe(beforeIndex)
  })

  it('does not warn the leader on story Continue', async () => {
    familyState.current = syncedFollower({
      isLeader: true,
      isOrganizer: true,
      isMember: false,
      canResumeForAll: true,
      session: {
        id: 's1',
        joinCode: 'ABCDE',
        waypointId: 'w01',
        syncEnabled: true,
        syncParticipation: 'synced',
        mySeatId: 'seat-1',
        leaderSeatId: 'seat-1',
        resumePolicy: 'leader',
        updatedAt: new Date().toISOString(),
      },
    })
    beginJourney({ pace: 'classic' })
    transitionJourney(JOURNEY_STATES.STORY, { currentSequenceIndex: 0 })
    renderGuardedShell()

    await screen.findByRole('heading', { name: /the colosseum/i })
    fireEvent.click(screen.getByTestId('story-continue'))

    await waitFor(() =>
      expect(getJourneySnapshot().context.currentSequenceIndex).toBeGreaterThan(0),
    )
    expect(screen.queryByText('Leave the shared walk?')).not.toBeInTheDocument()
    expect(familyState.current.detachFromSharedWalk).not.toHaveBeenCalled()
  })

  it('keeps follower Waiting-for-leader WalkSyncBar above the eligible next-step CTA', async () => {
    familyState.current = syncedFollower()
    beginJourney({ pace: 'classic' })
    transitionJourney(JOURNEY_STATES.STORY, { currentSequenceIndex: 0 })
    renderGuardedShell()

    expect(await screen.findByTestId('immersive-action-stack')).toBeInTheDocument()
    const stack = screen.getByTestId('immersive-action-stack')
    const sync = within(stack).getByTestId('walk-sync-bar')
    const cta = within(stack).getByTestId('story-continue')
    expect(within(sync).getByTestId('sync-resume-all')).toHaveTextContent(/waiting for leader/i)
    expect(sync.compareDocumentPosition(cta) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(stack.className).toContain('cw-waypoint-immersive__action-stack')
    expect(screen.getByTestId('waypoint-immersive').lastElementChild).toBe(stack)
  })

  it('keeps organizer WalkSyncBar and next-step CTA in separate in-flow regions', async () => {
    familyState.current = syncedFollower({
      isLeader: true,
      isOrganizer: true,
      isMember: false,
      canResumeForAll: true,
      session: {
        id: 's1',
        joinCode: 'ABCDE',
        waypointId: 'w01',
        syncEnabled: true,
        syncParticipation: 'synced',
        mySeatId: 'seat-1',
        leaderSeatId: 'seat-1',
        resumePolicy: 'leader',
        updatedAt: new Date().toISOString(),
      },
    })
    beginJourney({ pace: 'classic' })
    transitionJourney(JOURNEY_STATES.STORY, { currentSequenceIndex: 0 })
    renderGuardedShell()

    const stack = await screen.findByTestId('immersive-action-stack')
    expect(within(stack).getByTestId('walk-sync-bar')).toBeInTheDocument()
    expect(within(stack).getByTestId('story-continue')).toBeInTheDocument()
    expect(within(stack).getByRole('button', { name: /sync on/i })).toBeInTheDocument()
  })

  it('routes independent follower Continue through the shared-walk leave guard', async () => {
    familyState.current = syncedFollower({
      isWalkingIndependently: true,
      syncEnabled: false,
      isActivelySynced: false,
      session: {
        id: 's1',
        joinCode: 'ABCDE',
        waypointId: 'w01',
        syncEnabled: true,
        syncParticipation: 'independent',
        mySeatId: 'seat-2',
        leaderSeatId: 'seat-1',
        resumePolicy: 'leader',
        updatedAt: new Date().toISOString(),
      },
    })
    beginJourney({ pace: 'classic' })
    transitionJourney(JOURNEY_STATES.STORY, { currentSequenceIndex: 0 })
    renderGuardedShell()

    await screen.findByRole('heading', { name: /the colosseum/i })
    expect(screen.getByTestId('walk-sync-bar')).toHaveAttribute('data-walking-independently', 'true')
    fireEvent.click(screen.getByTestId('story-continue'))
    // Independent walkers already left the shared stop path - guard should not block.
    await waitFor(() =>
      expect(getJourneySnapshot().context.currentSequenceIndex).toBeGreaterThan(0),
    )
  })
})
