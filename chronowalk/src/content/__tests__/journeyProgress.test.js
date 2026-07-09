import { describe, expect, it } from 'vitest'
import { loadRomeTourManifest } from '../romeTourManifest'
import {
  estimateDistanceBetweenStops,
  formatWalkingTime,
  getNextStop,
  isLastStop,
  markStopCompleted,
  planContinueWalking,
  resolveJourneyProgressPct,
  sanitizeWalkDistanceM,
} from '../journeyProgress'

describe('journeyProgress', () => {
  const manifest = loadRomeTourManifest()

  it('resolves the next stop from manifest order', () => {
    const colosseum = manifest.stopsById.colosseum
    const next = getNextStop(manifest, colosseum)
    expect(next?.id).toBe('palatine-hill-cluster')
  })

  it('marks the last stop correctly', () => {
    const last = manifest.stops.at(-1)
    expect(isLastStop(manifest, last)).toBe(true)
    expect(getNextStop(manifest, last)).toBeNull()
  })

  it('estimates distance between consecutive stops', () => {
    const colosseum = manifest.stopsById.colosseum
    const next = getNextStop(manifest, colosseum)
    const meters = estimateDistanceBetweenStops(colosseum, next)
    expect(meters).toBeGreaterThan(0)
  })

  it('formats walking time from distance', () => {
    expect(formatWalkingTime(400)).toBe('5 min walk')
    expect(formatWalkingTime(null)).toBeNull()
  })

  it('plans mid-tour continue with updated progress', () => {
    const colosseum = manifest.stopsById.colosseum
    const plan = planContinueWalking(manifest, { completedStopIds: [] }, colosseum)

    expect(plan.ok).toBe(true)
    expect(plan.isComplete).toBe(false)
    expect(plan.completedStopIds).toEqual(['colosseum'])
    expect(plan.nextStop?.id).toBe('palatine-hill-cluster')
    expect(plan.nextContext.currentStopId).toBe('palatine-hill-cluster')
    expect(plan.nextContext.currentStopIndex).toBe(1)
  })

  it('plans tour completion on the final stop', () => {
    const last = manifest.stops.at(-1)
    const plan = planContinueWalking(manifest, { completedStopIds: [] }, last)

    expect(plan.ok).toBe(true)
    expect(plan.isComplete).toBe(true)
    expect(plan.completedStopIds).toContain(last.id)
    expect(plan.nextStop).toBeNull()
  })

  it('dedupes completed stop ids', () => {
    expect(markStopCompleted(['colosseum'], 'colosseum')).toEqual(['colosseum'])
    expect(markStopCompleted(['colosseum'], 'pantheon')).toEqual(['colosseum', 'pantheon'])
  })

  it('sanitizes implausible walk distances', () => {
    expect(sanitizeWalkDistanceM(400)).toBe(400)
    expect(sanitizeWalkDistanceM(11_901_400)).toBeNull()
    expect(sanitizeWalkDistanceM(null)).toBeNull()
  })

  it('resolves journey progress at journey start', () => {
    expect(resolveJourneyProgressPct(manifest, 'a', 0, [])).toBe(0)
  })
})
