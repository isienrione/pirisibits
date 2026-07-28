import { describe, expect, it } from 'vitest'
import {
  buildChapterRanges,
  chapterPhase,
  phoneLayerStyle,
  PHONE_FADE_SCROLL_PX,
  textCenterOpacity,
} from '../v4/productDemoTimeline.js'

const CHAPTERS = [
  { id: 'choose', beats: ['a', 'b', 'c'] },
  { id: 'arrive', beats: ['a', 'b', 'c', 'd'], emotional: true },
  { id: 'listen', beats: ['a', 'b', 'c'] },
  { id: 'walk', beats: ['a', 'b', 'c', 'd'] },
]

describe('productDemoTimeline', () => {
  it('builds overlapping chapter ranges so the next scene starts early', () => {
    const ranges = buildChapterRanges(CHAPTERS, 0.18)
    expect(ranges).toHaveLength(4)
    expect(ranges[0].start).toBe(0)
    expect(ranges[3].end).toBe(1)
    for (let i = 0; i < ranges.length - 1; i += 1) {
      expect(ranges[i + 1].start).toBeLessThan(ranges[i].end)
    }
  })

  it('crossfades phone layers over roughly 300–600px of scroll', () => {
    const scrollablePx = 12000
    const fadeProgress = PHONE_FADE_SCROLL_PX / scrollablePx
    const style = phoneLayerStyle(fadeProgress * 0.5, 0, 0.25, scrollablePx)
    expect(style.opacity).toBeGreaterThan(0)
    expect(style.opacity).toBeLessThan(1)
    expect(PHONE_FADE_SCROLL_PX).toBeGreaterThanOrEqual(300)
    expect(PHONE_FADE_SCROLL_PX).toBeLessThanOrEqual(600)
  })

  it('uses soft opacity / translateY / scale / blur — never hard cuts', () => {
    const mid = phoneLayerStyle(0.5, 0.2, 0.8, 10000)
    expect(mid.opacity).toBe(1)
    expect(mid.transform).toContain('translateY(0px)')
    expect(mid.transform).toContain('scale(1)')

    const edge = phoneLayerStyle(0.21, 0.2, 0.8, 10000)
    expect(edge.transform).toMatch(/translateY\(/)
    expect(edge.transform).toMatch(/scale\(/)
    expect(edge.filter).toMatch(/blur\(/)
  })

  it('advances beat phases inside a chapter', () => {
    expect(chapterPhase(0.1, 0, 1, 4)).toBe(0)
    expect(chapterPhase(0.6, 0, 1, 4)).toBe(2)
    expect(chapterPhase(0.99, 0, 1, 4)).toBe(3)
  })

  it('fades explanatory text through viewport center', () => {
    const vh = 800
    const centered = textCenterOpacity({ top: 300, height: 200 }, vh)
    const far = textCenterOpacity({ top: -400, height: 200 }, vh)
    expect(centered).toBeGreaterThan(0.9)
    expect(far).toBeLessThan(0.2)
  })
})
