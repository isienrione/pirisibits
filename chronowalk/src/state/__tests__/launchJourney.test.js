import { describe, expect, it, beforeEach } from 'vitest'
import { beginLaunchTour } from '../launchJourney'
import { JOURNEY_STATES, hydrateJourney, defaultJourneySnapshot, getJourneySnapshot } from '../journeyState'
import { loadRomeTourManifest } from '../../content/romeTourManifest'

describe('beginLaunchTour', () => {
  beforeEach(() => {
    hydrateJourney(defaultJourneySnapshot())
  })

  it('starts at the first stop in walking state', () => {
    const manifest = loadRomeTourManifest()
    const stop = beginLaunchTour(manifest)

    expect(stop?.id).toBe('colosseum')
    expect(getJourneySnapshot().state).toBe(JOURNEY_STATES.WALKING)
    expect(getJourneySnapshot().context.currentStopId).toBe('colosseum')
    expect(getJourneySnapshot().context.completedStopIds).toEqual([])
  })
})
