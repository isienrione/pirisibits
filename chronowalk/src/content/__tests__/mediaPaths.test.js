import { describe, expect, it } from 'vitest'
import { loadRomeManifest } from '../manifest.js'
import { collectManifestMediaPaths } from '../mediaPaths.js'

describe('collectManifestMediaPaths', () => {
  const manifest = loadRomeManifest()

  it('collects reconstruction and hero assets for threshold waypoints', () => {
    const paths = collectManifestMediaPaths(manifest)

    expect(paths).toContain('/waypoints/colosseum/exterior/modern-poster.jpg')
    expect(paths).toContain('/waypoints/colosseum/exterior/ancient-reconstruction.mp4')
    expect(paths).toContain('/waypoints/forum-cluster/forum-arch-titus/ancient-reconstruction.mp4')
    expect(paths).toContain('/waypoints/forum-cluster/forum-arch-severus/ancient-reconstruction.mp4')
    expect(paths.length).toBeGreaterThanOrEqual(36)
  })
})
