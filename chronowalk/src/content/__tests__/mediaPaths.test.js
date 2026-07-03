import { describe, expect, it } from 'vitest'
import { loadRomeManifest } from '../manifest.js'
import { collectManifestMediaPaths } from '../mediaPaths.js'

describe('collectManifestMediaPaths', () => {
  const manifest = loadRomeManifest()

  it('collects reconstruction and hero assets for threshold waypoints', () => {
    const paths = collectManifestMediaPaths(manifest)

    expect(paths).toContain('/rome/img/w01_hero.avif')
    expect(paths).toContain('/rome/img/w01_now.avif')
    expect(paths).toContain('/rome/img/w01_then.avif')
    expect(paths).toContain('/rome/video/w01_then_loop.mp4')
    expect(paths).toContain('/rome/img/w03_now.avif')
    expect(paths).toContain('/rome/video/w13_then_loop.mp4')
    expect(paths.length).toBe(10)
  })
})
