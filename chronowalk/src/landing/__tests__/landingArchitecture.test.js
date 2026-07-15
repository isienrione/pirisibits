import { describe, expect, it } from 'vitest'
import {
  LANDING_ACTS,
  LANDING_CONTENT,
  LANDING_LEGACY_DEEPLINK_IDS,
  LANDING_PRESERVED_LOWER_SECTIONS,
  LANDING_SECTION_ORDER,
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
      expect.arrayContaining(['rome-journey', 'letter', 'who-its-for', 'compare']),
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

  it('lists benefits once with the playbook value props', () => {
    expect(LANDING_CONTENT.benefits.items.map((item) => item.title)).toEqual([
      'Stories right where you are standing',
      'Your trip, your pace',
      'Downloaded once',
      'Yours to keep',
    ])
    expect(LANDING_CONTENT.trust.items).toBeUndefined()
  })
})
