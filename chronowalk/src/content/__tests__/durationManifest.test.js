import { describe, expect, it } from 'vitest'
import { loadRomeManifest } from '../manifest.js'
import {
  buildDurationsMap,
  durationCoverage,
  mergeDurationMaps,
  roundDuration,
  seedDurationsFromTransits,
} from '../durationManifest.js'

describe('durationManifest', () => {
  const manifest = loadRomeManifest()

  it('seeds transit narration durations from duration_s', () => {
    const seeds = seedDurationsFromTransits(manifest)
    expect(seeds['t02.mp3']).toBe(25)
    expect(seeds['t01_fork_a.mp3']).toBe(81)
    expect(seeds['t03_b.mp3']).toBe(30)
  })

  it('builds filename-keyed duration maps', () => {
    const map = buildDurationsMap([
      { path: '/rome/audio/narration/w01.mp3', durationSeconds: 123.456 },
    ])
    expect(map['w01.mp3']).toBe(123.5)
  })

  it('merges duration maps with later values winning', () => {
    expect(
      mergeDurationMaps({ 't02.mp3': 25 }, { 't02.mp3': 26.2, 'w01.mp3': 90 })
    ).toEqual({
      't02.mp3': 26.2,
      'w01.mp3': 90,
    })
  })

  it('reports duration coverage for shipping audio', () => {
    const sample = {
      ...manifest,
      durations: { 't02.mp3': 25 },
    }
    const coverage = durationCoverage(sample, ['/rome/audio/narration/t02.mp3', '/rome/audio/narration/w01.mp3'])
    expect(coverage.covered).toBe(1)
    expect(coverage.total).toBe(2)
    expect(coverage.missing).toEqual(['w01.mp3'])
  })

  it('rounds durations to one decimal', () => {
    expect(roundDuration(12.04)).toBe(12)
    expect(roundDuration(12.05)).toBe(12.1)
  })
})
