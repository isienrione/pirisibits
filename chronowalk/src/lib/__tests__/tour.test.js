import { describe, expect, it } from 'vitest'
import { loadTourManifest, getWaypoint, getTraversalSequence } from '../tour'

describe('tour manifest loader', () => {
  it('loads the acts-based rome manifest', async () => {
    const manifest = await loadTourManifest()

    expect(manifest.acts).toHaveLength(7)
    expect(manifest.waypoints.length).toBeGreaterThan(15)
    expect(getWaypoint(manifest, 'w17')?.chapters).toHaveLength(4)
  })

  it('exposes path-specific traversal sequences', async () => {
    const manifest = await loadTourManifest()
    const pathA = getTraversalSequence(manifest, 'a')
    const pathB = getTraversalSequence(manifest, 'b')

    expect(pathA.indexOf('w03')).toBeLessThan(pathA.indexOf('w06'))
    expect(pathB.indexOf('w04')).toBeLessThan(pathB.indexOf('w03'))
  })
})
