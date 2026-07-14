import { describe, expect, it } from 'vitest'
import {
  MOTION_CATEGORIES,
  MOTION_DURATION,
  MOTION_EASE,
  MOTION_HIERARCHY,
  motionTransition,
  motionVars,
} from '../tokens.js'

describe('motion tokens', () => {
  it('defines all required product categories', () => {
    const required = [
      'navigation',
      'arrival',
      'audio',
      'loading',
      'cards',
      'buttons',
      'maps',
      'journal',
      'onboarding',
      'purchases',
    ]
    for (const key of required) {
      expect(MOTION_CATEGORIES[key]).toBeTruthy()
      expect(MOTION_CATEGORIES[key].duration).toBeGreaterThan(0)
      expect(MOTION_CATEGORIES[key].ease).toBeTruthy()
      expect(MOTION_HIERARCHY[MOTION_CATEGORIES[key].tier]).toBeTruthy()
    }
  })

  it('keeps hierarchy tiers ordered by calm intensity', () => {
    expect(MOTION_HIERARCHY.micro.maxMs).toBeLessThan(MOTION_HIERARCHY.feedback.maxMs)
    expect(MOTION_HIERARCHY.feedback.maxMs).toBeLessThan(MOTION_HIERARCHY.nav.maxMs)
    expect(MOTION_HIERARCHY.nav.maxMs).toBeLessThan(MOTION_HIERARCHY.immersive.maxMs)
    expect(MOTION_HIERARCHY.immersive.maxMs).toBeLessThan(MOTION_HIERARCHY.cinematic.maxMs)
  })

  it('exposes stable easing names', () => {
    expect(MOTION_EASE.enter).toContain('cubic-bezier')
    expect(MOTION_EASE.exit).toContain('cubic-bezier')
    expect(MOTION_EASE.standard).toContain('cubic-bezier')
  })

  it('builds category transition helpers', () => {
    expect(motionTransition('buttons')).toContain(`${MOTION_DURATION.feedback}ms`)
    expect(motionVars('journal')['--cw-motion-duration']).toBe(`${MOTION_DURATION.rise}ms`)
  })
})
