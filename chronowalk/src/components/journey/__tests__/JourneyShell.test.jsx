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
  completeStoryAfterThreshold,
  JOURNEY_STATES,
} from '../../../state/journey.js'
import { loadRomeManifest } from '../../../content/manifest.js'
import { buildEffectiveSequence } from '../../../content/optionalPromotion.js'

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

  it('redesign auto-starts waypoint narration when story opens', async () => {
    beginJourney({ pace: 'classic' })
    transitionJourney(JOURNEY_STATES.STORY, { currentSequenceIndex: 0 })
    renderShell({ variant: 'redesign' })

    expect(await screen.findByRole('heading', { name: /colosseum exterior/i })).toBeInTheDocument()
    expect(playWaypointMock).toHaveBeenCalledWith('w01')
  })

  it('shows colosseum threshold and continue actions during story', async () => {
    beginJourney({ pace: 'classic' })
    transitionJourney(JOURNEY_STATES.STORY, { currentSequenceIndex: 0 })
    renderShell({ variant: 'redesign' })

    expect(await screen.findByTestId('story-footer')).toBeInTheDocument()
    expect(screen.getByTestId('story-open-threshold')).toBeInTheDocument()
    expect(screen.getByTestId('story-continue')).toBeInTheDocument()
  })

  it('advances from transit when continue walking is tapped', async () => {
    const manifest = loadRomeManifest()
    const t04Index = buildEffectiveSequence(manifest, 'a', []).indexOf('t04')
    expect(t04Index).toBeGreaterThanOrEqual(0)

    beginJourney({ pace: 'classic', path: 'a', pathLocked: true })
    transitionJourney(JOURNEY_STATES.WALKING, { currentSequenceIndex: t04Index })
    renderShell({ variant: 'redesign' })

    const continueBtn = await screen.findByTestId('transit-continue')
    expect(screen.getByText(/read instead/i)).toBeInTheDocument()
    fireEvent.click(continueBtn)

    expect(getJourneySnapshot().context.currentSequenceIndex).toBe(t04Index + 1)
  })

  it('shows t06 Temple of Vesta transit narration panel and script', async () => {
    const manifest = loadRomeManifest()
    const t06Index = buildEffectiveSequence(manifest, 'a', []).indexOf('t06')
    expect(t06Index).toBeGreaterThanOrEqual(0)

    beginJourney({ pace: 'classic', path: 'a', pathLocked: true })
    transitionJourney(JOURNEY_STATES.WALKING, { currentSequenceIndex: t06Index })
    renderShell({ variant: 'redesign' })

    expect(await screen.findByTestId('transit-screen')).toBeInTheDocument()
    expect(screen.getByTestId('transit-audio-panel')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /temple of vesta/i })).toBeInTheDocument()
    expect(screen.getByText(/read instead/i)).toBeInTheDocument()
    expect(screen.getByTestId('transit-continue')).toBeInTheDocument()
    expect(playTransitMock).toHaveBeenCalledWith('t06')
  })

  it('starts t06 transit narration after leaving w07 threshold', async () => {
    const manifest = loadRomeManifest()
    const seq = buildEffectiveSequence(manifest, 'a', [])
    const w07Index = seq.indexOf('w07')
    expect(w07Index).toBeGreaterThanOrEqual(0)
    expect(seq[w07Index + 1]).toBe('t06')

    beginJourney({ pace: 'classic', path: 'a', pathLocked: true })
    transitionJourney(JOURNEY_STATES.THRESHOLD, {
      currentSequenceIndex: w07Index,
      completedWaypointIds: seq.slice(0, w07Index).filter((id) => id.startsWith('w')),
    })
    completeStoryAfterThreshold('w07')

    renderShell({ variant: 'redesign' })

    expect(await screen.findByTestId('transit-audio-panel')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /temple of vesta/i })).toBeInTheDocument()
    expect(screen.getByText(/read instead/i)).toBeInTheDocument()
    expect(playTransitMock).toHaveBeenCalledWith('t06')
  })

  it('shows path choice at t01 before path is locked', async () => {
    beginJourney({ pace: 'classic' })
    transitionJourney(JOURNEY_STATES.WALKING, { currentSequenceIndex: 2, pathLocked: false })
    renderShell({ variant: 'redesign' })

    expect(await screen.findByTestId('path-choice-screen')).toBeInTheDocument()
    expect(screen.getByTestId('path-choice-a')).toBeInTheDocument()
    expect(screen.getByTestId('path-choice-b')).toBeInTheDocument()
    expect(playTransitMock).not.toHaveBeenCalled()
  })

  it('plays chosen path audio when t01 path is selected', async () => {
    beginJourney({ pace: 'classic' })
    transitionJourney(JOURNEY_STATES.WALKING, { currentSequenceIndex: 2, pathLocked: false })
    renderShell({ variant: 'redesign' })

    fireEvent.click(await screen.findByTestId('path-choice-b'))
    expect(playTransitMock).toHaveBeenCalledWith('t01')
    expect(getJourneySnapshot().context.path).toBe('b')
    expect(getJourneySnapshot().context.pathLocked).toBe(true)
  })

  it('does not auto-play t01 after w02 threshold until path is chosen', async () => {
    const manifest = loadRomeManifest()
    const seq = buildEffectiveSequence(manifest, 'a', [])
    const w02Index = seq.indexOf('w02')
    const t01Index = seq.indexOf('t01')
    expect(w02Index).toBeGreaterThanOrEqual(0)
    expect(seq[w02Index + 1]).toBe('t01')

    beginJourney({ pace: 'classic', path: 'a', pathLocked: false })
    transitionJourney(JOURNEY_STATES.THRESHOLD, {
      currentSequenceIndex: w02Index,
      completedWaypointIds: seq.slice(0, w02Index).filter((id) => id.startsWith('w')),
    })
    completeStoryAfterThreshold('w02')
    playTransitMock.mockClear()

    renderShell({ variant: 'redesign' })

    expect(await screen.findByTestId('path-choice-screen')).toBeInTheDocument()
    expect(playTransitMock).not.toHaveBeenCalled()
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
    renderShell({ variant: 'redesign' })

    expect(await screen.findByTestId('pause-screen')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('pause-ready'))

    const snap = getJourneySnapshot()
    expect(snap.state).toBe(JOURNEY_STATES.WALKING)
    expect(snap.context.currentSequenceIndex).toBe(PAUSE_SEQUENCE_INDEX + 1)
    expect(snap.context.completedWaypointIds).toContain('pause')
  })

  it('shows journey complete screen after via appia', async () => {
    const manifest = loadRomeManifest()
    const seq = buildEffectiveSequence(manifest, 'a', [])

    beginJourney({ pace: 'heroic', path: 'a', pathLocked: true })
    transitionJourney(JOURNEY_STATES.COMPLETE, {
      currentSequenceIndex: seq.length,
      completedWaypointIds: seq.filter((id) => id.startsWith('w')),
    })
    renderShell({ variant: 'redesign' })

    expect(await screen.findByTestId('journey-complete-screen')).toBeInTheDocument()
    expect(screen.getByText(/you walked ancient rome/i)).toBeInTheDocument()
    expect(screen.getByTestId('journey-complete-letter')).toBeInTheDocument()
    expect(screen.getByTestId('journey-complete-tour')).toBeInTheDocument()
  })
})
