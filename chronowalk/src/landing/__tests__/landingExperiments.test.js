import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  LANDING_EXP_HERO_COPY,
  LANDING_EXP_HERO_KEY,
  ensureLandingExpHero,
  getHeroCopyForExp,
  normalizeLandingExpHero,
  peekLandingExpHero,
  resetLandingExperimentsForTests,
} from '../landingExperiments.js'

describe('landingExperiments — hero Test 1', () => {
  beforeEach(() => {
    resetLandingExperimentsForTests()
    window.history.replaceState({}, '', '/')
  })

  afterEach(() => {
    resetLandingExperimentsForTests()
    window.history.replaceState({}, '', '/')
  })

  it('normalizes a|b only', () => {
    expect(normalizeLandingExpHero('A')).toBe('a')
    expect(normalizeLandingExpHero('b')).toBe('b')
    expect(normalizeLandingExpHero('c')).toBeNull()
  })

  it('sticks the first random assignment in localStorage', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9)
    expect(ensureLandingExpHero()).toBe('b')
    expect(window.localStorage.getItem(LANDING_EXP_HERO_KEY)).toBe('b')
    Math.random.mockReturnValue(0.1)
    expect(ensureLandingExpHero()).toBe('b')
    expect(peekLandingExpHero()).toBe('b')
  })

  it('honors ?landing_exp_hero= query override', () => {
    window.history.replaceState({}, '', '/?landing_exp_hero=a')
    vi.spyOn(Math, 'random').mockReturnValue(0.9)
    expect(ensureLandingExpHero()).toBe('a')
    expect(getHeroCopyForExp('a').headline).toBe(LANDING_EXP_HERO_COPY.a.headline)
    expect(getHeroCopyForExp('b').headline).toBe(LANDING_EXP_HERO_COPY.b.headline)
  })
})
