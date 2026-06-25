import { describe, expect, it } from 'vitest'
import {
  bustMediaUrl,
  getAncientSliderUrl,
  getModernPosterUrl,
  getModernSliderUrl,
} from '../sliderMedia'

const navona = {
  id: 'piazza-navona',
  media_cache_version: 2,
  modern_video_url: '/waypoints/piazza-navona/modern.mp4',
  ancient_video_url: '/waypoints/piazza-navona/ancient-reconstruction.mp4',
  modern_poster_url: '/waypoints/piazza-navona/modern-poster.jpg',
}

describe('sliderMedia', () => {
  it('appends cache-bust query for waypoint media', () => {
    expect(bustMediaUrl('/waypoints/piazza-navona/modern.mp4', navona)).toBe(
      '/waypoints/piazza-navona/modern.mp4?cwv=piazza-navona-2'
    )
  })

  it('resolves busted slider and poster URLs', () => {
    expect(getModernSliderUrl(navona)).toContain('piazza-navona-2')
    expect(getAncientSliderUrl(navona)).toContain('ancient-reconstruction.mp4')
    expect(getModernPosterUrl(navona)).toContain('modern-poster.jpg')
  })
})
