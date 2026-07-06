import { describe, expect, it } from 'vitest'
import { loadRomeManifest } from '../manifest.js'
import {
  buildTourRoadmap,
  summarizeTourRoadmap,
  tourRoadmapHeadline,
} from '../tourRoadmap.js'

describe('tourRoadmap', () => {
  const manifest = loadRomeManifest()

  it('marks completed, current, and upcoming stops on the path', () => {
    const stops = buildTourRoadmap(manifest, {
      path: 'a',
      sequenceIndex: 4,
      completedWaypointIds: ['w01', 'w03'],
    })

    expect(stops.length).toBeGreaterThan(5)
    expect(stops.find((s) => s.id === 'w01')?.status).toBe('completed')
    expect(stops.find((s) => s.id === 'w03')?.status).toBe('completed')
    expect(stops.some((s) => s.status === 'current' || s.status === 'upcoming')).toBe(true)
  })

  it('builds a headline that names the next stop', () => {
    const stops = buildTourRoadmap(manifest, {
      completedWaypointIds: ['w01', 'w03'],
      sequenceIndex: 4,
    })
    const headline = tourRoadmapHeadline(stops)
    expect(headline).toMatch(/next/i)
  })

  it('summarizes progress counts', () => {
    const stops = buildTourRoadmap(manifest, {
      completedWaypointIds: ['w01'],
      sequenceIndex: 2,
    })
    const { completed, total } = summarizeTourRoadmap(stops)
    expect(completed).toBe(1)
    expect(total).toBe(stops.length)
  })
})
