import { describe, expect, it } from 'vitest'
import { loadRomeManifest } from '../../manifest.js'
import { getVisibleStopCounts, getVisibleStopIds } from '../stopCounts.js'

describe('getVisibleStopCounts', () => {
  const manifest = loadRomeManifest()

  it('counts 20 visible stops on the default Rome path', () => {
    const counts = getVisibleStopCounts(manifest, 'a')

    expect(counts.total).toBe(20)
    expect(counts.waypointIds).toHaveLength(20)
    expect(counts.waypointIds).toContain('w04')
    expect(counts.waypointIds).toContain('w22')
    expect(counts.waypointIds).toContain('pause')
  })

  it('includes optional Palatine (w04) on path a and keeps encore (w22)', () => {
    const ids = getVisibleStopIds(manifest, 'a')
    expect(ids.filter((id) => id === 'w04')).toHaveLength(1)
    expect(ids).toContain('w22')
  })

  it('groups counts by act from the manifest', () => {
    const { byAct } = getVisibleStopCounts(manifest, 'a')

    expect(byAct.act1).toBe(2)
    expect(byAct.act2).toBe(2)
    expect(byAct.act3).toBe(7)
    expect(byAct.encore).toBe(1)
    expect(Object.values(byAct).reduce((sum, count) => sum + count, 0)).toBe(20)
  })

  it('counts 20 stops on path b as well', () => {
    expect(getVisibleStopCounts(manifest, 'b').total).toBe(20)
  })
})
