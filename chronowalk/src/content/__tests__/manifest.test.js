import { describe, expect, it } from 'vitest'
import { loadRomeManifest } from '../manifest.js'
import { collectManifestAudioPaths } from '../audioPaths.js'
import { chapterFile } from '../chapterMeta.js'
import { parseRomeManifest } from '../romeManifestZod.schema.js'
import rawManifest from '../rome/manifest.json'

describe('rome content manifest', () => {
  it('parses and validates the shipping manifest', () => {
    const manifest = parseRomeManifest(rawManifest)
    expect(manifest.city).toBe('rome')
    expect(manifest.acts).toHaveLength(7)
    expect(Object.keys(manifest.waypoints)).toContain('w01')
    expect(Object.keys(manifest.waypoints)).toContain('w22')
    expect(manifest.waypoints.w02.chapters.map(chapterFile)).toEqual(['w02_ch1.mp3', 'w02_ch2.mp3'])
    expect(manifest.waypoints.w01.transcript).toMatch(/underwater/i)
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
    expect(paths).toContain('/rome/audio/beds/bed_river.mp3')
    expect(paths).toContain('/rome/audio/inserts/ins_fire.mp3')
    expect(paths).toContain('/rome/audio/system/sfx_presence.mp3')
    expect(paths.length).toBeGreaterThan(60)
  })

  it('assigns antiquity and river beds per the sound production plan', () => {
    const manifest = parseRomeManifest(rawManifest)
    const { waypoints, transits } = manifest

    // antiquity: Palatine → Forum → Trajan (+ Circus / Appia encore)
    for (const id of [
      'w03',
      'w04',
      'w06',
      'w07',
      'w08',
      'pause',
      'w10',
      'w11_12',
      'w13',
      'w14',
      'enc_circus',
      'w22',
    ]) {
      expect(waypoints[id].zone, id).toBe('antiquity')
    }

    // river: Castel approach + finale
    expect(waypoints.w21.zone).toBe('river')
    expect(transits.t16.zone).toBe('river')

    // living city should not steal the antiquity bed
    for (const id of ['w15', 'w16', 'w17', 'w18', 'w19', 'w20']) {
      expect(waypoints[id].zone, id).toBe('centro')
    }

    // Pantheon interior is its own stop (Colosseum exterior→interior pattern)
    expect(waypoints.w17.chapters).toHaveLength(1)
    expect(waypoints.w23.zone).toBe('pantheon_interior')
    expect(waypoints.w23.chapters.map((ch) => ch.file ?? ch)).toEqual([
      'w17_ch2.mp3',
      'w17_ch3.mp3',
      'w17_ch4.mp3',
    ])
    expect(transits.t13.after).toBe('w23')
  })
})

