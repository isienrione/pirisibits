import { describe, expect, it } from 'vitest'
import { COLOSSEUM_WAYPOINT } from '../../data/colosseum'
import { buildStopFromLegacy } from '../../content/legacyStopAdapter'
import { resolveReconstructionMedia } from '../reconstructionMedia'

describe('reconstructionMedia', () => {
  it('prefers the ancient still for exploration', () => {
    const stop = buildStopFromLegacy('colosseum', 0, 'palatine-hill-cluster')
    const media = resolveReconstructionMedia(stop, COLOSSEUM_WAYPOINT)

    expect(media.imageUrl).toContain(COLOSSEUM_WAYPOINT.ancient_image_url)
    expect(media.hasExploration).toBe(true)
  })

  it('uses poster fallback when only video urls exist', () => {
    const media = resolveReconstructionMedia(
      { reconstructionThen: '/waypoints/test/ancient.mp4' },
      {
        id: 'test',
        ancient_poster_url: '/waypoints/test/ancient-poster.jpg',
        ship_assets: true,
      }
    )

    expect(media.imageUrl).toContain('/waypoints/test/ancient-poster.jpg')
  })
})
