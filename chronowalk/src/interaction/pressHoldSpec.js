/**
 * ChronoWalk signature Press & Hold — timing, easing, haptics, sound.
 *
 * Single source of truth. See docs/PRESS_HOLD.md.
 * Intention: “I am unlocking history.” — never a button press.
 */

/** @typedef {'press'|'mid'|'commit'|'cancel'} HoldHapticBeat */

// ── Durations (ms) ──────────────────────────────────────────────

/** Full charge — Now → Then reveal reach. */
export const HOLD_MS = 2400

/** Hold long enough to latch into Then (history unlocked). */
export const HOLD_COMMIT_MS = 2000

/** Snap finish after commit threshold while still holding. */
export const HOLD_COMMIT_FINISH_MS = 400

/** Incomplete release — settle back to Now. */
export const HOLD_RELEASE_MS = 900

/** Immediate pressure response on pointer down (orb / depth). */
export const HOLD_PRESSURE_IN_MS = 160

/** Orb / glow collapse after release. */
export const HOLD_RELEASE_SNAP_MS = 520

/** Idle affordance breathe cycle. */
export const HOLD_IDLE_BREATHE_MS = 2600

/** Mid-hold haptic / glow accent (50% of commit). */
export const HOLD_MID_MS = Math.round(HOLD_COMMIT_MS * 0.5)

// Backward-compat aliases used by Threshold / demos
export const THRESHOLD_HOLD_MS = HOLD_MS
export const THRESHOLD_HOLD_COMMIT_MS = HOLD_COMMIT_MS
export const THRESHOLD_HOLD_COMMIT_FINISH_MS = HOLD_COMMIT_FINISH_MS
export const THRESHOLD_RELEASE_MS = HOLD_RELEASE_MS

// ── Easing curves ───────────────────────────────────────────────
// Named CSS / JS pairs. Prefer CSS for painting; JS for clip/reveal sync.

/**
 * Progress charge — soft start, decisive arrival.
 * CSS: cubic-bezier(0.33, 0, 0.2, 1)
 */
export const EASE_HOLD_PROGRESS_CSS = 'cubic-bezier(0.33, 0, 0.2, 1)'

/**
 * Release settle — elegant deceleration (ease-out quint).
 * CSS: cubic-bezier(0.22, 1, 0.36, 1)
 */
export const EASE_HOLD_RELEASE_CSS = 'cubic-bezier(0.22, 1, 0.36, 1)'

/**
 * Pressure-in — quick, slightly weighted.
 * CSS: cubic-bezier(0.2, 0.8, 0.2, 1)
 */
export const EASE_HOLD_PRESSURE_CSS = 'cubic-bezier(0.2, 0.8, 0.2, 1)'

/** Approx. cubic-bezier(0.33, 0, 0.2, 1) for rAF progress. */
export function easeHoldProgress(t) {
  return cubicBezier(clamp01(t), 0.33, 0, 0.2, 1)
}

/** ease-out quint — release settle */
export function easeHoldRelease(t) {
  const x = clamp01(t)
  return 1 - (1 - x) ** 5
}

/** Soft pressure ease for orb scale */
export function easeHoldPressure(t) {
  const x = clamp01(t)
  return 1 - (1 - x) ** 3
}

function clamp01(t) {
  return Math.min(1, Math.max(0, t))
}

/** Cubic Bezier Y for unit X using Newton + binary (x1,y1)=(0,0) (x2,y2)=(1,1) with control (c1,0)-(c2,1) asymmetrically — use standard CSS cubic for x,y both. */
function cubicBezier(t, x1, y1, x2, y2) {
  // Solve for parameter u such that Bx(u)=t, return By(u)
  let u = t
  for (let i = 0; i < 5; i += 1) {
    const x = bezier3(u, x1, x2) - t
    const dx = bezier3Derivative(u, x1, x2)
    if (Math.abs(dx) < 1e-6) break
    u -= x / dx
    u = clamp01(u)
  }
  return bezier3(u, y1, y2)
}

function bezier3(t, p1, p2) {
  const mt = 1 - t
  return 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t
}

function bezier3Derivative(t, p1, p2) {
  const mt = 1 - t
  return 3 * mt * mt * p1 + 6 * mt * t * (p2 - p1) + 3 * t * t * (1 - p2)
}

// ── Haptic schedule ─────────────────────────────────────────────

/**
 * Beats along a hold session (ms from press).
 * Maps to HAPTIC_KIND in utils/haptics.js
 */
export const HOLD_HAPTIC_SCHEDULE = Object.freeze([
  { at: 0, beat: /** @type {HoldHapticBeat} */ ('press'), kind: 'holdPress' },
  { at: HOLD_MID_MS, beat: /** @type {HoldHapticBeat} */ ('mid'), kind: 'holdMid' },
  { at: HOLD_COMMIT_MS, beat: /** @type {HoldHapticBeat} */ ('commit'), kind: 'holdUnlock' },
])

/** Incomplete release — single soft damp pulse (optional). */
export const HOLD_HAPTIC_CANCEL = Object.freeze({
  kind: 'holdCancel',
  /** Only if held at least this long (avoid chatter on taps). */
  minHeldMs: 280,
})

// ── Sound timing ────────────────────────────────────────────────

/**
 * Ambience crossfade is locked to reveal duration:
 * - press  → ramp Now→Then over HOLD_MS
 * - commit finish → short Then confirm over HOLD_COMMIT_FINISH_MS
 * - release → ramp Then→Now over HOLD_RELEASE_MS
 */
export const HOLD_SOUND = Object.freeze({
  chargeRampMs: HOLD_MS,
  commitFinishRampMs: HOLD_COMMIT_FINISH_MS,
  releaseRampMs: HOLD_RELEASE_MS,
  /** Sound begins on the same frame as visual charge (not delayed). */
  startDelayMs: 0,
})

// ── Visual pressure ─────────────────────────────────────────────

export const HOLD_VISUAL = Object.freeze({
  /** Idle orb scale breathe amplitude */
  idleScaleMin: 0.96,
  idleScaleMax: 1.0,
  /** Pressed base scale before progress add */
  pressScale: 0.94,
  /** Max scale at full charge */
  chargedScale: 1.06,
  /** Media canvas dim / blur at full charge */
  mediaDimMax: 0.22,
  mediaBlurMaxPx: 1.6,
  mediaScaleMax: 1.018,
  glowOpacityMax: 0.55,
})

export const HOLD_COPY = Object.freeze({
  idle: 'Hold to unlock history',
  holding: 'Unlocking history…',
  unlocked: 'History unlocked',
  returnToday: 'Tap to return to today',
})
