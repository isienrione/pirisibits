import { describe, expect, it } from 'vitest'
import { COLOSSEUM_WAYPOINT } from '../../data/colosseum'
import { buildStopFromLegacy } from '../../content/legacyStopAdapter'
import { resolveThresholdMedia } from '../thresholdMedia'

describe('thresholdMedia', () => {
  it('prefers poster stills for ceremonial threshold compare', () => {
    const stop = buildStopFromLegacy('colosseum', 0, 'palatine-hill-cluster')
    const media = resolveThresholdMedia(stop, COLOSSEUM_WAYPOINT)

    expect(media.modernUrl).toContain(COLOSSEUM_WAYPOINT.modern_poster_url)
    expect(media.ancientUrl).toContain(COLOSSEUM_WAYPOINT.ancient_poster_url)
    expect(media.hasComparison).toBe(true)
  })

  it('falls back to hero image when modern poster is unavailable', () => {
    const media = resolveThresholdMedia(
      { heroImage: '/waypoints/test/modern.jpg', reconstructionThen: '/waypoints/test/ancient.jpg' },
      null
    )

    expect(media.modernUrl).toBe('/waypoints/test/modern.jpg')
    expect(media.ancientUrl).toBe('/waypoints/test/ancient.jpg')
  })
})
