import { describe, expect, it } from 'vitest'
import {
  findDurationMismatches,
  getExpectedDurationSeconds,
  isBlobPlausibleForDuration,
  minimumBytesForDuration,
} from '../durationVerification.js'
import { loadRomeManifest } from '../manifest.js'

describe('durationVerification', () => {
  const manifest = loadRomeManifest()

  it('reads expected duration by filename key', () => {
    const sample = {
      ...manifest,
      durations: {
        'w01.mp3': 120,
      },
    }

    expect(getExpectedDurationSeconds(sample, '/rome/audio/narration/w01.mp3')).toBe(120)
  })

  it('accepts blobs that meet the minimum size for a duration', () => {
    expect(isBlobPlausibleForDuration(minimumBytesForDuration(30), 30)).toBe(true)
    expect(isBlobPlausibleForDuration(1_000, 30)).toBe(false)
  })

  it('flags duration mismatches when manifest durations are present', () => {
    const sample = {
      ...manifest,
      durations: {
        'w01.mp3': 60,
      },
    }

    const mismatches = findDurationMismatches(sample, [
      { path: '/rome/audio/narration/w01.mp3', blobSize: 120_000 },
      { path: '/rome/audio/narration/w02.mp3', blobSize: 10 },
    ])

    expect(mismatches).toHaveLength(1)
    expect(mismatches[0].path).toContain('w01.mp3')
  })
})
