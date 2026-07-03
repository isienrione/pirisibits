import { describe, expect, it, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import JourneyShell from '../JourneyShell.jsx'
import { beginJourney, resetJourney, transitionJourney, JOURNEY_STATES } from '../../../state/journey.js'

const playWaypointMock = vi.fn().mockResolvedValue(undefined)
const playTransitMock = vi.fn().mockResolvedValue(undefined)
const unlockMock = vi.fn().mockResolvedValue(true)

vi.mock('../../../hooks/useAudioEngine.js', () => ({
  useAudioEngine: () => ({
    ready: true,
    narrationPlaying: false,
    unlock: unlockMock,
    playWaypoint: playWaypointMock,
    playTransit: playTransitMock,
    playResumeCue: vi.fn().mockResolvedValue(undefined),
    stopNarration: vi.fn(),
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
  }),
}))

vi.mock('../../../lib/track.js', () => ({
  track: vi.fn(),
  TRACK_EVENTS: {
    WAYPOINT_ARRIVED: 'waypoint_arrived',
    STORY_COMPLETE: 'story_complete',
    OPTIONAL_WAYPOINT_PROMOTED: 'optional_waypoint_promoted',
    RESUME: 'resume',
  },
}))

function renderShell() {
  return render(
    <MemoryRouter>
      <JourneyShell />
    </MemoryRouter>
  )
}

describe('JourneyShell', () => {
  beforeEach(() => {
    localStorage.clear()
    resetJourney()
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
})
