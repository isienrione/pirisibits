import { describe, expect, it } from 'vitest'
import {
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
      'faq',
      'after-rome',
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
      'Stories right where you are standing',
      'Your trip, your pace',
      'Downloaded once',
      'Yours to keep',
    ])
    expect(LANDING_CONTENT['user-flow'].more).toBeUndefined()
  })

  it('frames the free preview as one stop with clear inclusions', () => {
    const section = LANDING_CONTENT['try-free']
    expect(section.headline).toContain('One stop.')
    expect(section.primaryCta).toBe('Try the Pantheon stop free')
    expect(section.trustLine).toBe('No account required.')
    expect(section.included).toMatch(/Pantheon/i)
    expect(section.notIncluded).toMatch(/Not included/i)
  })

  it('replaces the competitor matrix with a promise-led Why ChronoWalk beat', () => {
    const section = LANDING_CONTENT.why
    expect(section.eyebrow).toBe('Why ChronoWalk')
    expect(section.headline).toContain('Freedom to wander')
    expect(section.points).toEqual([
      'Stories tied to the place where they happened',
      'Evidence-based reconstructions from the viewpoint in front of you',
      'A route that pauses when you do',
    ])
    expect(LANDING_CONTENT.comparison.rows).toEqual([])
    expect(LANDING_CONTENT.faq.items.map((item) => item.q)).toEqual(
      expect.arrayContaining([
        'How is this different from a podcast?',
        'How is this different from other audio tours?',
        'Is this a group tour?',
      ]),
    )
  })

  it('ships How we build trust without fabricated social proof', () => {
    const section = LANDING_CONTENT.trust
    expect(section.eyebrow).toBe('How we build trust')
    expect(section.items.length).toBeGreaterThanOrEqual(4)
    expect(section.imageryHref).toBe('/credits')
    expect(LANDING_VERIFIED_REVIEWS).toEqual([])
    expect(section.verifiedReviewsEmptyNote).toMatch(/approved/i)
  })
})
