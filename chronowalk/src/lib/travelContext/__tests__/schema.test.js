import { describe, expect, it } from 'vitest'
import {
  applyContextPatch,
  appendHistoryEvent,
  emptyTravelContext,
  migrateLegacyContext,
  normalizeAvailableTimeNow,
  normalizeTravelContext,
  TRAVEL_CONTEXT_VERSION,
} from '../schema.js'
import { expandInterestIds, GLOBAL_INTERESTS, SUB_INTERESTS_BY_PARENT } from '../taxonomy.js'
import { toRankerSignals } from '../compat.js'

describe('travel context schema', () => {
  it('keeps availableTimeNow distinct from tripHorizon', () => {
    const context = normalizeTravelContext({
      traveler: { positiveInterestIds: ['history', 'architecture-design'] },
      trip: { cityId: 'rome', tripHorizon: 'week-plus' },
      session: { availableTimeNow: '30min' },
    })
    expect(context.version).toBe(TRAVEL_CONTEXT_VERSION)
    expect(context.trip.tripHorizon).toBe('week-plus')
    expect(context.session.availableTimeNow).toBe('30min')
    expect(context.timeBudgetId).toBe('30min')
    expect(context.interestIds).toEqual(['history', 'architecture-design'])
    expect(context.trip.residency).toBe('visitor')
  })

  it('treats a local horizon as residency local without collapsing session time', () => {
    const context = normalizeTravelContext({
      traveler: { surpriseMe: true },
      trip: { cityId: 'santiago', tripHorizon: 'local' },
      session: { availableTimeNow: '2h' },
    })
    expect(context.trip.cityId).toBe('santiago')
    expect(context.trip.residency).toBe('local')
    expect(context.session.availableTimeNow).toBe('2h')
    expect(context.traveler.surpriseMe).toBe(true)
  })

  it('migrates v1 interestIds + timeBudgetId onto nested layers', () => {
    const migrated = migrateLegacyContext({
      interestIds: ['architecture', 'sacred'],
      surpriseMe: false,
      timeBudgetId: 'norush',
      locationStatus: 'denied',
      lastPosition: { lat: 41.9, lng: 12.5 },
      completedAt: '2026-08-01T00:00:00.000Z',
    })
    expect(migrated.traveler.positiveInterestIds).toEqual(['architecture', 'sacred'])
    expect(migrated.session.availableTimeNow).toBe('exploring')
    expect(migrated.timeBudgetId).toBe('exploring')
    expect(migrated.session.locationStatus).toBe('denied')
    expect(migrated.session.location.lat).toBe(41.9)
    expect(migrated.trip.tripHorizon).toBeNull()
    expect(migrated.history.completedExperienceIds).toEqual([])
  })

  it('normalizes a raw v1 blob via normalizeTravelContext', () => {
    const context = normalizeTravelContext({
      interestIds: ['art'],
      timeBudgetId: '1h',
    })
    expect(context.traveler.positiveInterestIds).toEqual(['art'])
    expect(context.session.availableTimeNow).toBe('1h')
  })

  it('stores multiple anchors even when UI adds one', () => {
    const context = applyContextPatch(emptyTravelContext(), {
      trip: {
        cityId: 'rome',
        tripHorizon: '4-7d',
        anchors: [
          { type: 'ticket', title: 'Colosseum 10:00' },
          { type: 'reservation', title: 'Dinner in Trastevere' },
        ],
      },
    })
    expect(context.trip.anchors).toHaveLength(2)
    expect(context.trip.anchors.map((item) => item.type)).toEqual(['ticket', 'reservation'])
  })

  it('retains behavioral history without inventing scores', () => {
    let history = appendHistoryEvent(undefined, 'completed', 'w17')
    history = appendHistoryEvent(history, 'saved', 'w01')
    history = appendHistoryEvent(history, 'dismissed', 'w22')
    history = appendHistoryEvent(history, 'liked', 'w18')
    history = appendHistoryEvent(history, 'completed', 'w17')
    expect(history.completedExperienceIds).toEqual(['w17'])
    expect(history.savedExperienceIds).toEqual(['w01'])
    expect(history.dismissedExperienceIds).toEqual(['w22'])
    expect(history.likedExperienceIds).toEqual(['w18'])
    expect(history.events).toHaveLength(4)
  })

  it('uses a city-agnostic interest taxonomy', () => {
    const ids = GLOBAL_INTERESTS.map((item) => item.id)
    expect(ids).toEqual(expect.arrayContaining(['history', 'architecture-design', 'food-local-life']))
    expect(ids).not.toContain('ancient-power')
    expect(ids.some((id) => /rome|roman/i.test(id))).toBe(false)
    expect(SUB_INTERESTS_BY_PARENT.history.map((item) => item.id)).toEqual(
      expect.arrayContaining(['archaeology', 'warfare', 'politics']),
    )
  })

  it('maps norush to exploring', () => {
    expect(normalizeAvailableTimeNow('norush')).toBe('exploring')
  })
})

describe('ranker signal projection', () => {
  it('does not feed tripHorizon or mealIntent into V0 signals', () => {
    const signals = toRankerSignals({
      traveler: {
        positiveInterestIds: ['architecture-design'],
        avoidInterestIds: ['nightlife'],
        iconicVsHidden: 'hidden',
      },
      trip: { tripHorizon: 'week-plus', anchors: [{ type: 'ticket', title: 'Vatican' }] },
      session: { availableTimeNow: '30min', mealIntent: 'dinner' },
      history: { completedExperienceIds: ['w17'] },
    })
    expect(signals.interestIds).toEqual(['architecture-design'])
    expect(signals.timeBudgetId).toBe('30min')
    expect(signals.completedIds).toEqual(['w17'])
    expect(signals.iconicVsHidden).toBe('hidden')
    expect(signals).not.toHaveProperty('tripHorizon')
    expect(signals).not.toHaveProperty('mealIntent')
    expect(signals).not.toHaveProperty('anchors')
  })

  it('expands legacy architecture onto architecture-design', () => {
    const expanded = expandInterestIds(['architecture'])
    expect(expanded.has('architecture-design')).toBe(true)
    expect(expanded.has('engineering')).toBe(true)
  })
})
