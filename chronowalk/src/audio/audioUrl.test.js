import { describe, expect, it } from 'vitest'
import { resolvePreviewUrl, resolveSystemUrl } from './audioUrl.js'

describe('resolvePreviewUrl', () => {
  it('loads the free sample from narration/', () => {
    expect(resolvePreviewUrl('w17_ch1.mp3')).toBe('/rome/audio/narration/w17_ch1.mp3')
    expect(resolveSystemUrl('preview_pantheon.mp3')).toBe('/rome/audio/system/preview_pantheon.mp3')
  })

  it('maps legacy preview_pantheon.mp3 to w17_ch1.mp3', () => {
    expect(resolvePreviewUrl('preview_pantheon.mp3')).toBe('/rome/audio/narration/w17_ch1.mp3')
  })
})
