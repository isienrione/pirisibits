import { afterEach, describe, expect, it, vi } from 'vitest'
import { scrollLandingAnchor } from '../landingScroll.js'

describe('scrollLandingAnchor', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('scrolls clear of the sticky nav height', () => {
    document.body.innerHTML = `
      <div class="cw-landing--v4" style="--v4-nav-h: 68px">
        <section id="faq"></section>
      </div>
    `
    const section = document.getElementById('faq')
    vi.spyOn(section, 'getBoundingClientRect').mockReturnValue({
      top: 400,
      bottom: 800,
      left: 0,
      right: 0,
      width: 0,
      height: 400,
      x: 0,
      y: 400,
      toJSON: () => ({}),
    })
    const scrollTo = vi.fn()
    vi.stubGlobal('scrollY', 100)
    vi.stubGlobal('scrollTo', scrollTo)
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true })

    expect(scrollLandingAnchor('#faq', { behavior: 'auto' })).toBe(true)
    expect(scrollTo).toHaveBeenCalledWith({
      // 400 + 100 - 68 - 32 (mobile gap)
      top: 400,
      behavior: 'auto',
    })
  })

  it('returns false when the target is missing', () => {
    expect(scrollLandingAnchor('#missing')).toBe(false)
  })
})
