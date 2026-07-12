import { describe, expect, it } from 'vitest'
import {
  MODERN_PHOTO_PATHS,
  TOUR_HERO_PHOTO,
  getModernExteriorUrl,
  getModernPosterUrl,
} from '../modernPhotoRegistry.js'

describe('modernPhotoRegistry', () => {
  it('maps colosseum to exterior subfolder', () => {
    expect(getModernPosterUrl('colosseum')).toBe(
      '/waypoints/colosseum/exterior/modern-poster.jpg'
    )
  })

  it('maps appian-way to via-appia asset folder', () => {
    expect(getModernExteriorUrl('appian-way')).toBe(
      '/waypoints/via-appia/modern-exterior.jpg'
    )
  })

  it('maps forum stops under forum-cluster', () => {
    expect(getModernPosterUrl('forum-curia-julia')).toContain(
      '/waypoints/forum-cluster/forum-curia-julia/'
    )
  })

  it('falls back to colosseum for unknown stops', () => {
    expect(getModernPosterUrl('unknown-stop')).toBe(TOUR_HERO_PHOTO)
  })

  it('covers all heart-of-rome and forum launch stops', () => {
    const stopIds = [
      'colosseum',
      'palatine-hill-cluster',
      'capitoline-hill',
      'trajan-market',
      'pantheon',
      'fontana-di-trevi',
      'largo-argentina',
      'campo-de-fiori',
      'piazza-navona',
      'castel-sant-angelo',
      'circus-maximus',
      'appian-way',
      'forum-arch-titus',
      'forum-basilica-maxentius',
      'forum-via-sacra',
      'forum-temple-vesta',
      'forum-rostra',
      'forum-temple-saturn',
      'forum-curia-julia',
      'forum-arch-severus',
    ]

    for (const id of stopIds) {
      expect(MODERN_PHOTO_PATHS[id]?.poster, id).toMatch(/modern-poster\.jpg$/)
      expect(MODERN_PHOTO_PATHS[id]?.exterior, id).toMatch(/modern-exterior\.jpg$/)
    }
  })
})
