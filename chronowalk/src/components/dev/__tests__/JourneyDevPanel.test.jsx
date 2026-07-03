import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import JourneyDevPanel from '../JourneyDevPanel.jsx'
import { beginJourney, getJourneySnapshot, resetJourney } from '../../../state/journey.js'
import { readDevSimulateGps, setDevSimulateGps } from '../devTools.js'

const devPanelEnabled = vi.hoisted(() => ({ value: true }))

vi.mock('../../../config/env.js', () => ({
  isDevPanelEnabled: () => devPanelEnabled.value,
}))

vi.mock('../../../lib/config', () => ({
  grantAccess: vi.fn(),
  revokeAccess: vi.fn(),
}))

vi.mock('../../../hooks/useJourneyStep.js', () => ({
  useJourneyStep: () => ({
    type: 'waypoint',
    id: 'w01',
    record: { title: 'The Colosseum' },
  }),
}))

vi.mock('../../../hooks/useJourney.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useTourManifest: () => ({
      manifest: {
        journey: {
          sequences: { a: Array.from({ length: 20 }, (_, index) => `step-${index}`) },
          optional_waypoints: { a: [], b: [] },
        },
      },
      loading: false,
      error: null,
    }),
  }
})

describe('JourneyDevPanel', () => {
  beforeEach(() => {
    devPanelEnabled.value = true
    localStorage.clear()
    sessionStorage.clear()
    resetJourney()
    beginJourney({ pace: 'classic' })
  })

  it('does not render when dev panel is disabled', () => {
    devPanelEnabled.value = false
    const { container } = render(<JourneyDevPanel />)
    expect(container).toBeEmptyDOMElement()
  })

  it('jumps to a sequence index', async () => {
    render(<JourneyDevPanel />)

    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '12' } })
    fireEvent.click(screen.getByRole('button', { name: /^jump$/i }))

    expect(getJourneySnapshot().context.currentSequenceIndex).toBe(12)
  })

  it('toggles simulated GPS for field testing', () => {
    render(<JourneyDevPanel />)

    expect(readDevSimulateGps()).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: /gps: live/i }))
    expect(readDevSimulateGps()).toBe(true)
    expect(screen.getByRole('button', { name: /gps: simulated/i })).toBeInTheDocument()
    setDevSimulateGps(false)
  })
})
