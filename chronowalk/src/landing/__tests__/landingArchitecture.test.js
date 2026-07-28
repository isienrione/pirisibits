import { describe, expect, it } from 'vitest'
import {
  getLandingFaqItems,
  LANDING_ACTS,
  LANDING_CONTENT,
  LANDING_CTA,
  LANDING_LEGACY_DEEPLINK_IDS,
  LANDING_PRESERVED_LOWER_SECTIONS,
  LANDING_SECTION_ORDER,
  LANDING_VERIFIED_REVIEWS,
} from '../landingData.js'
import { chapterScrollWeight } from '../v4/productDemoTimeline.js'

describe('landing product-story architecture (V4)', () => {
  it('defines the product-story section order', () => {
    expect(LANDING_SECTION_ORDER).toEqual([
      'hero',
      'product-demo',
      'monuments',
      'personas',
      'pricing',
      'trust',
      'faq',
    ])
  })

  it('keeps act section lists aligned with LANDING_SECTION_ORDER', () => {
    const fromActs = LANDING_ACTS.flatMap((act) => act.sections)
    expect(fromActs).toEqual(LANDING_SECTION_ORDER)
  })

  it('provides content keys and stable ids for every primary beat', () => {
    for (const key of LANDING_SECTION_ORDER) {
      const section = LANDING_CONTENT[key]
      expect(section, `missing LANDING_CONTENT.${key}`).toBeTruthy()
      expect(section.id, `missing id for ${key}`).toEqual(expect.any(String))
      expect(section.id.length).toBeGreaterThan(0)
    }
  })

  it('no longer mounts repeated feature matrices as preserved-lower sections', () => {
    expect(LANDING_PRESERVED_LOWER_SECTIONS).toEqual([])
  })

  it('exposes legacy deeplink ids for scroll/hash resolution', () => {
    expect(LANDING_LEGACY_DEEPLINK_IDS).toEqual(
      expect.arrayContaining(['rome-journey', 'letter', 'who-its-for', 'compare', 'trust']),
    )
  })

  it('frames the sticky phone demo as four chapters', () => {
    const section = LANDING_CONTENT['product-demo']
    expect(section.id).toBe('how-it-works')
    expect(section.headline).toBe('How does ChronoWalk work?')
    expect(section.chapters).toHaveLength(4)
    expect(section.chapters.map((c) => c.id)).toEqual([
      'choose',
      'arrive',
      'listen',
      'walk',
    ])
    expect(section.chapters.map((c) => c.component)).toEqual([
      'B4PaceSelector',
      'A2FreePreviewStory',
      'A2FreePreviewStory',
      'C2Walking',
    ])
    expect(section.chapters[1].emotional).toBe(true)
  })

  it('gives the cinematic demo generous scroll weight', () => {
    const chapters = LANDING_CONTENT['product-demo'].chapters
    const total = chapters.reduce((sum, chapter) => sum + chapterScrollWeight(chapter), 0)
    expect(total).toBeGreaterThanOrEqual(20)
    expect(chapterScrollWeight(chapters[1])).toBeGreaterThan(chapterScrollWeight(chapters[0]))
  })

  it('uses situation-led personas instead of demographics', () => {
    const section = LANDING_CONTENT.personas
    expect(section.id).toBe('who-its-for')
    expect(section.items).toHaveLength(5)
    expect(section.items.map((item) => item.headline)).toEqual(
      expect.arrayContaining([
        "Didn't get Colosseum tickets?",
        'Hate rigid tour schedules?',
        'Want guided tours without paying €70?',
      ]),
    )
  })

  it('keeps the hero to one free sneak-peek CTA', () => {
    const hero = LANDING_CONTENT.hero
    expect(hero.primaryCta).toBe(LANDING_CTA.tryFreeSneakPeek)
    expect(hero.primaryCta).toBe('Try a free sneak peek')
    expect(hero.secondaryCta).toBeNull()
    expect(hero.reviewsCta).toBeNull()
    expect(hero.primaryHref).toBe('/preview')
  })

  it('ships trust as an expandable checklist', () => {
    const section = LANDING_CONTENT.trust
    expect(section.checklist.map((row) => row.title)).toEqual([
      'Works in browser',
      'Offline',
      'One-time purchase',
      'GPS aware',
      'Evidence-based',
      'Saved progress',
    ])
    expect(LANDING_VERIFIED_REVIEWS).toEqual([])
  })

  it('orders the FAQ by buying anxiety groups', () => {
    const groups = LANDING_CONTENT.faq.groups
    expect(groups.map((group) => group.label)).toEqual([
      'Understanding the product',
      'Using it in Rome',
      'Purchase and access',
      'Content and trust',
    ])
    const items = getLandingFaqItems()
    expect(items).toHaveLength(18)
  })

  it('defines three narrative acts with navigation ids', () => {
    expect(LANDING_ACTS.map((act) => act.id)).toEqual([
      'act-open',
      'act-walk',
      'act-choose',
    ])
    expect(LANDING_ACTS.map((act) => ({ index: act.index, name: act.name }))).toEqual([
      { index: 'I', name: 'The Open' },
      { index: 'II', name: 'The Walk' },
      { index: 'III', name: 'The Choice' },
    ])
  })

  it('keeps ChronoWalk voice without banned marketing phrases', () => {
    expect(LANDING_CONTENT.hero.eyebrow).toBe('ChronoWalk')
    expect(LANDING_CONTENT['product-demo'].headline).toBe('How does ChronoWalk work?')
    const joined = JSON.stringify(LANDING_CONTENT).toLowerCase()
    for (const banned of [
      'revolutionary',
      'immersive experience',
      'unforgettable',
      'cutting-edge',
      'seamless',
      'unlock the magic',
      'hidden gems',
    ]) {
      expect(joined).not.toContain(banned)
    }
  })
})
