import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

describe('mediaUrl with empty VITE_MEDIA_BASE', () => {
  const original = import.meta.env.VITE_MEDIA_BASE

  beforeEach(() => {
    import.meta.env.VITE_MEDIA_BASE = ''
  })

  afterEach(() => {
    import.meta.env.VITE_MEDIA_BASE = original
    vi.resetModules()
  })

  it('resolves relative bundled paths when base is empty', async () => {
    const { mediaUrl } = await import('../mediaUrl.js')
    expect(mediaUrl('/rome/audio/narration/w01.mp3')).toBe('/rome/audio/narration/w01.mp3')
    expect(mediaUrl('rome/audio/narration/w01.mp3')).toBe('/rome/audio/narration/w01.mp3')
    expect(mediaUrl('https://cdn.example/rome/a.mp3')).toBe('https://cdn.example/rome/a.mp3')
  })
})
