import { describe, expect, it } from 'vitest'
import { collectWikimediaCredits, ABOUT_IMAGERY_COPY } from '../imageCredits.js'

describe('imageCredits', () => {
  it('collects wikimedia credits from the manifest', () => {
    const manifest = {
      waypoints: {
        w01: {
          title: 'The Colosseum',
          now_image: {
            source: 'wikimedia',
            credit: 'Photo: Ada Lovelace, Wikimedia Commons',
            source_url: 'https://commons.wikimedia.org/wiki/File:Colosseum.jpg',
          },
        },
        w02: {
          title: 'Interior',
          now_image: { source: 'ai_generated', credit: null, source_url: null },
        },
      },
    }

    expect(collectWikimediaCredits(manifest)).toEqual([
      {
        id: 'w01',
        title: 'The Colosseum',
        credit: 'Photo: Ada Lovelace, Wikimedia Commons',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Colosseum.jpg',
      },
    ])
  })

  it('ships the about-imagery disclosure copy verbatim', () => {
    expect(ABOUT_IMAGERY_COPY).toContain('Present-day photographs are sourced from Wikimedia Commons')
    expect(ABOUT_IMAGERY_COPY).toContain("see each waypoint's caption for source notes.")
  })
})
