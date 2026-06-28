import { describe, expect, it } from 'vitest'
import { HEART_OF_ANCIENT_ROME_TOUR } from '../../data/heart-of-ancient-rome-tour'
import { ROME_CORE_TOUR } from '../../data/rome-core-tour'
import { ROMAN_FORUM_TOUR } from '../../data/roman-forum-tour'
import { getTourBounds, getTourById, getTourLegs, listTourIds } from '../tourRegistry'

describe('tourRegistry', () => {
  it('lists all registered tours', () => {
    expect(listTourIds()).toEqual(
      expect.arrayContaining([
        ROME_CORE_TOUR.id,
        ROMAN_FORUM_TOUR.id,
        HEART_OF_ANCIENT_ROME_TOUR.id,
      ])
    )
  })

  it('loads roman forum tour with eight forum-cluster stops', () => {
    const tour = getTourById('roman-forum')
    expect(tour?.title).toBe('Roman Forum')
    expect(tour?.stopIds).toHaveLength(8)
    expect(tour?.stopIds[0]).toBe('forum-arch-titus')
    expect(tour?.stopIds[7]).toBe('forum-arch-severus')
  })

  it('loads heart of ancient rome tour with city stops', () => {
    const tour = getTourById('heart-of-ancient-rome')
    expect(tour?.title).toBe('Heart of Ancient Rome')
    expect(tour?.stopIds).toContain('colosseum')
    expect(tour?.stopIds).toContain('piazza-navona')
    expect(tour?.stopIds).toContain('fontana-di-trevi')
    expect(tour?.stopIds).not.toContain('forum-arch-titus')
  })

  it('derives legs between consecutive stops for roman forum', () => {
    const legs = getTourLegs(ROMAN_FORUM_TOUR)
    expect(legs).toHaveLength(7)
    expect(legs[0]).toMatchObject({
      fromId: 'forum-arch-titus',
      toId: 'forum-basilica-maxentius',
      index: 0,
    })
  })

  it('computes tour bounds across stops', () => {
    const bounds = getTourBounds(HEART_OF_ANCIENT_ROME_TOUR)
    expect(bounds?.minLat).toBeLessThan(bounds?.maxLat)
    expect(bounds?.center.lat).toBeGreaterThan(41.85)
  })
})
