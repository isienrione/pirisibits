import { describe, expect, it } from 'vitest'
import { HERO_SLIDESHOW_SLIDES, LANDING_PHONE_MOCKUPS } from '../v4/heroSlideshowData.js'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

describe('heroSlideshowData', () => {
  it('points every story slide at a real portrait PNG', () => {
    expect(HERO_SLIDESHOW_SLIDES.length).toBe(5)
    expect(HERO_SLIDESHOW_SLIDES.map((s) => s.id)).toEqual([
      'then-now',
      'ruin-room',
      'gps-guidance',
      'audio-narratives',
      'choose-your-walk',
    ])

    for (const slide of HERO_SLIDESHOW_SLIDES) {
      expect(slide.src).toMatch(/^\/landing\/hero-slides\/.+\.png$/)
      const disk = resolve(process.cwd(), `public${slide.src}`)
      expect(existsSync(disk), disk).toBe(true)
    }
  })

  it('keeps portrait phone mockups available for landing reuse', () => {
    expect(LANDING_PHONE_MOCKUPS).toHaveLength(4)
    for (const src of LANDING_PHONE_MOCKUPS) {
      const disk = resolve(process.cwd(), `public${src}`)
      expect(existsSync(disk), disk).toBe(true)
    }
  })
})
