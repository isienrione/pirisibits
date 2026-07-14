import { describe, expect, it } from 'vitest'
import {
  MAP_BOTTOM_CARD_STATES,
  MAP_BOTTOM_CTA,
  resolveMapBottomCard,
} from '../mapBottomCard.js'
import { COMPANION_MODES } from '../companionGuidance.js'
import { JOURNEY_STATES } from '../../state/journey.js'

const pantheonStep = {
  done: false,
  id: 'w06',
  type: 'waypoint',
  record: { id: 'w06', title: 'The Pantheon' },
  targetWaypoint: { id: 'w06', title: 'The Pantheon' },
}

const transitStep = {
  done: false,
  id: 't03',
  type: 'transit',
  record: { id: 't03', title: 'Via dei Fori' },
  targetWaypoint: { id: 'w07', title: 'Piazza Navona' },
}

describe('resolveMapBottomCard', () => {
  it('returns awaiting first stop at tour start', () => {
    const card = resolveMapBottomCard({
      journeyState: JOURNEY_STATES.WALKING,
      step: pantheonStep,
      activeStop: { title: 'The Pantheon' },
      distanceM: 820,
      companionMode: COMPANION_MODES.NORMAL,
      sequenceIndex: 0,
      completedWaypointIds: [],
      directionsOpen: false,
    })

    expect(card.stateId).toBe(MAP_BOTTOM_CARD_STATES.AWAITING_FIRST)
    expect(card.title).toBe('Tour begins at The Pantheon')
    expect(card.meta).toContain('820 m')
    expect(card.ctaLabel).toBe('Get walking directions')
    expect(card.ctaAction).toBe(MAP_BOTTOM_CTA.GET_DIRECTIONS)
  })

  it('returns walking once directions are open on first leg', () => {
    const card = resolveMapBottomCard({
      journeyState: JOURNEY_STATES.WALKING,
      step: pantheonStep,
      activeStop: { title: 'The Pantheon' },
      distanceM: 820,
      companionMode: COMPANION_MODES.NORMAL,
      sequenceIndex: 0,
      completedWaypointIds: [],
      directionsOpen: true,
    })

    expect(card.stateId).toBe(MAP_BOTTOM_CARD_STATES.WALKING)
    expect(card.title).toBe('The Pantheon')
    expect(card.meta).toContain('about')
    expect(card.ctaLabel).toBe('Directions')
  })

  it('returns approaching with manual arrival CTA', () => {
    const card = resolveMapBottomCard({
      journeyState: JOURNEY_STATES.APPROACHING,
      step: pantheonStep,
      activeStop: { title: 'The Pantheon' },
      distanceM: 55,
      companionMode: COMPANION_MODES.NORMAL,
      sequenceIndex: 2,
      completedWaypointIds: ['w01'],
    })

    expect(card.stateId).toBe(MAP_BOTTOM_CARD_STATES.APPROACHING)
    expect(card.title).toBe('The Pantheon is just ahead')
    expect(card.meta).toBe('Slow your pace')
    expect(card.ctaAction).toBe(MAP_BOTTOM_CTA.MANUAL_ARRIVAL)
  })

  it('returns arrived with open story CTA', () => {
    const card = resolveMapBottomCard({
      journeyState: JOURNEY_STATES.ARRIVED,
      step: pantheonStep,
      activeStop: { title: 'The Pantheon' },
      distanceM: 12,
      companionMode: COMPANION_MODES.NORMAL,
      sequenceIndex: 2,
      completedWaypointIds: ['w01'],
    })

    expect(card.stateId).toBe(MAP_BOTTOM_CARD_STATES.ARRIVED)
    expect(card.title).toBe("You've arrived")
    expect(card.meta).toBe('The Pantheon')
    expect(card.ctaAction).toBe(MAP_BOTTOM_CTA.OPEN_STORY)
  })

  it('returns after story for transit legs', () => {
    const card = resolveMapBottomCard({
      journeyState: JOURNEY_STATES.WALKING,
      step: transitStep,
      activeStop: { title: 'Piazza Navona' },
      distanceM: 640,
      companionMode: COMPANION_MODES.NORMAL,
      sequenceIndex: 4,
      completedWaypointIds: ['w06'],
    })

    expect(card.stateId).toBe(MAP_BOTTOM_CARD_STATES.AFTER_STORY)
    expect(card.title).toBe('Piazza Navona')
    expect(card.meta).toBe('Next stop')
    expect(card.ctaLabel).toBe('Walk here')
    expect(card.ctaAction).toBe(MAP_BOTTOM_CTA.WALK_TO_NEXT)
  })

  it('prioritises off route over walking', () => {
    const card = resolveMapBottomCard({
      journeyState: JOURNEY_STATES.WALKING,
      step: pantheonStep,
      activeStop: { title: 'The Pantheon' },
      distanceM: 1200,
      companionMode: COMPANION_MODES.OFF_ROUTE,
      sequenceIndex: 2,
      completedWaypointIds: ['w01'],
    })

    expect(card.stateId).toBe(MAP_BOTTOM_CARD_STATES.OFF_ROUTE)
    expect(card.ctaAction).toBe(MAP_BOTTOM_CTA.BACK_TO_ROUTE)
  })
})
