import { describe, expect, it } from 'vitest'
import { ROME_CORE_TOUR } from '../../data/rome-core-tour'
import { getTourBounds, getTourById, getTourLegs } from '../tourRegistry'

describe('tourRegistry', () => {
  it('loads rome-core tour', () => {
    const tour = getTourById('rome-core')
    expect(tour?.stopIds).toEqual(['colosseum', 'pantheon', 'piazza-navona'])
  })

  it('derives legs between consecutive stops', () => {
    const legs = getTourLegs(ROME_CORE_TOUR)
    expect(legs).toHaveLength(2)
    expect(legs[0]).toMatchObject({ fromId: 'colosseum', toId: 'pantheon', index: 0 })
    expect(legs[1]).toMatchObject({ fromId: 'pantheon', toId: 'piazza-navona', index: 1 })
  })

  it('supports inserting a stop between colosseum and pantheon', () => {
    const extended = {
      ...ROME_CORE_TOUR,
      stopIds: ['colosseum', 'forum-romanum', 'pantheon'],
    }
    const legs = getTourLegs(extended)
    expect(legs).toHaveLength(2)
    expect(legs[0].toId).toBe('forum-romanum')
    expect(legs[1].fromId).toBe('forum-romanum')
    expect(legs[1].toId).toBe('pantheon')
  })

  it('computes tour bounds across stops', () => {
    const bounds = getTourBounds(ROME_CORE_TOUR)
    expect(bounds?.minLat).toBeLessThan(bounds?.maxLat)
    expect(bounds?.center.lat).toBeGreaterThan(41.89)
  })
})
