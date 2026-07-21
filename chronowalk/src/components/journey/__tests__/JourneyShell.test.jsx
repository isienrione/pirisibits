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

const playWaypointMock = vi.fn().mockResolvedValue(true)
const playTransitMock = vi.fn().mockResolvedValue(undefined)
const unlockMock = vi.fn().mockResolvedValue(true)
const jumpToChapterMock = vi.fn()

const audioMock = vi.hoisted(() => ({
  narrationPlaying: false,
  ready: true,
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
    unlock: unlockMock,
    primeForGesture: vi.fn(),
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
    jumpToChapter: jumpToChapterMock,
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

function openTransitFullPlayer(screen) {
  fireEvent.click(
    screen.getByRole('button', { name: /open full narration player/i })
  )
}

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
    audioMock.ready = true
    audioMock.progress = {
      currentTime: 0,
      duration: 0,
      chapterIndex: 0,
      chapterCount: 0,
      itemIndex: 0,
      itemCount: 0,
      playing: false,
      paused: false,
    }
    playWaypointMock.mockClear()
    playTransitMock.mockClear()
    unlockMock.mockClear()
    jumpToChapterMock.mockClear()
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
    expect(screen.getByRole('heading', { level: 1, name: /the colosseum/i })).toBeInTheDocument()
    expect(screen.getByTestId('tour-onboarding-cards')).toHaveAttribute('data-phase', 'walk')
    expect(screen.queryByText('GUIDE')).not.toBeInTheDocument()
    expect(screen.queryByText('MAP')).not.toBeInTheDocument()
  })

  it('shows audio unlock welcome before journey audio starts', async () => {
    audioMock.ready = false
    beginJourney({ pace: 'classic' })
    renderShell({ variant: 'redesign' })

    expect(await screen.findByText(/your rome awaits/i)).toBeInTheDocument()
    expect(screen.getByTestId('tour-route-illustration')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /begin your walk/i })).toBeInTheDocument()
    expect(screen.queryByTestId('tour-route-preview')).not.toBeInTheDocument()
  })

  it('redesign auto-starts waypoint narration when story opens', async () => {
    beginJourney({ pace: 'classic' })
    transitionJourney(JOURNEY_STATES.STORY, { currentSequenceIndex: 0 })
    renderShell({ variant: 'redesign' })

    expect(await screen.findByRole('heading', { name: /the colosseum/i })).toBeInTheDocument()
    expect(screen.getByText(/colosseum exterior/i)).toBeInTheDocument()
    expect(playWaypointMock).toHaveBeenCalledWith('w01')
    expect(playWaypointMock).toHaveBeenCalledTimes(1)
  })

  it('keeps Pantheon interior chapters on the same stop after exterior', async () => {
    const manifest = loadRomeManifest()
    const seq = buildEffectiveSequence(manifest, 'a', [])
    const pantheonIndex = seq.indexOf('w17')
    expect(pantheonIndex).toBeGreaterThanOrEqual(0)

    audioMock.narrationPlaying = true
    audioMock.progress = {
      currentTime: 10,
      duration: 120,
      chapterIndex: 0,
      chapterCount: 4,
      itemIndex: 0,
      itemCount: 4,
      playing: true,
      paused: false,
    }

    beginJourney({ pace: 'heroic', path: 'a', pathLocked: true })
    transitionJourney(JOURNEY_STATES.STORY, {
      currentSequenceIndex: pantheonIndex,
      completedWaypointIds: seq.slice(0, pantheonIndex).filter((id) => id.startsWith('w')),
    })
    renderShell({ variant: 'redesign' })

    expect(await screen.findByRole('heading', { name: /the pantheon/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /next chapter/i })).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('story-continue'))

    expect(jumpToChapterMock).toHaveBeenCalledWith(1, { play: true })
    expect(getJourneySnapshot().state).toBe(JOURNEY_STATES.STORY)
    expect(getJourneySnapshot().context.currentSequenceIndex).toBe(pantheonIndex)
  })

  it('shows first-tour onboarding cards instead of diegetic threshold hint during story', async () => {
    beginJourney({ pace: 'classic' })
    transitionJourney(JOURNEY_STATES.STORY, { currentSequenceIndex: 0 })
    renderShell({ variant: 'redesign' })

    expect(await screen.findByTestId('tour-onboarding-cards')).toHaveAttribute('data-phase', 'listen')
    expect(screen.getByText(/Play and pause narration/i)).toBeInTheDocument()
    expect(screen.queryByTestId('threshold-help')).not.toBeInTheDocument()
    expect(screen.queryByTestId('reveal-invite')).not.toBeInTheDocument()
    expect(screen.queryByTestId('threshold-diegetic-hint')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /read instead/i })).toBeInTheDocument()
    expect(screen.getByTestId('story-continue')).toBeInTheDocument()
    expect(screen.queryByTestId('story-open-threshold')).not.toBeInTheDocument()
    expect(screen.queryByTestId('story-footer')).not.toBeInTheDocument()
    expect(screen.queryByTestId('threshold-hold-hint')).not.toBeInTheDocument()
  })

  it('shows diegetic threshold hint after first-tour onboarding is complete', async () => {
    localStorage.setItem('cw_tour_onboarding_complete', 'true')
    beginJourney({ pace: 'classic' })
    transitionJourney(JOURNEY_STATES.STORY, { currentSequenceIndex: 0 })
    renderShell({ variant: 'redesign' })

    expect(await screen.findByTestId('threshold-diegetic-hint')).toBeInTheDocument()
    expect(screen.getByText(/hold to reveal ancient rome/i)).toBeInTheDocument()
    expect(screen.queryByTestId('reveal-invite')).not.toBeInTheDocument()
    expect(screen.queryByTestId('threshold-help')).not.toBeInTheDocument()
    expect(screen.queryByText(/are you ready to see how this would have looked/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /read instead/i })).toBeInTheDocument()
    expect(screen.getByTestId('story-continue')).toBeInTheDocument()
    expect(screen.queryByTestId('story-open-threshold')).not.toBeInTheDocument()
    expect(screen.queryByTestId('story-footer')).not.toBeInTheDocument()
    expect(screen.queryByTestId('threshold-hold-hint')).not.toBeInTheDocument()
  })

  it.each(['w06', 'w07', 'w08'])('shows continuity button during %s forum story', async (waypointId) => {
    const manifest = loadRomeManifest()
    const seq = buildEffectiveSequence(manifest, 'a', [])
    const index = seq.indexOf(waypointId)
    expect(index).toBeGreaterThanOrEqual(0)

    beginJourney({ pace: 'classic', path: 'a', pathLocked: true })
    transitionJourney(JOURNEY_STATES.STORY, {
      currentSequenceIndex: index,
      completedWaypointIds: seq.slice(0, index).filter((id) => id.startsWith('w')),
    })
    renderShell({ variant: 'redesign' })

    expect(await screen.findByTestId('story-continue')).toBeInTheDocument()
  })

  it('suppresses the full hint after the first successful threshold cross', async () => {
    localStorage.setItem('cw_tour_onboarding_complete', 'true')
    localStorage.setItem('chronowalk.hasCrossedThreshold', 'true')
    beginJourney({ pace: 'classic' })
    transitionJourney(JOURNEY_STATES.STORY, { currentSequenceIndex: 0 })
    renderShell({ variant: 'redesign' })

    expect(await screen.findByTestId('threshold-diegetic-hint')).toBeInTheDocument()
    expect(screen.queryByText(/hold to reveal/i)).not.toBeInTheDocument()
    expect(screen.queryByTestId('reveal-invite')).not.toBeInTheDocument()
    expect(screen.queryByTestId('threshold-help')).not.toBeInTheDocument()
    expect(screen.getByTestId('threshold-era-then')).toBeInTheDocument()
    expect(screen.getByTestId('threshold-era-today')).toBeInTheDocument()
  })

  it('advances from transit when continue walking is tapped', async () => {
    const manifest = loadRomeManifest()
    const t04Index = buildEffectiveSequence(manifest, 'a', []).indexOf('t04')
    expect(t04Index).toBeGreaterThanOrEqual(0)

    audioMock.narrationPlaying = true
    beginJourney({ pace: 'classic', path: 'a', pathLocked: true })
    transitionJourney(JOURNEY_STATES.WALKING, { currentSequenceIndex: t04Index })
    renderShell({ variant: 'redesign' })

    const continueBtn = await screen.findByTestId('transit-continue')
    openTransitFullPlayer(screen)
    expect(screen.getByText(/read instead/i)).toBeInTheDocument()
    fireEvent.click(continueBtn)

    expect(getJourneySnapshot().context.currentSequenceIndex).toBe(t04Index + 1)
  })

  it('shows t06 Temple of Vesta transit narration panel and script', async () => {
    const manifest = loadRomeManifest()
    const t06Index = buildEffectiveSequence(manifest, 'a', []).indexOf('t06')
    expect(t06Index).toBeGreaterThanOrEqual(0)

    audioMock.narrationPlaying = true
    beginJourney({ pace: 'classic', path: 'a', pathLocked: true })
    transitionJourney(JOURNEY_STATES.WALKING, { currentSequenceIndex: t06Index })
    renderShell({ variant: 'redesign' })

    expect(await screen.findByTestId('transit-screen')).toBeInTheDocument()
    expect(screen.getByTestId('transit-audio-panel')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /temple of vesta/i })).toBeInTheDocument()
    openTransitFullPlayer(screen)
    expect(screen.getByText(/read instead/i)).toBeInTheDocument()
    expect(screen.getByTestId('transit-continue')).toBeInTheDocument()
    expect(playTransitMock).toHaveBeenCalledWith('t06')
  })

  it('starts t06 transit narration after completing w07 story', async () => {
    const manifest = loadRomeManifest()
    const seq = buildEffectiveSequence(manifest, 'a', [])
    const w07Index = seq.indexOf('w07')
    expect(w07Index).toBeGreaterThanOrEqual(0)
    expect(seq[w07Index + 1]).toBe('t06')

    audioMock.narrationPlaying = true
    beginJourney({ pace: 'classic', path: 'a', pathLocked: true })
    transitionJourney(JOURNEY_STATES.STORY, {
      currentSequenceIndex: w07Index,
      completedWaypointIds: seq.slice(0, w07Index).filter((id) => id.startsWith('w')),
    })
    completeStoryAfterThreshold('w07')

    renderShell({ variant: 'redesign' })

    expect(await screen.findByTestId('transit-audio-panel')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /temple of vesta/i })).toBeInTheDocument()
    openTransitFullPlayer(screen)
    expect(screen.getByText(/read instead/i)).toBeInTheDocument()
    expect(playTransitMock).toHaveBeenCalledWith('t06')
  })

  it('renders unified transit shell for t15 en route to Trevi', async () => {
    const manifest = loadRomeManifest()
    const t15Index = buildEffectiveSequence(manifest, 'a', []).indexOf('t15')
    expect(t15Index).toBeGreaterThanOrEqual(0)

    audioMock.narrationPlaying = true
    beginJourney({ pace: 'classic', path: 'a', pathLocked: true })
    transitionJourney(JOURNEY_STATES.WALKING, { currentSequenceIndex: t15Index })
    renderShell({ variant: 'redesign' })

    expect(await screen.findByTestId('transit-screen')).toBeInTheDocument()
    expect(screen.getByTestId('transit-audio-panel')).toBeInTheDocument()
    expect(screen.getByTestId('transit-continue')).toBeInTheDocument()
    expect(playTransitMock).toHaveBeenCalledWith('t15')
  })

  it('t15 Trevi arrival begins w16 story from transit screen', async () => {
    const manifest = loadRomeManifest()
    const t15Index = buildEffectiveSequence(manifest, 'a', []).indexOf('t15')
    expect(t15Index).toBeGreaterThanOrEqual(0)

    beginJourney({ pace: 'classic', path: 'a', pathLocked: true })
    transitionJourney(JOURNEY_STATES.WALKING, {
      currentSequenceIndex: t15Index,
      completedWaypointIds: ['w15'],
    })
    renderShell({ variant: 'redesign' })

    fireEvent.click(await screen.findByTestId('transit-im-here'))
    fireEvent.click(await screen.findByTestId('transit-arrive-destination'))

    expect(getJourneySnapshot().state).toBe(JOURNEY_STATES.STORY)
    expect(getJourneySnapshot().context.currentSequenceIndex).toBe(t15Index + 1)
    expect(await screen.findByRole('heading', { name: /fontana di trevi/i })).toBeInTheDocument()
    expect(screen.getByText(/read instead/i)).toBeInTheDocument()
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
