import { describe, expect, it } from 'vitest'
import { getJourneyCompleteMoment } from '../launchJourneyComplete'

describe('launchJourneyComplete', () => {
  it('returns the rome launch completion copy', () => {
    const moment = getJourneyCompleteMoment({ id: 'rome-launch' })

    expect(moment.headline).toBe('You walked Ancient Rome.')
    expect(moment.subline).toMatch(/beneath your feet/i)
    expect(moment.heroImage).toContain('/waypoints/colosseum/')
  })

  it('falls back to default completion copy', () => {
    const moment = getJourneyCompleteMoment({ id: 'unknown' })

    expect(moment.headline).toBe('You walked Ancient Rome.')
  })
})
