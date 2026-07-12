import { describe, expect, it } from 'vitest'
import { nowImageSchema } from '../nowImage.schema.js'
import { parseRomeManifest } from '../romeManifestZod.schema.js'
import rawManifest from '../rome/manifest.json'

describe('nowImage schema', () => {
  it('accepts placeholder now_image entries with null source', () => {
    expect(
      nowImageSchema.parse({
        file: 'w01_now.avif',
        source: null,
        license: null,
        credit: null,
        source_url: null,
      })
    ).toBeTruthy()
  })

  it('requires license and credit for wikimedia sources', () => {
    expect(() =>
      nowImageSchema.parse({
        file: 'w03_now.avif',
        source: 'wikimedia',
        license: null,
        credit: null,
        source_url: null,
      })
    ).toThrow(/license is required/i)

    expect(() =>
      nowImageSchema.parse({
        file: 'w03_now.avif',
        source: 'wikimedia',
        license: 'CC-BY-4.0',
        credit: null,
        source_url: 'https://commons.wikimedia.org/wiki/File:Example.jpg',
      })
    ).toThrow(/credit is required/i)
  })

  it('accepts valid wikimedia metadata', () => {
    expect(
      nowImageSchema.parse({
        file: 'w03_now.avif',
        source: 'wikimedia',
        license: 'CC-BY-4.0',
        credit: 'Photo: Example Photographer, Wikimedia Commons',
        source_url: 'https://commons.wikimedia.org/wiki/File:Example.jpg',
      })
    ).toBeTruthy()
  })

  it('rejects non-commercial license strings via enum', () => {
    expect(() =>
      nowImageSchema.parse({
        file: 'w03_now.avif',
        source: 'wikimedia',
        license: 'CC-BY-NC-4.0',
        credit: 'Photo: Example, Wikimedia Commons',
        source_url: 'https://commons.wikimedia.org/wiki/File:Example.jpg',
      })
    ).toThrow()
  })

  it('allows null license and credit for ai_generated sources', () => {
    expect(
      nowImageSchema.parse({
        file: 'w04_now.avif',
        source: 'ai_generated',
        license: null,
        credit: null,
        source_url: null,
      })
    ).toBeTruthy()
  })
})

describe('manifest now_image placeholders', () => {
  it('includes now_image on every waypoint in the shipping manifest', () => {
    const manifest = parseRomeManifest(rawManifest)
    for (const [id, waypoint] of Object.entries(manifest.waypoints)) {
      expect(waypoint.now_image, id).toBeTruthy()
      expect(waypoint.now_image.file).toBeTruthy()
    }
  })
})
