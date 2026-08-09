import { afterEach, describe, expect, it } from 'vitest'
import {
  LANDING_INTENT_DEFAULT,
  LANDING_INTENT_VARIANTS,
  getLandingIntentVariant,
  normalizeLandingIntent,
  resolveLandingIntent,
  resolveLandingIntentHero,
} from '../landingIntent.js'
import { LANDING_CTA } from '../landingData.js'
import { __setLaunchOfferActiveForTests } from '../../lib/launchOffer.js'

describe('landingIntent', () => {
  afterEach(() => {
    __setLaunchOfferActiveForTests(null)
  })

  it('defaults when intent is absent', () => {
    expect(resolveLandingIntent('')).toBe('rome')
    expect(resolveLandingIntent('?utm_source=google')).toBe('rome')
    expect(resolveLandingIntent()).toBe(LANDING_INTENT_DEFAULT)
  })

  it('resolves allowlisted intents', () => {
    expect(resolveLandingIntent('?intent=colosseum')).toBe('colosseum')
    expect(resolveLandingIntent('?intent=pantheon')).toBe('pantheon')
    expect(resolveLandingIntent('?intent=forum')).toBe('forum')
    expect(resolveLandingIntent('?intent=self-guided')).toBe('self-guided')
    expect(resolveLandingIntent('?intent=rome')).toBe('rome')
  })

  it('normalizes mixed case', () => {
    expect(normalizeLandingIntent('Colosseum')).toBe('colosseum')
    expect(normalizeLandingIntent('SELF-GUIDED')).toBe('self-guided')
    expect(resolveLandingIntent('?intent=Pantheon')).toBe('pantheon')
  })

  it('falls back on invalid, encoded, or malicious values', () => {
    expect(normalizeLandingIntent('not-a-real-intent')).toBeNull()
    expect(normalizeLandingIntent('<script>')).toBeNull()
    expect(normalizeLandingIntent('rome%20<script>')).toBeNull()
    expect(normalizeLandingIntent('a'.repeat(40))).toBeNull()
    expect(resolveLandingIntent('?intent=tickets')).toBe('rome')
    expect(resolveLandingIntent('?intent=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E')).toBe('rome')
    expect(resolveLandingIntent('?intent=colosseum%2F..%2Fadmin')).toBe('rome')
  })

  it('never injects raw query text into hero copy', () => {
    const poison = 'Free Colosseum tickets NOW!!!'
    const hero = resolveLandingIntentHero(resolveLandingIntent(`?intent=${encodeURIComponent(poison)}`))
    expect(hero.headline).toBe(LANDING_INTENT_VARIANTS.rome.headline)
    expect(JSON.stringify(hero)).not.toContain(poison)
  })

  it('keeps CTA destinations centralized', () => {
    __setLaunchOfferActiveForTests(true)
    for (const id of Object.keys(LANDING_INTENT_VARIANTS)) {
      const hero = resolveLandingIntentHero(/** @type {any} */ (id))
      expect(hero.getAppHref).toBe('#pricing')
      expect(hero.primaryHref).toBe('/preview')
      expect(hero.unlockCta).toBe(LANDING_CTA.unlockRomePriced)
      expect(hero.unlockCta).toMatch(/Try a tour from €4\.99/)
    }
  })

  it('puts Pantheon free CTA first only for pantheon intent', () => {
    expect(resolveLandingIntentHero('pantheon').ctaPriority).toBe('preview')
    expect(resolveLandingIntentHero('pantheon').primaryCta).toBe(LANDING_CTA.tryPantheonStopFree)
    expect(resolveLandingIntentHero('colosseum').ctaPriority).toBe('unlock')
    expect(resolveLandingIntentHero('rome').ctaPriority).toBe('unlock')
  })

  it('selects distinct approved images per variant', () => {
    const rome = getLandingIntentVariant('rome').heroImage
    const colo = getLandingIntentVariant('colosseum').heroImage
    const pantheon = getLandingIntentVariant('pantheon').heroImage
    const forum = getLandingIntentVariant('forum').heroImage
    const self = getLandingIntentVariant('self-guided').heroImage
    expect(rome.desktopSrc).toMatch(/cinematic\/hero/)
    expect(colo.desktopSrc).toMatch(/cinematic\/interlude/)
    expect(pantheon.desktopSrc).toBe('/landing/real-moment/pantheon.jpg')
    expect(forum.desktopSrc).toBe('/landing/real-moment/forum.jpg')
    expect(self.desktopSrc).toBe('/landing/real-moment/street.jpg')
  })

  it('exposes landing_intent analytics ids matching allowlist', () => {
    expect(getLandingIntentVariant('forum').id).toBe('forum')
    __setLaunchOfferActiveForTests(true)
    expect(LANDING_CTA.unlockRomePriced).toBe('Try a tour from €4.99')
    __setLaunchOfferActiveForTests(false)
    expect(LANDING_CTA.unlockRomePriced).toBe('Unlock from €9.99')
  })
})
