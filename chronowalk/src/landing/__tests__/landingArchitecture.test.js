import { describe, expect, it } from 'vitest'
import { LANDING_ACTS, LANDING_CONTENT, LANDING_SECTION_ORDER } from '../landingData.js'

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

  it('provides content keys and stable ids for every mounted beat', () => {
    for (const key of LANDING_SECTION_ORDER) {
      const section = LANDING_CONTENT[key]
      expect(section, `missing LANDING_CONTENT.${key}`).toBeTruthy()
      expect(section.id, `missing id for ${key}`).toEqual(expect.any(String))
      expect(section.id.length).toBeGreaterThan(0)
    }
  })
})
