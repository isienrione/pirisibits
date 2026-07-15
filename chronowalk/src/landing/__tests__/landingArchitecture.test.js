import { describe, expect, it } from 'vitest'
import {
  getLandingFaqItems,
  LANDING_ACTS,
  LANDING_CONTENT,
  LANDING_LEGACY_DEEPLINK_IDS,
  LANDING_PRESERVED_LOWER_SECTIONS,
  LANDING_SECTION_ORDER,
  LANDING_VERIFIED_REVIEWS,
} from '../landingData.js'

describe('landing editorial architecture', () => {
  it('defines the three-act section order', () => {
    expect(LANDING_SECTION_ORDER).toEqual([
      'hero',
      'interlude',
      'threshold',
      'early-cta',
      'user-flow',
      'real-moment',
      'monuments',
      'benefits',
      'try-free',
      'pricing',
      'why',
      'trust',
      'after-rome',
      'faq',
      'final-cta',
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

  it('maps real-moment to playbook scenarios instead of persona cards', () => {
    const section = LANDING_CONTENT['real-moment']
    expect(section.scenarios).toHaveLength(4)
    expect(section.scenarios.map((s) => s.prompt)).toEqual([
      'No ticket?',
      'Free afternoon?',
      'Love to wander?',
      'History curious?',
    ])
    expect(section.aside).toBeUndefined()
    expect(section.body).toBeUndefined()
  })

  it('lists benefits once under What stays with you', () => {
    expect(LANDING_CONTENT.benefits.headline).toBe('What stays with you.')
    expect(LANDING_CONTENT.benefits.items.map((item) => item.title)).toEqual([
      'Stories where you stand',
      'Your pace',
      'Downloaded once',
      'Yours to keep',
    ])
    expect(LANDING_CONTENT['user-flow'].more).toBeUndefined()
  })

  it('frames the free preview as one stop with clear inclusions', () => {
    const section = LANDING_CONTENT['try-free']
    expect(section.headline).toContain('One stop.')
    expect(section.primaryCta).toBe('Try one stop free')
    expect(section.trustLine).toBe('No account.')
    expect(section.included).toMatch(/Pantheon/i)
    expect(section.notIncluded).toMatch(/Full packages/i)
  })

  it('replaces the competitor matrix with a promise-led Why ChronoWalk beat', () => {
    const section = LANDING_CONTENT.why
    expect(section.eyebrow).toBe('Why ChronoWalk')
    expect(section.headline).toContain('Tied to the stones')
    expect(section.points).toEqual([
      'Stories tied to the place where they happened',
      'Evidence-based reconstructions from the viewpoint in front of you',
      'A route that pauses when you do',
    ])
    expect(LANDING_CONTENT.comparison.rows).toEqual([])
    expect(getLandingFaqItems().map((item) => item.q)).toEqual(
      expect.arrayContaining([
        'How is it different from a podcast?',
        'How is it different from other audio tours?',
        'Is it a group tour?',
      ]),
    )
  })

  it('ships How we build trust without fabricated social proof', () => {
    const section = LANDING_CONTENT.trust
    expect(section.eyebrow).toBe('How we build trust')
    expect(section.headline).toBe('Evidence you can check.')
    expect(section.items.length).toBeGreaterThanOrEqual(4)
    expect(section.imageryHref).toBe('/credits')
    expect(LANDING_VERIFIED_REVIEWS).toEqual([])
    expect(section.verifiedReviewsEmptyNote).toMatch(/approved/i)
  })

  it('frames After Rome as a cinematic memory beat before FAQ', () => {
    const section = LANDING_CONTENT['after-rome']
    expect(section.eyebrow).toBe('After Rome')
    expect(section.headlineLines).toEqual([
      'Months later,',
      'you’ll forget the queue.',
      'You’ll remember the story.',
    ])
    expect(section.body).toMatch(/route remains yours/i)
    expect(section.linkLabel).toBe('Keep the stories')
    expect(section.linkHref).toBe('#pricing')
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
    expect(items).toHaveLength(17)
    expect(items.map((item) => item.id)).toEqual([
      'what-is-chronowalk',
      'different-from-podcast',
      'different-from-audio-tours',
      'group-tour',
      'offline',
      'mobile-data',
      'gps-inaccurate',
      'pause-continue',
      'tickets',
      'subscription',
      'keep-access',
      'share-purchase',
      'phones',
      'account',
      'narration-ai',
      'reconstructions-researched',
      'historians-disagree',
    ])
  })

  it('closes with a cinematic ending instead of an urgent Final CTA', () => {
    const section = LANDING_CONTENT['final-cta']
    expect(section.headline).toBe('Rome has waited two thousand years.')
    expect(section.bodyLines).toEqual([
      'You do not have to understand it all in one day.',
      'Begin where you are. Continue at your own pace.',
    ])
    expect(section.primaryCta).toBe('Try one stop free')
    expect(section.secondaryCta).toBe('See packages')
    expect(section.footer).toBeUndefined()
    expect(section.verseLines).toBeUndefined()
  })

  it('defines three narrative acts with navigation ids and non-heading labels', () => {
    expect(LANDING_ACTS.map((act) => act.id)).toEqual([
      'act-promise',
      'act-experience',
      'act-decision',
    ])
    expect(LANDING_ACTS.map((act) => ({ index: act.index, name: act.name }))).toEqual([
      { index: 'I', name: 'The Promise' },
      { index: 'II', name: 'The Experience' },
      { index: 'III', name: 'The Decision' },
    ])
    for (const act of LANDING_ACTS) {
      expect(act.label).toMatch(/^Act /)
      expect(act.label).toContain(act.name)
    }
  })

  it('keeps primary landing copy in ChronoWalk voice after the Phase 18 audit', () => {
    expect(LANDING_CONTENT.hero.headline).toBe('Stories begin when you arrive.')
    expect(LANDING_CONTENT.hero.eyebrow).toBe('ChronoWalk · Rome')
    expect(LANDING_CONTENT.hero.accentLine).toBe('Walk freely. Keep the context.')
    expect(LANDING_CONTENT.hero.primaryCta).toBe('Try one stop free')
    expect(LANDING_CONTENT.hero.secondaryCta).toBe('See packages')
    expect(LANDING_CONTENT.threshold.headline).toBe('Press and hold. The ruin becomes the room.')
    expect(LANDING_CONTENT['real-moment'].scenarios[0].lines).toEqual([
      'The monument may be sold out.',
      'The city isn’t.',
    ])
    const joined = JSON.stringify(LANDING_CONTENT).toLowerCase()
    for (const banned of [
      'revolutionary',
      'immersive experience',
      'unforgettable',
      'cutting-edge',
      'seamless',
      'unlock the magic',
      'hidden gems',
      'sneak peek',
    ]) {
      expect(joined).not.toContain(banned)
    }
  })
})
