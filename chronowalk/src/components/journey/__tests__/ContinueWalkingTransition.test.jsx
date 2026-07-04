import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ContinueWalkingTransition from '../ContinueWalkingTransition'
import { JOURNEY_STATES, hydrateJourney, defaultJourneySnapshot } from '../../../state/journeyState'
import { loadRomeTourManifest } from '../../../content/romeTourManifest'

describe('ContinueWalkingTransition', () => {
  beforeEach(() => {
    hydrateJourney(defaultJourneySnapshot())
    vi.stubGlobal('location', { ...window.location, assign: vi.fn() })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders next stop details on threshold state', () => {
    const manifest = loadRomeTourManifest()
    hydrateJourney({
      state: JOURNEY_STATES.THRESHOLD,
      context: {
        ...defaultJourneySnapshot().context,
        currentStopId: 'colosseum',
        currentStopIndex: 0,
      },
    })

    render(<ContinueWalkingTransition />)

    expect(screen.getByTestId('continue-walking-transition')).toBeInTheDocument()
    expect(screen.getByText('Up next')).toBeInTheDocument()
    expect(screen.getByText(manifest.stopsById['palatine-hill-cluster'].shortTitle)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue walking/i })).toBeInTheDocument()
  })

  it('advances to walking and navigates to journey map', () => {
    hydrateJourney({
      state: JOURNEY_STATES.THRESHOLD,
      context: {
        ...defaultJourneySnapshot().context,
        currentStopId: 'colosseum',
        currentStopIndex: 0,
      },
    })

    render(<ContinueWalkingTransition />)
    fireEvent.click(screen.getByRole('button', { name: /continue walking/i }))

    expect(window.location.assign).toHaveBeenCalledWith('/journey')
  })

  it('completes the tour on the final stop', () => {
    const manifest = loadRomeTourManifest()
    const last = manifest.stops.at(-1)

    hydrateJourney({
      state: JOURNEY_STATES.THRESHOLD,
      context: {
        ...defaultJourneySnapshot().context,
        currentStopId: last.id,
        currentStopIndex: last.number - 1,
      },
    })

    render(<ContinueWalkingTransition />)

    expect(screen.getByText('Tour complete')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /continue walking/i }))

    expect(window.location.assign).toHaveBeenCalledWith('/complete')
  })

  it('does not render outside threshold state', () => {
    hydrateJourney({
      state: JOURNEY_STATES.WALKING,
      context: {
        ...defaultJourneySnapshot().context,
        currentStopId: 'colosseum',
        currentStopIndex: 0,
      },
    })

    render(<ContinueWalkingTransition />)
    expect(screen.queryByTestId('continue-walking-transition')).not.toBeInTheDocument()
  })
})
