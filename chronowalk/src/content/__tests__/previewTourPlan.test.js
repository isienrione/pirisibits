import { describe, expect, it } from 'vitest'
import { loadRomeManifest } from '../manifest.js'
import { buildPreviewTourActs, summarizePreviewTour } from '../myTourPlan.js'

describe('buildPreviewTourActs', () => {
  const manifest = loadRomeManifest()

  it('marks the preview stop as sample and the rest as locked', () => {
    const acts = buildPreviewTourActs(manifest, 'w17')
    const stops = acts.flatMap((act) => act.stops)

    expect(stops.find((stop) => stop.id === 'w17')?.status).toBe('sample')
    expect(stops.filter((stop) => stop.status === 'locked').length).toBeGreaterThan(10)
    expect(stops.every((stop) => stop.status === 'sample' || stop.status === 'locked')).toBe(true)
  })

  it('summarizes sample and locked counts', () => {
    const acts = buildPreviewTourActs(manifest, 'w17')
    const summary = summarizePreviewTour(acts)

    expect(summary.sample).toBe(1)
    expect(summary.locked).toBe(summary.total - 1)
    expect(summary.actCount).toBeGreaterThan(0)
  })
})
