import { describe, expect, it } from 'vitest'
import { loadRomeManifest } from '../manifest.js'
import { JOURNEY_PACE } from '../../data/romePacing.js'
import {
  buildHomeProgressStops,
  findSequenceIndexForWaypoint,
  summarizeHomeProgress,
} from '../myTourPlan.js'

describe('home progress stops', () => {
  const manifest = loadRomeManifest()

  it('always totals 21 Eterna beads including Palatine + Circus Maximus optionals', () => {
    const context = {
      pace: JOURNEY_PACE.HEROIC,
      path: 'a',
      currentSequenceIndex: 0,
      completedWaypointIds: [],
      promotedOptionalIds: [],
    }

    const stops = buildHomeProgressStops(manifest, context)
    const summary = summarizeHomeProgress(stops)

    expect(stops.length).toBe(21)
    expect(summary.total).toBe(21)
    expect(stops.some((stop) => stop.id === 'w04')).toBe(true)
    expect(stops.some((stop) => stop.id === 'enc_circus')).toBe(true)
  })

  it('marks skipped Palatine-path beads when the traveler bypasses them', () => {
    const path = 'a'
    const promoted = []
    const beforeSeq = findSequenceIndexForWaypoint(manifest, 'w06', path, promoted)
    expect(beforeSeq).toBeGreaterThan(0)

    const context = {
      pace: JOURNEY_PACE.HEROIC,
      path,
      currentSequenceIndex: beforeSeq,
      completedWaypointIds: ['w01', 'w02', 'w03'],
      promotedOptionalIds: promoted,
    }

    const stops = buildHomeProgressStops(manifest, context)
    const summary = summarizeHomeProgress(stops)
    const palatine = stops.find((stop) => stop.id === 'w04')
    const circus = stops.find((stop) => stop.id === 'enc_circus')

    expect(stops.length).toBe(21)
    expect(palatine?.status).toBe('skipped')
    expect(circus?.status).toBe('skipped')
    expect(summary.completed).toBe(3)
    expect(summary.skipped).toBeGreaterThanOrEqual(2)
    // Skipped beads stay in the denominator, not the "X of 21" numerator.
    expect(summary.total).toBe(21)
  })

  it('counts the full Eterna visit-stop set and marks jumped-past stops as skipped', () => {
    const context = {
      pace: JOURNEY_PACE.HEROIC,
      path: 'a',
      currentSequenceIndex: 6,
      completedWaypointIds: ['w01', 'w02'],
      promotedOptionalIds: [],
    }

    const stops = buildHomeProgressStops(manifest, context)
    const summary = summarizeHomeProgress(stops)

    expect(stops.length).toBe(21)
    expect(summary.total).toBe(21)
    expect(summary.completed).toBe(2)
    expect(stops.some((stop) => stop.status === 'skipped')).toBe(true)
    expect(stops.some((stop) => stop.status === 'current')).toBe(true)
    expect(summary.percent).toBeGreaterThan(0)
    expect(summary.percent).toBeLessThanOrEqual(100)
  })

  it('does not drop percent when rewinding to an earlier incomplete current stop', () => {
    const stops = [
      { id: 'a', status: 'completed' },
      { id: 'b', status: 'completed' },
      { id: 'c', status: 'current' },
      ...Array.from({ length: 16 }, (_, i) => ({ id: `u${i}`, status: 'upcoming' })),
    ]
    const rewindStops = [
      { id: 'a', status: 'current' },
      { id: 'b', status: 'completed' },
      { id: 'c', status: 'completed' },
      ...Array.from({ length: 16 }, (_, i) => ({
        id: `u${i}`,
        status: i < 14 ? 'completed' : 'upcoming',
      })),
    ]
    const advanced = summarizeHomeProgress(rewindStops)
    expect(advanced.completed).toBeGreaterThan(10)
    expect(advanced.percent).toBeGreaterThanOrEqual(
      Math.round((advanced.completed / advanced.total) * 100),
    )
    expect(summarizeHomeProgress(stops).percent).toBeGreaterThan(0)
  })
})
