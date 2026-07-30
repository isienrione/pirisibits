import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  clearCachedAudio,
  registerCachedAudio,
  resolvePreviewUrl,
  resolveSystemUrl,
  resolveSystemUrlAsync,
} from './audioUrl.js'

describe('resolvePreviewUrl', () => {
  it('loads the free sample from narration/', () => {
    expect(resolvePreviewUrl('w17_ch1.mp3')).toBe('/rome/audio/narration/w17_ch1.mp3')
    expect(resolveSystemUrl('preview_pantheon.mp3')).toBe('/rome/audio/system/preview_pantheon.mp3')
  })

  it('maps legacy preview_pantheon.mp3 to w17_ch1.mp3', () => {
    expect(resolvePreviewUrl('preview_pantheon.mp3')).toBe('/rome/audio/narration/w17_ch1.mp3')
  })
})

describe('resolveSystemUrlAsync', () => {
  beforeEach(() => {
    clearCachedAudio()
  })

  afterEach(() => {
    clearCachedAudio()
    vi.restoreAllMocks()
  })

  it('returns an in-memory blob URL without hitting the network path', async () => {
    registerCachedAudio('/rome/audio/system/ui_arrival_chime.mp3', 'blob:chime')
    await expect(resolveSystemUrlAsync('ui_arrival_chime.mp3')).resolves.toBe('blob:chime')
  })

  it('hydrates from Cache API when the blob map is cold', async () => {
    const offline = await import('./offlinePackage.js')
    vi.spyOn(offline, 'hydrateCachedManifestPath').mockResolvedValue('blob:hydrated-chime')

    const url = await resolveSystemUrlAsync('ui_arrival_chime.mp3')
    expect(url).toBe('blob:hydrated-chime')
    expect(offline.hydrateCachedManifestPath).toHaveBeenCalledWith(
      '/rome/audio/system/ui_arrival_chime.mp3',
      { kind: 'audio' },
    )
  })
})
