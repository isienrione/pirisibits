import { describe, expect, it } from 'vitest'
import {
  getHeroSlideshowSlides,
  HERO_SLIDESHOW_SLIDES,
  LANDING_PHONE_MOCKUPS,
} from '../v4/heroSlideshowData.js'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

describe('heroSlideshowData', () => {
  it('points every story slide at a real portrait PNG', () => {
    expect(HERO_SLIDESHOW_SLIDES.length).toBe(8)
    expect(HERO_SLIDESHOW_SLIDES.map((s) => s.id)).toEqual([
      'then-now',
      'ruin-room',
      'gps-guidance',
      'audio-narratives',
      'package-historica',
      'package-antica',
      'package-eterna',
      'choose-your-walk',
    ])

    for (const slide of HERO_SLIDESHOW_SLIDES) {
      expect(slide.src).toMatch(/^\/landing\/hero-slides\/.+\.png$/)
      expect(slide.width).toBeGreaterThan(0)
      expect(slide.height).toBeGreaterThan(0)
      const disk = resolve(process.cwd(), `public${slide.src}`)
      expect(existsSync(disk), disk).toBe(true)
    }
  })

  it('places package posters before Choose your walk in ascending price order', () => {
    const ids = HERO_SLIDESHOW_SLIDES.map((s) => s.id)
    const chooseIdx = ids.indexOf('choose-your-walk')
    expect(ids.slice(chooseIdx - 3, chooseIdx)).toEqual([
      'package-historica',
      'package-antica',
      'package-eterna',
    ])
    expect(HERO_SLIDESHOW_SLIDES.find((s) => s.id === 'package-historica')?.pricingTarget).toBe(
      'rome-central',
    )
    expect(HERO_SLIDESHOW_SLIDES.find((s) => s.id === 'package-antica')?.pricingTarget).toBe(
      'rome-essential',
    )
    expect(HERO_SLIDESHOW_SLIDES.find((s) => s.id === 'package-eterna')?.pricingTarget).toBe(
      'rome-complete',
    )
  })

  it('keeps portrait phone mockups available for landing reuse', () => {
    expect(LANDING_PHONE_MOCKUPS).toHaveLength(4)
    for (const src of LANDING_PHONE_MOCKUPS) {
      const disk = resolve(process.cwd(), `public${src}`)
      expect(existsSync(disk), disk).toBe(true)
    }
  })

  it('returns English slides unchanged for the default locale', () => {
    expect(getHeroSlideshowSlides('en')).toEqual(HERO_SLIDESHOW_SLIDES)
  })

  it('swaps in Spanish marketing frames without changing English assets', () => {
    const es = getHeroSlideshowSlides('es')
    expect(es).toHaveLength(HERO_SLIDESHOW_SLIDES.length)
    expect(es.map((s) => s.id)).toEqual(HERO_SLIDESHOW_SLIDES.map((s) => s.id))

    for (const slide of es) {
      const disk = resolve(process.cwd(), `public${slide.src}`)
      expect(existsSync(disk), disk).toBe(true)
      if (slide.id === 'choose-your-walk') {
        expect(slide.src).toBe('/landing/hero-slides/choose-your-walk.png')
      } else {
        expect(slide.src).toMatch(/^\/landing\/hero-slides\/es\//)
      }
    }

    // English list is untouched.
    expect(HERO_SLIDESHOW_SLIDES.every((s) => !s.src.includes('/es/'))).toBe(true)
  })
})
