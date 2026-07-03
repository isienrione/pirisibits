import { describe, expect, it } from 'vitest'
import { loadRomeManifest } from '../manifest.js'
import { collectManifestAudioPaths } from '../audioPaths.js'
import { parseRomeManifest } from '../manifest.schema.js'
import rawManifest from '../rome/manifest.json'

describe('rome content manifest', () => {
  it('parses and validates the shipping manifest', () => {
    const manifest = parseRomeManifest(rawManifest)
    expect(manifest.city).toBe('rome')
    expect(manifest.acts).toHaveLength(7)
    expect(Object.keys(manifest.waypoints)).toContain('w01')
    expect(Object.keys(manifest.waypoints)).toContain('enc_circus')
    expect(manifest.waypoints.w02.chapters).toEqual(['w02_ch1.mp3', 'w02_ch2.mp3'])
  })

  it('rejects an invalid zone reference', () => {
    const invalid = structuredClone(rawManifest)
    invalid.waypoints.w01.zone = 'mars'
    expect(() => parseRomeManifest(invalid)).toThrow(/not a defined bed key/)
  })

  it('normalizes traversal order for the default path', () => {
    const manifest = loadRomeManifest()
    expect(manifest.waypoints[0]?.id).toBe('w01')
    expect(manifest.waypoints.at(-1)?.id).toBe('w22')
    expect(manifest.journey.sequences.a[0]).toBe('w01')
  })

  it('collects narration, beds, inserts, and system audio paths', () => {
    const manifest = parseRomeManifest(rawManifest)
    const paths = collectManifestAudioPaths(manifest)
    expect(paths).toContain('/rome/audio/narration/w01.mp3')
    expect(paths).toContain('/rome/audio/beds/bed_antiquity.mp3')
    expect(paths).toContain('/rome/audio/inserts/ins_fire.mp3')
    expect(paths).toContain('/rome/audio/system/sfx_presence.mp3')
    expect(paths.length).toBeGreaterThan(60)
  })
})
