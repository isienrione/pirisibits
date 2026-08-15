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
import { resolveSequentialChapters } from '../v4/LandingProductSequentialDemo.jsx'

describe('landing product-story architecture (V4)', () => {
  it('defines the product-story section order', () => {
    expect(LANDING_SECTION_ORDER).toEqual([
      'hero',
      'monuments',
      'product-demo',
      'personas',
      'pricing',
      'faq',
      'trust',
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

  it('frames the product demo as four sequential chapters', () => {
    const section = LANDING_CONTENT['product-demo']
    expect(section.id).toBe('how-it-works')
    expect(section.eyebrow).toBe('The App')
    expect(section.headline).toBe('How does ChronoWalk work?')
    expect(section.subheadline).not.toMatch(/scroll to follow/i)
    expect(section.chapters).toHaveLength(4)
    expect(section.chapters.map((c) => c.id)).toEqual([
      'begin',
      'arrive',
      'listen',
      'walk',
    ])
    expect(section.chapters.map((c) => c.component)).toEqual([
      'LandingDemoBeginTourScreen',
      'LandingDemoArriveCampo',
      'LandingDemoListenLockup',
      'LandingDemoWalkLockup',
    ])
    expect(section.chapters[1].emotional).toBe(true)
    expect(resolveSequentialChapters(section.chapters).map((c) => c.id)).toEqual([
      'begin',
      'arrive',
      'listen',
      'walk',
    ])
  })

  it('keeps the product demo free of sticky scrub timelines', () => {
    const section = LANDING_CONTENT['product-demo']
    expect(section.chapters.some((chapter) => chapter.id === 'choose')).toBe(false)
    expect(section.chapters[0].title).toMatch(/begin your chosen walking route/i)
  })

  it('uses situation-led personas instead of demographics', () => {
    const section = LANDING_CONTENT.personas
    expect(section.id).toBe('who-its-for')
    expect(section.items).toHaveLength(5)
    expect(section.headline).toBe('ChronoWalk is your reliable companion')
    expect(section.items.map((item) => item.headline)).toEqual(
      expect.arrayContaining([
        'No Colosseum ticket?',
        'Not a fan of rigid tour schedules?',
        'Guided tours outside your budget?',
      ]),
    )
    expect(section.items.find((item) => item.id === 'no-tickets')?.imageKey).toBe('trevi')
  })

  it('keeps a clear product-category hero with paid unlock and Pantheon preview', () => {
    const hero = LANDING_CONTENT.hero
    expect(hero.eyebrow).toMatch(/self-guided audio walking tour of rome/i)
    expect(hero.headline).toBe('Ancient Rome, brought back to life as you walk.')
    expect(hero.accentLine).toBe('At your own pace.')
    expect(hero.subheadline).toMatch(/Enjoy the Colosseum, Roman Forum, The Pantheon & 18 other stops/i)
    expect(hero.subheadline).toMatch(/immersive audio/i)
    expect(hero.subheadline).toMatch(/visual ancient reconstructions/i)
    expect(hero.subheadlineHighlight).toBe(
      'Colosseum, Roman Forum, The Pantheon & 18 other stops',
    )
    // Avoid “Rome” stacking in the first viewport (eyebrow + headline only).
    const romeHits = `${hero.eyebrow} ${hero.headline} ${hero.accentLine} ${hero.subheadline}`.match(
      /\bRome\b/gi,
    )
    expect(romeHits?.length ?? 0).toBeLessThanOrEqual(2)
    expect(hero.primaryCta).toBe(LANDING_CTA.tryPantheonFree)
    expect(hero.primaryCtaAriaLabel).toBe(LANDING_CTA.tryPantheonFree)
    expect(hero.primaryCtaMeta).toBeNull()
    expect(hero.secondaryCta).toBeNull()
    expect(hero.getAppCta).toBe(LANDING_CTA.unlockRomePriced)
    expect(hero.getAppCta).toMatch(/Try a tour from €4\.99|from €9\.99/)
    expect(hero.getAppHref).toBe('#pricing')
    expect(hero.primaryHref).toBe('/preview')
    expect(hero.trustLine).toBeNull()
    expect(hero.ctaPriority).toBe('unlock')
  })

  it('exposes a compact post-hero reassurance strip with factual claims only', () => {
    const strip = LANDING_CONTENT.heroReassurance
    expect(strip.id).toBe('hero-reassurance')
    expect(strip.items).toHaveLength(4)
    expect(strip.items.map((item) => item.label)).toEqual([
      'No app-store download',
      'Offline mode available',
      'One payment',
      'Not sure yet? Try before you buy',
    ])
    expect(strip.items.map((item) => item.support)).toEqual([
      'Opens in your browser, works as a mobile app',
      'Set up before you head out and get ready to walk',
      'No subscriptions',
      'Enjoy Pantheon Part 1 (FREE)',
    ])
    const tryFree = strip.items.find((item) => item.id === 'try-free')
    expect(tryFree.supportLinkText).toBe('Pantheon Part 1 (FREE)')
    expect(tryFree.supportLinkHref).toBe('/free-pantheon')
    const blob = JSON.stringify(strip).toLowerCase()
    expect(blob).not.toMatch(/best.?seller|testimonial|★|award|limited|most popular/)
  })

  it('mounts the reassurance strip once in ChronoWalkLanding, under the hero', async () => {
    // File-based check keeps placement stable without mounting the full landing tree.
    const { readFileSync } = await import('node:fs')
    const { fileURLToPath } = await import('node:url')
    const { dirname, join } = await import('node:path')
    const landingPath = join(dirname(fileURLToPath(import.meta.url)), '../ChronoWalkLanding.jsx')
    const text = readFileSync(landingPath, 'utf8')
    expect(text).toMatch(/import LandingHeroReassurance from '\.\/v4\/LandingHeroReassurance\.jsx'/)
    expect(text.match(/<LandingHeroReassurance\b[^>]*\/>/g)).toHaveLength(1)
    const heroIdx = text.indexOf('<LandingProductHero')
    const stripIdx = text.indexOf('<LandingHeroReassurance')
    expect(heroIdx).toBeGreaterThan(-1)
    expect(stripIdx).toBeGreaterThan(heroIdx)
  })

  it('mounts Act II as carousel → how-it-works → personas → pricing', async () => {
    const { readFileSync } = await import('node:fs')
    const { fileURLToPath } = await import('node:url')
    const { dirname, join } = await import('node:path')
    const landingPath = join(dirname(fileURLToPath(import.meta.url)), '../ChronoWalkLanding.jsx')
    const text = readFileSync(landingPath, 'utf8')
    const carouselIdx = text.indexOf('<LandingStopCarousel')
    const demoIdx = text.indexOf('<LandingProductDemo')
    const personasIdx = text.indexOf('<LandingPersonas')
    const pricingIdx = text.indexOf('<LandingRomeTiersSection')
    expect(carouselIdx).toBeGreaterThan(-1)
    expect(demoIdx).toBeGreaterThan(carouselIdx)
    expect(personasIdx).toBeGreaterThan(demoIdx)
    expect(pricingIdx).toBeGreaterThan(personasIdx)
  })

  it('shows a nav Try a tour CTA that deep-links to the get-app section', () => {
    expect(LANDING_CONTENT.header.cta).toBe(LANDING_CTA.getApp)
    expect(LANDING_CONTENT.header.cta).toMatch(/Try a tour from €4\.99|Get the tour/)
    expect(LANDING_CONTENT.header.ctaHref).toBe('#get-app')
    expect(LANDING_CONTENT.header.ctaShort).toMatch(/Get Tour|Try from €4\.99/)
  })

  it('removes the top-right header sneak-peek CTA', () => {
    expect(LANDING_CONTENT.header.cta).not.toBe(LANDING_CTA.tryFreeSneakPeek)
  })

  it('ships trust as an expandable checklist', () => {
    const section = LANDING_CONTENT.trust
    expect(section.checklist.map((row) => row.title)).toEqual([
      'Works in your browser',
      'Prepare for offline use',
      'One-time purchase',
      'Uses your location',
      'Evidence stated honestly',
      'Progress saved',
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
    expect(LANDING_CONTENT.hero.eyebrow).toBeTruthy()
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
      'roma centrale',
      'private guide',
      'most loved',
      'most popular',
    ]) {
      expect(joined).not.toContain(banned)
    }
    expect(joined).toContain('get a free sneak peek')
    expect(joined).not.toContain('\u2014')
  })
})
