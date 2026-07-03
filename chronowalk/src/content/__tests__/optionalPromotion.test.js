import { describe, expect, it } from 'vitest'
import { loadRomeManifest } from '../manifest.js'
import {
  buildEffectiveSequence,
  canPromoteOptionalWaypoint,
  getOptionalWaypointIds,
  getPromotionInsertSteps,
} from '../optionalPromotion.js'

describe('optional waypoint promotion', () => {
  const manifest = loadRomeManifest()

  it('lists path A optional waypoints from manifest', () => {
    expect(getOptionalWaypointIds(manifest, 'a')).toEqual(['w04'])
    expect(getOptionalWaypointIds(manifest, 'b')).toEqual([])
  })

  it('inserts promoted w04 steps before w06 on path A', () => {
    const sequence = buildEffectiveSequence(manifest, 'a', ['w04'])
    const w03Index = sequence.indexOf('w03')
    const w06Index = sequence.indexOf('w06')

    expect(sequence.slice(w03Index + 1, w06Index)).toEqual(['t02', 'w04', 't03'])
    expect(getPromotionInsertSteps(manifest, 'w04', 'a')).toEqual(['t02', 'w04', 't03'])
  })

  it('leaves path B sequence unchanged when w04 is not optional', () => {
    const base = buildEffectiveSequence(manifest, 'b', [])
    const promoted = buildEffectiveSequence(manifest, 'b', ['w04'])
    expect(promoted).toEqual(base)
  })

  it('allows promotion after w03 is complete on path A', () => {
    expect(
      canPromoteOptionalWaypoint(manifest, {
        path: 'a',
        waypointId: 'w04',
        promotedOptionalIds: [],
        completedWaypointIds: ['w03'],
        currentSequenceIndex: 3,
      })
    ).toBe(true)
  })

  it('allows promotion while walking toward w06 before w03 is marked complete', () => {
    const w03Index = buildEffectiveSequence(manifest, 'a', []).indexOf('w03')
    expect(
      canPromoteOptionalWaypoint(manifest, {
        path: 'a',
        waypointId: 'w04',
        promotedOptionalIds: [],
        completedWaypointIds: [],
        currentSequenceIndex: w03Index + 1,
      })
    ).toBe(true)
  })

  it('blocks promotion after w06 is complete', () => {
    expect(
      canPromoteOptionalWaypoint(manifest, {
        path: 'a',
        waypointId: 'w04',
        promotedOptionalIds: [],
        completedWaypointIds: ['w03', 'w06'],
        currentSequenceIndex: 10,
      })
    ).toBe(false)
  })

  it('blocks promotion when w04 was already promoted', () => {
    expect(
      canPromoteOptionalWaypoint(manifest, {
        path: 'a',
        waypointId: 'w04',
        promotedOptionalIds: ['w04'],
        completedWaypointIds: ['w03'],
        currentSequenceIndex: 4,
      })
    ).toBe(false)
  })
})
