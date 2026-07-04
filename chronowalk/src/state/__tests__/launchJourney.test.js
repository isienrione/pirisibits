import { describe, expect, it, beforeEach } from 'vitest'
import { beginLaunchTour } from '../launchJourney'
import { JOURNEY_STATES, defaultJourneySnapshot, getJourneySnapshot, hydrateJourney } from '../journeyState'
import { loadRomeTourManifest } from '../../content/romeTourManifest'

describe('beginLaunchTour', () => {
  beforeEach(() => {
    hydrateJourney(defaultJourneySnapshot())
  })

  it('starts at the first stop in walking state', () => {
    const manifest = loadRomeTourManifest()
    const first = manifest.stops[0]

    const stop = beginLaunchTour(manifest)

    expect(stop?.id).toBe(first.id)
    expect(getJourneySnapshot()).toMatchObject({
      state: JOURNEY_STATES.WALKING,
      context: {
        currentStopId: first.id,
        currentStopIndex: first.number - 1,
        completedStopIds: [],
        hasAccess: true,
      },
    })
  })

  it('honors an explicit stop id', () => {
    const manifest = loadRomeTourManifest()
    const pantheon = manifest.stopsById.pantheon

    beginLaunchTour(manifest, { stopId: 'pantheon' })

    expect(getJourneySnapshot().context.currentStopId).toBe('pantheon')
    expect(getJourneySnapshot().context.currentStopIndex).toBe(pantheon.number - 1)
  })
})
