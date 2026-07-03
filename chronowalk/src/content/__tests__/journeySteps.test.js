import { describe, expect, it } from 'vitest'
import {
  loadRomeManifest,
  getStepIdAtIndex,
  isTransitId,
  isWaypointId,
  resolveJourneyStep,
} from '../manifest.js'

describe('journey step helpers', () => {
  const manifest = loadRomeManifest()

  it('identifies waypoint and transit ids', () => {
    expect(isWaypointId(manifest, 'w01')).toBe(true)
    expect(isTransitId(manifest, 't01')).toBe(true)
    expect(isWaypointId(manifest, 't01')).toBe(false)
  })

  it('resolves path-aware sequence steps', () => {
    expect(getStepIdAtIndex(manifest, 'a', 2)).toBe('t01')
    expect(getStepIdAtIndex(manifest, 'a', 3)).toBe('w03')
    expect(getStepIdAtIndex(manifest, 'b', 3)).toBe('w04')
  })

  it('resolves transit target waypoint', () => {
    const step = resolveJourneyStep(manifest, 'a', 2)
    expect(step.type).toBe('transit')
    expect(step.id).toBe('t01')
    expect(step.targetWaypoint?.id).toBe('w03')
    expect(step.needsPathChoice).toBe(true)
  })

  it('resolves waypoint step', () => {
    const step = resolveJourneyStep(manifest, 'a', 0)
    expect(step.type).toBe('waypoint')
    expect(step.id).toBe('w01')
    expect(step.targetWaypoint?.id).toBe('w01')
  })
})
