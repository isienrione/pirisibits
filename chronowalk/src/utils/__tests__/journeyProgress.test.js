import { describe, expect, it } from 'vitest'
import { getJourneyProgress } from '../tourStats'

const tour = {
  id: 'rome-core',
  stopIds: ['colosseum', 'pantheon', 'forum'],
}

describe('getJourneyProgress', () => {
  it('returns visited, remaining, and completion percent', () => {
    expect(getJourneyProgress(tour, ['colosseum', 'pantheon'])).toEqual({
      total: 3,
      visited: 2,
      remaining: 1,
      completionPercent: 67,
    })
  })

  it('returns zeros for an empty tour', () => {
    expect(getJourneyProgress(null, [])).toEqual({
      total: 0,
      visited: 0,
      remaining: 0,
      completionPercent: 0,
    })
  })
})
