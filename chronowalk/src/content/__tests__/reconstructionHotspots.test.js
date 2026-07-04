import { describe, expect, it } from 'vitest'
import { getReconstructionScene } from '../reconstructionHotspots'
import { COLOSSEUM_WAYPOINT } from '../../data/colosseum'

describe('reconstructionHotspots', () => {
  it('returns colosseum hotspots and ancient reconstruction image', () => {
    const scene = getReconstructionScene({ id: 'colosseum' }, null)

    expect(scene.imageUrl).toBe(COLOSSEUM_WAYPOINT.ancient_image_url)
    expect(scene.hotspots.length).toBeGreaterThanOrEqual(4)
    expect(scene.hotspots[0]).toMatchObject({
      id: expect.any(String),
      x: expect.any(Number),
      y: expect.any(Number),
      title: expect.any(String),
      body: expect.any(String),
    })
  })

  it('prefers a provided exploration image url', () => {
    const scene = getReconstructionScene({ id: 'colosseum' }, '/custom/ancient.jpg')

    expect(scene.imageUrl).toBe('/custom/ancient.jpg')
  })

  it('falls back to default hotspots for unknown stops', () => {
    const scene = getReconstructionScene({ id: 'unknown-stop' }, '/ancient.jpg')

    expect(scene.imageUrl).toBe('/ancient.jpg')
    expect(scene.hotspots).toHaveLength(2)
  })
})
