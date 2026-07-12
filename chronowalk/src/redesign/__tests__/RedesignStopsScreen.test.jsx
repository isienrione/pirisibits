import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { loadRomeManifest } from '../../content/manifest.js'
import { JOURNEY_STATES } from '../../state/journey.js'
import RedesignStopsScreen from '../RedesignStopsScreen.jsx'

const manifest = loadRomeManifest()
const MIN_TOUCH = 44

vi.mock('../../hooks/useV2Journey.js', () => ({
  useV2Journey: () => ({
    state: JOURNEY_STATES.IDLE,
    context: {
      path: 'a',
      currentSequenceIndex: 0,
      completedWaypointIds: [],
    },
  }),
  useTourManifest: () => ({
    manifest,
    loading: false,
    error: null,
  }),
}))

function effectiveMinHeight(element) {
  const inline = Number.parseFloat(element.style.minHeight)
  if (Number.isFinite(inline)) return inline
  const computed = Number.parseFloat(getComputedStyle(element).minHeight)
  if (Number.isFinite(computed)) return computed
  return element.getBoundingClientRect().height
}

describe('RedesignStopsScreen touch targets', () => {
  it('renders stop rows with ≥44px min-height tap targets', async () => {
    render(
      <MemoryRouter>
        <RedesignStopsScreen />
      </MemoryRouter>,
    )

    const mainButtons = await screen.findAllByTestId('stop-row-main')
    const listenButtons = screen.getAllByTestId('stop-row-listen')

    expect(mainButtons.length).toBeGreaterThan(0)
    expect(listenButtons.length).toBe(mainButtons.length)

    for (const button of mainButtons) {
      expect(effectiveMinHeight(button)).toBeGreaterThanOrEqual(MIN_TOUCH)
    }

    for (const button of listenButtons) {
      expect(effectiveMinHeight(button)).toBeGreaterThanOrEqual(MIN_TOUCH)
    }
  })
})
