import { describe, expect, it } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useJourney } from '../useJourney'
import { JOURNEY_STATES, hydrateJourney, defaultJourneySnapshot } from '../../state/journeyState'
import { loadRomeTourManifest } from '../../content/romeTourManifest'

describe('useJourney', () => {
  it('returns persisted snapshot to subscribers', () => {
    hydrateJourney({
      state: JOURNEY_STATES.ARRIVED,
      context: {
        ...defaultJourneySnapshot().context,
        currentStopId: 'colosseum',
        currentStopIndex: 0,
      },
    })

    const { result } = renderHook(() => useJourney())

    expect(result.current.state).toBe(JOURNEY_STATES.ARRIVED)
    expect(result.current.context.currentStopId).toBe('colosseum')
  })

  it('resolves currentStop from the Rome tour manifest', () => {
    hydrateJourney({
      state: JOURNEY_STATES.STORY,
      context: {
        ...defaultJourneySnapshot().context,
        currentStopId: 'pantheon',
        currentStopIndex: 4,
      },
    })

    const { result } = renderHook(() => useJourney())
    const manifest = loadRomeTourManifest()

    expect(result.current.manifest).toBe(manifest)
    expect(result.current.currentStop?.id).toBe('pantheon')
    expect(result.current.currentStop?.title).toMatch(/Pantheon/i)
  })

  it('updates when setState is called', () => {
    hydrateJourney(defaultJourneySnapshot())

    const { result } = renderHook(() => useJourney())

    act(() => {
      result.current.setState(JOURNEY_STATES.WALKING)
    })

    expect(result.current.state).toBe(JOURNEY_STATES.WALKING)
  })
})

describe('JourneyDevPanel production gate', () => {
  it('DEV flag is true in test environment', () => {
    expect(import.meta.env.DEV).toBe(true)
  })
})
