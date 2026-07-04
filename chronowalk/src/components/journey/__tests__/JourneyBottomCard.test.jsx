import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import JourneyBottomCard from '../JourneyBottomCard'
import { JOURNEY_STATES, defaultJourneySnapshot, hydrateJourney } from '../../../state/journeyState'
import { loadRomeTourManifest } from '../../../content/romeTourManifest'

describe('JourneyBottomCard', () => {
  const manifest = loadRomeTourManifest()
  const colosseum = manifest.stopsById.colosseum
  const next = manifest.stopsById['palatine-hill-cluster']

  beforeEach(() => {
    hydrateJourney(defaultJourneySnapshot())
  })

  function hydrateWalking() {
    hydrateJourney({
      state: JOURNEY_STATES.WALKING,
      context: {
        ...defaultJourneySnapshot().context,
        currentStopId: colosseum.id,
        currentStopIndex: colosseum.number - 1,
      },
    })
  }

  it('shows walking state with next destination emphasis', () => {
    hydrateWalking()

    render(<JourneyBottomCard />)

    expect(screen.getByTestId('journey-bottom-card')).toBeInTheDocument()
    expect(screen.getByText('Walking')).toBeInTheDocument()
    expect(screen.getByText(next.shortTitle)).toBeInTheDocument()
    expect(screen.getByText(/continue toward/i)).toBeInTheDocument()
  })

  it('shows approaching state label', () => {
    hydrateJourney({
      state: JOURNEY_STATES.APPROACHING,
      context: {
        ...defaultJourneySnapshot().context,
        currentStopId: colosseum.id,
        currentStopIndex: colosseum.number - 1,
      },
    })

    render(<JourneyBottomCard />)

    expect(screen.getByText('Approaching')).toBeInTheDocument()
  })

  it('shows arrived state with arrival copy', () => {
    hydrateJourney({
      state: JOURNEY_STATES.ARRIVED,
      context: {
        ...defaultJourneySnapshot().context,
        currentStopId: colosseum.id,
        currentStopIndex: colosseum.number - 1,
      },
    })

    render(<JourneyBottomCard />)

    expect(screen.getByText('Arrived')).toBeInTheDocument()
    expect(screen.getByText(colosseum.shortTitle)).toBeInTheDocument()
    expect(screen.getByText(colosseum.arrivalLine)).toBeInTheDocument()
  })

  it('does not render outside walking flow states', () => {
    hydrateJourney({
      state: JOURNEY_STATES.IDLE,
      context: defaultJourneySnapshot().context,
    })

    render(<JourneyBottomCard />)

    expect(screen.queryByTestId('journey-bottom-card')).not.toBeInTheDocument()
  })
})
