/**
 * ChronoWalk Motion Design System — canonical durations, easing, hierarchy.
 *
 * Rules:
 * 1. No animation without purpose (immersion, feedback, or continuity).
 * 2. Prefer slower & calmer over flashy.
 * 3. One easing pair for enter/exit; never invent per-screen curves.
 * 4. Transform + opacity (+ occasional filter) only — keep 60fps.
 * 5. Loops are rare: presence/breathe only, never attention bait.
 *
 * See docs/MOTION_SYSTEM.md
 */

/** @typedef {'micro'|'feedback'|'nav'|'immersive'|'cinematic'} MotionTier */

// ── Hierarchy (micro → cinematic) ───────────────────────────────

export const MOTION_HIERARCHY = Object.freeze({
  micro: {
    tier: /** @type {MotionTier} */ ('micro'),
    purpose: 'Scrubbers, progress fills, toggle thumbs — continuity only',
    maxMs: 160,
  },
  feedback: {
    tier: /** @type {MotionTier} */ ('feedback'),
    purpose: 'Buttons, chips, pressables — confirm the touch',
    maxMs: 220,
  },
  nav: {
    tier: /** @type {MotionTier} */ ('nav'),
    purpose: 'Sheets, panels, subtitle swaps, screen chrome — spatial continuity',
    maxMs: 520,
  },
  immersive: {
    tier: /** @type {MotionTier} */ ('immersive'),
    purpose: 'Threshold hold, audio unlock, chapter transitions — presence',
    maxMs: 2400,
  },
  cinematic: {
    tier: /** @type {MotionTier} */ ('cinematic'),
    purpose: 'Arrival, purchase, Gold Seam ceremony, ken-burns — story weight',
    maxMs: 28000,
  },
})

// ── Durations (ms) ──────────────────────────────────────────────

export const MOTION_DURATION = Object.freeze({
  instant: 80,
  micro: 160,
  ui: 200,
  feedback: 220,
  panel: 360,
  nav: 400,
  sheet: 380,
  rise: 700,
  reveal: 900,
  ceremony: 1200,
  charge: 2400,
  breathe: 2800,
  drift: 28000,
})

/** CSS string helpers */
export const MOTION_DURATION_CSS = Object.freeze({
  instant: `${MOTION_DURATION.instant}ms`,
  micro: `${MOTION_DURATION.micro}ms`,
  ui: `${MOTION_DURATION.ui}ms`,
  feedback: `${MOTION_DURATION.feedback}ms`,
  panel: `${MOTION_DURATION.panel}ms`,
  nav: `${MOTION_DURATION.nav}ms`,
  sheet: `${MOTION_DURATION.sheet}ms`,
  rise: `${MOTION_DURATION.rise}ms`,
  reveal: `${MOTION_DURATION.reveal}ms`,
  ceremony: `${MOTION_DURATION.ceremony}ms`,
  charge: `${MOTION_DURATION.charge}ms`,
  breathe: `${MOTION_DURATION.breathe}ms`,
  drift: `${MOTION_DURATION.drift}ms`,
})

// ── Easing ──────────────────────────────────────────────────────

export const MOTION_EASE = Object.freeze({
  /** Soft entry (legacy --ease) */
  enter: 'cubic-bezier(0.22, 0.8, 0.36, 1)',
  /** Decisive progress / charge */
  standard: 'cubic-bezier(0.33, 0, 0.2, 1)',
  /** Settle / release / sheet exit */
  exit: 'cubic-bezier(0.22, 1, 0.36, 1)',
  /** Weighted press-in */
  pressure: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  /** Ambient loops only */
  breathe: 'ease-in-out',
  /** Scrubbers / waveform */
  linear: 'linear',
})

// ── Category defaults ───────────────────────────────────────────

/**
 * Per product surface — pick duration + ease + tier.
 * Use these instead of inventing new timings per screen.
 */
export const MOTION_CATEGORIES = Object.freeze({
  navigation: {
    duration: MOTION_DURATION.nav,
    ease: MOTION_EASE.exit,
    tier: 'nav',
    liftPx: 10,
    notes: 'Tab changes, back, panel enter — continuity, not spectacle',
  },
  arrival: {
    duration: MOTION_DURATION.reveal,
    ease: MOTION_EASE.exit,
    tier: 'cinematic',
    liftPx: 14,
    notes: 'See ceremonyTimelines.js — slower beats required',
  },
  audio: {
    duration: MOTION_DURATION.panel,
    ease: MOTION_EASE.standard,
    tier: 'immersive',
    liftPx: 0,
    notes: 'Player chrome + unlock flash; waveform stays linear',
  },
  loading: {
    duration: MOTION_DURATION.breathe,
    ease: MOTION_EASE.breathe,
    tier: 'immersive',
    liftPx: 0,
    notes: 'Gold Seam breathe only — no spinner thrash',
  },
  cards: {
    duration: MOTION_DURATION.ui,
    ease: MOTION_EASE.enter,
    tier: 'feedback',
    liftPx: 0,
    notes: 'Surface tint / border only — never bounce or scale pop',
  },
  buttons: {
    duration: MOTION_DURATION.feedback,
    ease: MOTION_EASE.pressure,
    tier: 'feedback',
    liftPx: 0,
    notes: 'Opacity/background; active scale ≤ 0.98 if any',
  },
  maps: {
    duration: MOTION_DURATION.panel,
    ease: MOTION_EASE.exit,
    tier: 'nav',
    liftPx: 8,
    notes: 'Phase subtitle / arrived copy only — map tiles own camera',
  },
  journal: {
    duration: MOTION_DURATION.rise,
    ease: MOTION_EASE.exit,
    tier: 'nav',
    liftPx: 12,
    notes: 'Quiet rise-in for memories; no carousel whirls',
  },
  onboarding: {
    duration: MOTION_DURATION.sheet,
    ease: MOTION_EASE.exit,
    tier: 'nav',
    liftPx: 16,
    notes: 'Card slide once; demo loops only on threshold invite',
  },
  purchases: {
    duration: MOTION_DURATION.charge,
    ease: MOTION_EASE.standard,
    tier: 'cinematic',
    liftPx: 0,
    notes: 'Gold Seam draw-down ceremony — do not accelerate',
  },
})

/**
 * Build an inline transition string from category defaults.
 * @param {keyof typeof MOTION_CATEGORIES} category
 * @param {string} [props='opacity, transform']
 */
export function motionTransition(category, props = 'opacity, transform') {
  const preset = MOTION_CATEGORIES[category]
  if (!preset) return undefined
  return `${props} ${preset.duration}ms ${preset.ease}`
}

/**
 * CSS custom-property bag for a category (spread into style={}).
 * @param {keyof typeof MOTION_CATEGORIES} category
 */
export function motionVars(category) {
  const preset = MOTION_CATEGORIES[category]
  if (!preset) return {}
  return {
    '--cw-motion-duration': `${preset.duration}ms`,
    '--cw-motion-ease': preset.ease,
    '--cw-motion-lift': `${preset.liftPx}px`,
  }
}
