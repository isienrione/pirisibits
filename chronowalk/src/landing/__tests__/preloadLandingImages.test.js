import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { preloadLandingImages, retryImageOnError } from '../v4/preloadLandingImages.js'

describe('preloadLandingImages', () => {
  const OriginalImage = globalThis.Image

  beforeEach(() => {
    globalThis.Image = class {
      constructor() {
        this.decoding = 'auto'
        this.src = ''
      }
    }
  })

  afterEach(() => {
    globalThis.Image = OriginalImage
  })

  it('creates Image requests for each valid url', () => {
    const created = []
    globalThis.Image = class {
      constructor() {
        created.push(this)
        this.decoding = 'auto'
        this.src = ''
      }
    }

    preloadLandingImages([
      '/landing/hero-slides/then-now.png',
      null,
      '/landing/hero-slides/package-roma-eterna.png',
    ])

    expect(created).toHaveLength(2)
    expect(created.map((img) => img.src)).toEqual([
      '/landing/hero-slides/then-now.png',
      '/landing/hero-slides/package-roma-eterna.png',
    ])
    expect(created.every((img) => img.decoding === 'async')).toBe(true)
  })

  it('retries a broken image once with a cache-bust query', () => {
    const img = {
      dataset: {},
      src: '/landing/hero-slides/ruin-room.png',
      removeAttribute: vi.fn((name) => {
        if (name === 'src') img.src = ''
      }),
    }

    retryImageOnError({ currentTarget: img })
    expect(img.dataset.cwRetry).toBe('1')
    expect(img.src).toMatch(/^\/landing\/hero-slides\/ruin-room\.png\?cw_img=\d+$/)

    const afterFirst = img.src
    retryImageOnError({ currentTarget: img })
    expect(img.src).toBe(afterFirst)
  })
})
