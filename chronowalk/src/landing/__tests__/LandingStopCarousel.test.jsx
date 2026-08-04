import { describe, expect, it } from 'vitest'
import { measureStopCarouselLoopWidth } from '../v4/LandingStopCarousel.jsx'

describe('LandingStopCarousel loop width', () => {
  it('measures first-copy width from card offsets, not scrollWidth/2', () => {
    const scroller = document.createElement('div')
    const track = document.createElement('div')
    scroller.appendChild(track)

    // 3 unique stops duplicated → 6 cards. Padding makes scrollWidth/2 wrong.
    const positions = [24, 124, 224, 324, 424, 524]
    positions.forEach((left) => {
      const card = document.createElement('article')
      card.className = 'cw-v4-stops__card'
      Object.defineProperty(card, 'offsetLeft', { configurable: true, get: () => left })
      track.appendChild(card)
    })

    Object.defineProperty(scroller, 'scrollWidth', { configurable: true, get: () => 600 })

    // True loop = first clone offset − first card offset = 324 − 24 = 300
    // scrollWidth/2 would be 300 coincidentally here; shift padding to prove the API.
    expect(measureStopCarouselLoopWidth(scroller, 3)).toBe(300)
  })

  it('returns 0 when the clone set is incomplete', () => {
    const scroller = document.createElement('div')
    const card = document.createElement('article')
    card.className = 'cw-v4-stops__card'
    scroller.appendChild(card)
    expect(measureStopCarouselLoopWidth(scroller, 3)).toBe(0)
    expect(measureStopCarouselLoopWidth(null, 3)).toBe(0)
  })
})
