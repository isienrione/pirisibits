import { describe, expect, it } from 'vitest'
import { loadRomeManifest } from '../manifest.js'
import {
  collectThresholdAmbiencePaths,
  resolveThresholdAmbienceUrls,
  thresholdAmbiencePath,
} from '../thresholdAmbience.js'

describe('thresholdAmbience', () => {
  const manifest = loadRomeManifest()

  it('builds root-level Rome audio paths for threshold ambience files', () => {
    expect(thresholdAmbiencePath('ambience_now.mp3')).toBe('/rome/audio/ambience_now.mp3')
  })

  it('resolves manifest threshold ambience URLs', () => {
    const urls = resolveThresholdAmbienceUrls(manifest)
    expect(urls.nowAmbienceUrl).toContain('ambience_now.mp3')
    expect(urls.thenSoundscapeUrl).toContain('ambience_then.mp3')
  })

  it('collects threshold ambience paths for offline packaging', () => {
    expect(collectThresholdAmbiencePaths(manifest)).toEqual([
      '/rome/audio/ambience_now.mp3',
      '/rome/audio/ambience_then.mp3',
    ])
  })
})
