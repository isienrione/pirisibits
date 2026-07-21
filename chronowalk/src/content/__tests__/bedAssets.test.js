import { describe, expect, it } from 'vitest'
import { statSync } from 'node:fs'
import { join } from 'node:path'

const BEDS_DIR = join(process.cwd(), 'public/rome/audio/beds')

describe('ambient bed assets', () => {
  it('ships antiquity and river loop files for zone playback', () => {
    for (const file of ['bed_antiquity.mp3', 'bed_river.mp3']) {
      const path = join(BEDS_DIR, file)
      const { size } = statSync(path)
      // Prior stand-ins were ~1.05 MB but inaudible (~−65 dB); replacements are louder masters.
      expect(size).toBeGreaterThan(1_000_000)
    }
  })
})
