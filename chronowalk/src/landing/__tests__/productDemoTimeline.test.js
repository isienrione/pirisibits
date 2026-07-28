import { describe, expect, it } from 'vitest'
import {
  buildCinematicTimeline,
  resolveTimeline,
  softLayerMotion,
  textCenterOpacity,
  beatFromLocal,
  XFADE_WEIGHT,
} from '../v4/productDemoTimeline.js'

const CHAPTERS = [
  { id: 'choose', beats: ['a', 'b', 'c'] },
  { id: 'arrive', beats: ['a', 'b', 'c', 'd'], emotional: true },
  { id: 'listen', beats: ['a', 'b', 'c'] },
  { id: 'walk', beats: ['a', 'b', 'c', 'd'] },
]

describe('productDemoTimeline', () => {
  it('builds hold + true pairwise xfade segments', () => {
    const timeline = buildCinematicTimeline(CHAPTERS)
    const holds = timeline.segments.filter((s) => s.type === 'hold')
    const fades = timeline.segments.filter((s) => s.type === 'xfade')
    expect(holds).toHaveLength(4)
    expect(fades).toHaveLength(3)
    expect(XFADE_WEIGHT).toBeGreaterThan(1)
    expect(timeline.segments[0].start).toBe(0)
    expect(timeline.segments[timeline.segments.length - 1].end).toBe(1)
  })

  it('crossfades with locked A↓ / B↑ over the same scrub window', () => {
    const timeline = buildCinematicTimeline(CHAPTERS)
    const xfade = timeline.segments.find((s) => s.type === 'xfade')
    const mid = (xfade.start + xfade.end) / 2
    const { opacities } = resolveTimeline(mid, timeline)
    expect(opacities[xfade.from]).toBeGreaterThan(0.2)
    expect(opacities[xfade.to]).toBeGreaterThan(0.2)
    expect(Math.abs(opacities[xfade.from] + opacities[xfade.to] - 1)).toBeLessThan(0.02)
  })

  it('uses soft opacity / translateY / scale — never hard cuts or blur on phone layers', () => {
    const mid = softLayerMotion(1)
    expect(mid.opacity).toBe(1)
    expect(mid.transform).toContain('translateY(0px)')
    expect(mid.transform).toContain('scale(1)')
    expect(mid.filter).toBeUndefined()

    const edge = softLayerMotion(0.4)
    expect(edge.transform).toMatch(/translateY\(/)
    expect(edge.transform).toMatch(/scale\(/)
    expect(edge.filter).toBeUndefined()
  })

  it('advances beat phases from local chapter progress', () => {
    expect(beatFromLocal(0.1, 4)).toBe(0)
    expect(beatFromLocal(0.6, 4)).toBe(2)
    expect(beatFromLocal(0.99, 4)).toBe(3)
  })

  it('fades explanatory text through viewport center', () => {
    const vh = 800
    const centered = textCenterOpacity({ top: 300, height: 200 }, vh)
    const far = textCenterOpacity({ top: -400, height: 200 }, vh)
    expect(centered).toBeGreaterThan(0.9)
    expect(far).toBeLessThan(0.2)
  })
})
