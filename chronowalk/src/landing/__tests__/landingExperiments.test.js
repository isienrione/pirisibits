import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  LANDING_EXP_HERO_COPY,
  LANDING_EXP_HERO_ENABLED,
  LANDING_EXP_HERO_KEY,
  ensureLandingExpHero,
  getHeroCopyForExp,
  normalizeLandingExpHero,
  peekLandingExpHero,
  resetLandingExperimentsForTests,
} from '../landingExperiments.js'

describe('landingExperiments - hero Test 1', () => {
  beforeEach(() => {
    resetLandingExperimentsForTests()
    window.history.replaceState({}, '', '/')
  })

  afterEach(() => {
    resetLandingExperimentsForTests()
    window.history.replaceState({}, '', '/')
    vi.restoreAllMocks()
  })

  it('normalizes a|b only', () => {
    expect(normalizeLandingExpHero('A')).toBe('a')
    expect(normalizeLandingExpHero('b')).toBe('b')
    expect(normalizeLandingExpHero('c')).toBeNull()
  })

  it('is paused: pins 100% to a and overwrites a prior b sticky assignment', () => {
    expect(LANDING_EXP_HERO_ENABLED).toBe(false)
    window.localStorage.setItem(LANDING_EXP_HERO_KEY, 'b')
    vi.spyOn(Math, 'random').mockReturnValue(0.9)

    expect(ensureLandingExpHero()).toBe('a')
    expect(window.localStorage.getItem(LANDING_EXP_HERO_KEY)).toBe('a')
    expect(peekLandingExpHero()).toBe('a')

    // Random would have chosen b; paused pin must win every time.
    expect(ensureLandingExpHero()).toBe('a')
  })

  it('while paused still honors ?landing_exp_hero= QA override', () => {
    window.history.replaceState({}, '', '/?landing_exp_hero=b')
    vi.spyOn(Math, 'random').mockReturnValue(0.1)
    expect(ensureLandingExpHero()).toBe('b')
    expect(window.localStorage.getItem(LANDING_EXP_HERO_KEY)).toBe('b')
    expect(getHeroCopyForExp('a').headline).toBe(LANDING_EXP_HERO_COPY.a.headline)
    expect(getHeroCopyForExp('b').headline).toBe(LANDING_EXP_HERO_COPY.b.headline)
  })

  it('keeps copy + storage infrastructure for re-enable', () => {
    expect(LANDING_EXP_HERO_COPY.a.id).toBe('a')
    expect(LANDING_EXP_HERO_COPY.b.id).toBe('b')
    expect(LANDING_EXP_HERO_KEY).toBe('cw_landing_exp_hero')
  })
})
