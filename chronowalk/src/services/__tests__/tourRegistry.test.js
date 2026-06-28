import { describe, expect, it } from 'vitest'
import { ROME_CITY_TOUR } from '../../data/rome-city-tour'
import { ROME_CORE_TOUR } from '../../data/rome-core-tour'
import { ROME_FORUM_CLUSTER_TOUR } from '../../data/rome-forum-cluster-tour'
import { getTourBounds, getTourById, getTourLegs, listTourIds } from '../tourRegistry'

describe('tourRegistry', () => {
  it('lists all registered tours', () => {
    expect(listTourIds()).toEqual(
      expect.arrayContaining([
        ROME_CORE_TOUR.id,
        ROME_FORUM_CLUSTER_TOUR.id,
        ROME_CITY_TOUR.id,
      ])
    )
  })

  it('loads forum cluster tour', () => {
    const tour = getTourById('rome-forum-cluster')
    expect(tour?.stopIds).toEqual(['colosseum', 'capitoline-hill'])
  })

  it('loads city tour', () => {
    const tour = getTourById('rome-city')
    expect(tour?.stopIds).toEqual([
      'pantheon',
      'fontana-di-trevi',
      'largo-argentina',
      'campo-de-fiori',
      'piazza-navona',
      'castel-sant-angelo',
    ])
  })

  it('loads legacy rome-core tour', () => {
    const tour = getTourById('rome-core')
    expect(tour?.stopIds).toEqual([
      'colosseum',
      'capitoline-hill',
      'pantheon',
      'fontana-di-trevi',
      'largo-argentina',
      'campo-de-fiori',
      'piazza-navona',
      'castel-sant-angelo',
    ])
  })

  it('derives legs between consecutive stops for city tour', () => {
    const legs = getTourLegs(ROME_CITY_TOUR)
    expect(legs).toHaveLength(5)
    expect(legs[0]).toMatchObject({ fromId: 'pantheon', toId: 'fontana-di-trevi', index: 0 })
    expect(legs[4]).toMatchObject({ fromId: 'piazza-navona', toId: 'castel-sant-angelo', index: 4 })
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
    const bounds = getTourBounds(ROME_FORUM_CLUSTER_TOUR)
    expect(bounds?.minLat).toBeLessThan(bounds?.maxLat)
    expect(bounds?.center.lat).toBeGreaterThan(41.89)
  })
})
