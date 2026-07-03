import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import JourneyDevPanel from '../JourneyDevPanel.jsx'

vi.mock('../../../config/env.js', () => ({
  isDevPanelEnabled: () => false,
}))

vi.mock('../../../hooks/useJourney.js', () => ({
  useJourney: () => ({
    state: 'walking',
    context: { path: 'a', currentSequenceIndex: 0, promotedOptionalIds: [] },
    transition: vi.fn(),
    reset: vi.fn(),
    begin: vi.fn(),
    states: {},
  }),
  useTourManifest: () => ({ manifest: null }),
}))

vi.mock('../../../hooks/useJourneyStep.js', () => ({
  useJourneyStep: () => ({
    type: 'waypoint',
    id: 'w01',
    record: { title: 'The Colosseum' },
  }),
}))

describe('JourneyDevPanel', () => {
  it('does not render when dev panel is disabled', () => {
    const { container } = render(<JourneyDevPanel />)
    expect(container).toBeEmptyDOMElement()
    expect(screen.queryByText(/journey dev panel/i)).not.toBeInTheDocument()
  })
})
