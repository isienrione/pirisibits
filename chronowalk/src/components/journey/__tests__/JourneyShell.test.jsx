import { describe, expect, it, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import JourneyShell from '../JourneyShell.jsx'
import { SettingsSheetProvider } from '../../../redesign/context/SettingsSheetContext.jsx'
import {
  beginJourney,
  resetJourney,
  transitionJourney,
  getJourneySnapshot,
  JOURNEY_STATES,
} from '../../../state/journey.js'

const playWaypointMock = vi.fn().mockResolvedValue(undefined)
const playTransitMock = vi.fn().mockResolvedValue(undefined)
const unlockMock = vi.fn().mockResolvedValue(true)

const audioMock = vi.hoisted(() => ({
  narrationPlaying: false,
}))

vi.mock('../../../hooks/useAudioEngine.js', () => ({
  useAudioEngine: () => ({
    ready: true,
    get narrationPlaying() {
      return audioMock.narrationPlaying
    },
    playbackInterrupted: false,
    progress: {
      currentTime: 0,
      duration: 0,
      chapterIndex: 0,
      chapterCount: 0,
      itemIndex: 0,
      itemCount: 0,
      playing: false,
      paused: false,
    },
    playbackRate: 1,
    setPlaybackRate: vi.fn(),
    narrationEnded: { nonce: 0, kind: null, id: null },
    unlock: unlockMock,
    playWaypoint: playWaypointMock,
    playTransit: playTransitMock,
    playResumeCue: vi.fn().mockResolvedValue(undefined),
    playArrivalChime: vi.fn().mockResolvedValue(undefined),
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

vi.mock('../../../lib/track.js', () => ({
  track: vi.fn(),
  TRACK_EVENTS: {
    WAYPOINT_ARRIVED: 'waypoint_arrived',
    STORY_COMPLETE: 'story_complete',
    OPTIONAL_WAYPOINT_PROMOTED: 'optional_waypoint_promoted',
    RESUME: 'resume',
    DAY_COMPLETE: 'day_complete',
    PAUSE: 'pause',
    TRANSCRIPT_OPEN: 'transcript_open',
  },
}))

function renderShell(props = {}) {
  return render(
    <MemoryRouter>
      <SettingsSheetProvider>
        <JourneyShell {...props} />
      </SettingsSheetProvider>
    </MemoryRouter>
  )
}

const PAUSE_SEQUENCE_INDEX = 10

describe('JourneyShell', () => {
  beforeEach(() => {
    global.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    localStorage.clear()
    resetJourney()
    audioMock.narrationPlaying = false
    playWaypointMock.mockClear()
    playTransitMock.mockClear()
    unlockMock.mockClear()
  })

  it('redirects idle travelers to begin', () => {
    renderShell()
    expect(screen.queryByText(/ready when you are/i)).not.toBeInTheDocument()
  })

  it('shows walking UI for the first waypoint', async () => {
    beginJourney({ pace: 'classic' })
    renderShell()

    expect(await screen.findByText('Walking')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /the colosseum/i })).toBeInTheDocument()
  })

  it('shows redesign walking UI for the first waypoint', async () => {
    beginJourney({ pace: 'classic' })
    renderShell({ variant: 'redesign' })

    expect(await screen.findByText(/walking to/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /the colosseum/i })).toBeInTheDocument()
    expect(screen.queryByText('GUIDE')).not.toBeInTheDocument()
    expect(screen.queryByText('MAP')).not.toBeInTheDocument()
  })

  it('shows path choice at t01 before path is locked', async () => {
    beginJourney({ pace: 'classic' })
    transitionJourney(JOURNEY_STATES.WALKING, { currentSequenceIndex: 2, pathLocked: false })
    renderShell()

    expect(await screen.findByRole('heading', { name: /two doors into ancient rome/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /through the forum gate/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /up the palatine/i })).toBeInTheDocument()
  })

  it('moves from arrival to story', async () => {
    beginJourney({ pace: 'classic' })
    transitionJourney(JOURNEY_STATES.ARRIVED, { currentSequenceIndex: 0 })
    renderShell()

    expect(await screen.findByRole('button', { name: /begin story/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /begin story/i }))
    expect(screen.getByRole('button', { name: /step through the threshold/i })).toBeInTheDocument()
  })

  it('shows scripted rest arrival copy at the Forum pause stop', async () => {
    beginJourney({ pace: 'classic' })
    transitionJourney(JOURNEY_STATES.ARRIVED, { currentSequenceIndex: PAUSE_SEQUENCE_INDEX })
    renderShell()

    expect(await screen.findByRole('heading', { name: /forum rest/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /begin rest/i })).toBeInTheDocument()
  })

  it('enters scripted rest after pause narration ends', async () => {
    audioMock.narrationPlaying = true
    beginJourney({ pace: 'classic' })
    transitionJourney(JOURNEY_STATES.STORY, { currentSequenceIndex: PAUSE_SEQUENCE_INDEX })

    const view = renderShell()
    expect(await screen.findByText(/listen/i)).toBeInTheDocument()

    audioMock.narrationPlaying = false
    view.rerender(
      <MemoryRouter>
        <SettingsSheetProvider>
          <JourneyShell />
        </SettingsSheetProvider>
      </MemoryRouter>
    )

    expect(await screen.findByText(/find shade/i)).toBeInTheDocument()
    expect(getJourneySnapshot().state).toBe(JOURNEY_STATES.PAUSED)
  })

  it('shows classic day complete and continues to act V', async () => {
    beginJourney({ pace: 'classic', path: 'a' })
    transitionJourney(JOURNEY_STATES.DAY_COMPLETE, {
      currentSequenceIndex: 17,
      completedWaypointIds: ['w14'],
    })
    renderShell()

    expect(await screen.findByText(/day complete/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /the ancient city rests/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /continue to the living city/i }))

    const snap = getJourneySnapshot()
    expect(snap.state).toBe(JOURNEY_STATES.WALKING)
    expect(snap.context.currentSequenceIndex).toBe(18)
  })

  it('resumes scripted Forum rest and advances to transit', async () => {
    beginJourney({ pace: 'classic' })
    transitionJourney(JOURNEY_STATES.PAUSED, { currentSequenceIndex: PAUSE_SEQUENCE_INDEX })
    renderShell()

    expect(await screen.findByRole('heading', { name: /forum rest/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /resume walking/i }))

    const snap = getJourneySnapshot()
    expect(snap.state).toBe(JOURNEY_STATES.WALKING)
    expect(snap.context.currentSequenceIndex).toBe(PAUSE_SEQUENCE_INDEX + 1)
    expect(snap.context.completedWaypointIds).toContain('pause')
  })
})
