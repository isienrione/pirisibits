/**
 * Gold Seam moment presets — ChronoWalk signature brand motion.
 *
 * Use only for meaningful moments (never decoration). Preset keys match
 * `docs/GOLD_SEAM.md`. Override any field via GoldSeam props.
 */

/** @typedef {'vertical'|'horizontal'|'progress'|'tick'|'flash'} GoldSeamVariant */
/** @typedef {'none'|'breathe'|'drawDown'|'drawAcross'|'flash'|'pulse'} GoldSeamMotion */

/**
 * @typedef {object} GoldSeamPreset
 * @property {GoldSeamVariant} variant
 * @property {GoldSeamMotion} motion
 * @property {number} [thickness]
 * @property {number|string} [length]  px or CSS length for tick/flash/partial seams
 * @property {boolean} [glow]
 * @property {boolean} [loop]
 * @property {number} [duration] ms
 * @property {number} [delay] ms
 * @property {boolean} [leadingDot]
 * @property {'fill'|'inline'|'overlay'} [layout]
 */

/** @type {Record<string, GoldSeamPreset>} */
export const GOLD_SEAM_MOMENTS = {
  /** Tour / route shell waiting on data */
  loading: {
    variant: 'tick',
    motion: 'breathe',
    length: 28,
    thickness: 1.5,
    glow: true,
    loop: true,
    duration: 2800,
    layout: 'inline',
  },

  /** End of a chapter → continue (continuity bridge) */
  chapterTransition: {
    variant: 'horizontal',
    motion: 'drawAcross',
    length: 48,
    thickness: 1.5,
    glow: true,
    loop: false,
    duration: 900,
    layout: 'inline',
  },

  /** Geofence / arrived UI */
  arrival: {
    variant: 'tick',
    motion: 'drawDown',
    length: 32,
    thickness: 1.5,
    glow: true,
    loop: false,
    duration: 700,
    leadingDot: false,
    layout: 'inline',
  },

  /** Location permission granted */
  gpsAcquired: {
    variant: 'flash',
    motion: 'flash',
    length: 56,
    thickness: 1.5,
    glow: true,
    loop: false,
    duration: 780,
    layout: 'inline',
  },

  /** Access / purchase confirmed */
  purchaseSuccess: {
    variant: 'vertical',
    motion: 'drawDown',
    thickness: 1.5,
    glow: true,
    loop: true,
    duration: 2400,
    delay: 0,
    leadingDot: true,
    layout: 'fill',
  },

  /** Tour unlocked (may share purchase ceremony) */
  tourUnlocked: {
    variant: 'vertical',
    motion: 'drawDown',
    thickness: 1.5,
    glow: true,
    loop: true,
    duration: 2400,
    leadingDot: true,
    layout: 'fill',
  },

  /** Audio context unlocked — soundscape awake */
  audioUnlocked: {
    variant: 'flash',
    motion: 'flash',
    length: 64,
    thickness: 1.5,
    glow: true,
    loop: false,
    duration: 850,
    layout: 'inline',
  },

  /** Act spine complete → next act */
  actTransition: {
    variant: 'tick',
    motion: 'pulse',
    length: 24,
    thickness: 1.5,
    glow: true,
    loop: true,
    duration: 3000,
    layout: 'inline',
  },
}

export const GOLD_SEAM_MOMENT_KEYS = Object.keys(GOLD_SEAM_MOMENTS)

/**
 * @param {string|undefined|null} moment
 * @returns {GoldSeamPreset}
 */
export function resolveGoldSeamPreset(moment) {
  if (moment && GOLD_SEAM_MOMENTS[moment]) return { ...GOLD_SEAM_MOMENTS[moment] }
  return {
    variant: 'vertical',
    motion: 'breathe',
    thickness: 1.5,
    glow: true,
    loop: true,
    duration: 3000,
    layout: 'fill',
  }
}
