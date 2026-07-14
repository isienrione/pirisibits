/**
 * Named ceremony timelines — museum / keynote pacing (never gamey).
 * Times are ms from ceremony start. Reduced-motion uses `reduced` variants.
 */

export const ARRIVAL_CEREMONY = {
  /** Intentional hold before anything moves */
  pause: 0,
  /** Soft atmospheric darken */
  dim: 480,
  /** Ambient bed / arrival cue */
  ambient: 720,
  /** Slow photo drift */
  drift: 900,
  /** Gold Seam entrance */
  seam: 1600,
  /** Title reveal (slow) */
  title: 2200,
  /** Supporting line */
  copy: 3000,
  /** Primary CTA */
  cta: 4200,
  /** Secondary actions */
  secondary: 5000,
}

/** Compressed beats when prefers-reduced-motion */
export const ARRIVAL_CEREMONY_REDUCED = {
  pause: 0,
  dim: 0,
  ambient: 0,
  drift: 0,
  seam: 80,
  title: 80,
  copy: 120,
  cta: 200,
  secondary: 280,
}

export const ARRIVAL_DURATIONS = {
  dimMs: 1400,
  titleMs: 1600,
  copyMs: 1100,
  ctaMs: 900,
  secondaryMs: 700,
  driftMs: 28000,
}
