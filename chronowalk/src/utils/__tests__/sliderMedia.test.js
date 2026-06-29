import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  bustMediaUrl,
  getAncientSliderUrl,
  getModernCoverUrl,
  getModernPosterUrl,
  getModernSliderUrl,
  hasAncientSliderMedia,
  hasComparisonSliderMedia,
  isModernVideoImmersive,
  isSliderVideoUrl,
  prefetchArrivalSliderMedia,
  resetArrivalMediaPrefetchForTests,
} from '../sliderMedia'

const navona = {
  id: 'piazza-navona',
  media_cache_version: 2,
  modern_video_url: '/waypoints/piazza-navona/modern.mp4',
  ancient_video_url: '/waypoints/piazza-navona/ancient-reconstruction.mp4',
  modern_image_url: '/waypoints/piazza-navona/modern-exterior.jpg',
  modern_poster_url: '/waypoints/piazza-navona/modern-poster.jpg',
}

describe('sliderMedia', () => {
  it('appends cache-bust query for waypoint media', () => {
    expect(bustMediaUrl('/waypoints/piazza-navona/modern.mp4', navona)).toBe(
      '/waypoints/piazza-navona/modern.mp4?cwv=piazza-navona-2'
    )
  })

  it('leaves blob URLs unchanged for offline playback', () => {
    expect(bustMediaUrl('blob:offline-audio', navona)).toBe('blob:offline-audio')
  })

  it('resolves busted slider and poster URLs', () => {
    expect(getModernSliderUrl(navona)).toContain('piazza-navona-2')
    expect(getAncientSliderUrl(navona)).toContain('ancient-reconstruction.mp4')
    expect(getModernPosterUrl(navona)).toContain('modern-poster.jpg')
    expect(getModernCoverUrl(navona)).toContain('modern-exterior.jpg')
  })

  it('detects modern-video-only immersive stops', () => {
    const trevi = {
      id: 'fontana-di-trevi',
      immersive_mode: 'modern_video',
      modern_video_url: '/waypoints/fontana-di-trevi/modern.mp4',
      modern_image_url: '/waypoints/fontana-di-trevi/modern-exterior.jpg',
    }

    expect(isModernVideoImmersive(trevi)).toBe(true)
    expect(hasAncientSliderMedia(trevi)).toBe(false)
    expect(hasComparisonSliderMedia(trevi)).toBe(false)
    expect(hasComparisonSliderMedia(navona)).toBe(true)
  })

  it('detects slider video URLs', () => {
    expect(isSliderVideoUrl('/waypoints/colosseum/modern.mp4')).toBe(true)
    expect(isSliderVideoUrl('/waypoints/colosseum/modern.jpg')).toBe(false)
  })

  it('prefetches poster images and warms slider videos once per waypoint', () => {
    resetArrivalMediaPrefetchForTests()
    const imageSrcSpy = vi.spyOn(Image.prototype, 'src', 'set')
    const createElementSpy = vi.spyOn(document, 'createElement')

    prefetchArrivalSliderMedia(navona)
    prefetchArrivalSliderMedia(navona)

    expect(imageSrcSpy).toHaveBeenCalled()
    expect(createElementSpy).toHaveBeenCalledWith('video')

    imageSrcSpy.mockRestore()
    createElementSpy.mockRestore()
    resetArrivalMediaPrefetchForTests()
  })
})
