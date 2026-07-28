/**
 * Landing post-launch experiments (see docs/LANDING_POST_LAUNCH_AB.md).
 * Test 1 — hero headline positioning. Sticky per browser; URL override for QA.
 *
 * Do not reuse `ab_variant` (price AB cents in config/track).
 */

export const LANDING_EXP_HERO_KEY = 'cw_landing_exp_hero'
export const LANDING_EXP_HERO_PARAM = 'landing_exp_hero'

/** Test 1 copy — headline only (accent / sub / CTAs stay shared). */
export const LANDING_EXP_HERO_COPY = Object.freeze({
  a: {
    id: 'a',
    headline: 'Rome in your pocket.',
  },
  b: {
    id: 'b',
    headline: 'Rome in your pocket.',
  },
})

/** Flip to false to force control A for everyone (keeps assignment storage intact). */
export const LANDING_EXP_HERO_ENABLED = true

/**
 * @param {string | null | undefined} raw
 * @returns {'a' | 'b' | null}
 */
export function normalizeLandingExpHero(raw) {
  if (raw == null) return null
  const v = String(raw).trim().toLowerCase()
  if (v === 'a' || v === 'b') return v
  return null
}

function readStored() {
  if (typeof window === 'undefined') return null
  try {
    return normalizeLandingExpHero(window.localStorage.getItem(LANDING_EXP_HERO_KEY))
  } catch {
    return null
  }
}

function writeStored(variant) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LANDING_EXP_HERO_KEY, variant)
  } catch {
    /* private mode / quota — still use in-memory for the session via return value */
  }
}

function readQueryOverride() {
  if (typeof window === 'undefined') return null
  try {
    return normalizeLandingExpHero(new URLSearchParams(window.location.search).get(LANDING_EXP_HERO_PARAM))
  } catch {
    return null
  }
}

function pickFiftyFifty() {
  return Math.random() < 0.5 ? 'a' : 'b'
}

/**
 * Peek without assigning. Use in track() base props so preview/purchase inherit.
 * @returns {'a' | 'b' | null}
 */
export function peekLandingExpHero() {
  return readStored()
}

/**
 * Ensure a sticky assignment (QA query wins). Call from landing mount / hero.
 * When the experiment is disabled, still returns stored/override or control `a`.
 * @returns {'a' | 'b'}
 */
export function ensureLandingExpHero() {
  const fromQuery = readQueryOverride()
  if (fromQuery) {
    writeStored(fromQuery)
    return fromQuery
  }

  const stored = readStored()
  if (stored) return stored

  if (!LANDING_EXP_HERO_ENABLED) {
    writeStored('a')
    return 'a'
  }

  const picked = pickFiftyFifty()
  writeStored(picked)
  return picked
}

/** @param {'a' | 'b'} variant */
export function getHeroCopyForExp(variant) {
  return LANDING_EXP_HERO_COPY[variant] ?? LANDING_EXP_HERO_COPY.a
}

/** @internal */
export function resetLandingExperimentsForTests() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(LANDING_EXP_HERO_KEY)
  } catch {
    /* ignore */
  }
}
