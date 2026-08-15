import { describe, expect, it } from 'vitest'
import { loadRomeManifest } from '../manifest.js'
import { JOURNEY_PACE } from '../../data/romePacing.js'
import { buildHomeProgressStops, summarizeHomeProgress } from '../myTourPlan.js'

describe('home progress stops', () => {
  const manifest = loadRomeManifest()

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

    expect(stops.length).toBeGreaterThanOrEqual(19)
    expect(summary.total).toBe(stops.length)
    expect(summary.completed).toBe(2)
    expect(stops.some((stop) => stop.status === 'skipped')).toBe(true)
    expect(stops.some((stop) => stop.status === 'current')).toBe(true)
    expect(summary.percent).toBeGreaterThan(0)
    expect(summary.percent).toBeLessThanOrEqual(100)
  })
})
