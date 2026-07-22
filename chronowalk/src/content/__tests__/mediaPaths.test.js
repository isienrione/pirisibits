import { describe, expect, it } from 'vitest'
import { loadRomeManifest } from '../manifest.js'
import { collectManifestMediaPaths } from '../mediaPaths.js'

describe('collectManifestMediaPaths', () => {
  const manifest = loadRomeManifest()

  it('collects reconstruction and hero assets for threshold waypoints', () => {
    const paths = collectManifestMediaPaths(manifest)

    expect(paths).toContain('/waypoints/colosseum/exterior/modern-poster.jpg')
    expect(paths).toContain('/waypoints/colosseum/exterior/ancient-reconstruction.mp4')
    expect(paths).toContain('/waypoints/colosseum/interior/modern-poster.jpg')
    expect(paths).toContain('/waypoints/spanish-steps/modern-poster.jpg')
    expect(paths).toContain('/waypoints/spanish-steps/ancient-reconstruction.mp4')
    expect(paths).toContain('/waypoints/via-appia/modern-poster.jpg')
    expect(paths.length).toBe(new Set(paths).size)
    expect(paths.length).toBeGreaterThanOrEqual(20)
  })
})
