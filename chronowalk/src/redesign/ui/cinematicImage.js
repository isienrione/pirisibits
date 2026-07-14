/**
 * Cinematic image presentation — framing, grade, overlay.
 * Improves how assets feel without changing the files themselves.
 * See docs/CINEMATIC_IMAGE.md
 */

export const IMAGE_RADIUS = Object.freeze({
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
})

/** CSS aspect-ratio values */
export const IMAGE_ASPECT = Object.freeze({
  square: '1 / 1',
  portrait: '4 / 5',
  tall: '3 / 4',
  landscape: '4 / 3',
  wide: '16 / 9',
  cinema: '2.39 / 1',
  fill: 'auto',
})

/**
 * Color grades — film / documentary, never tourist vibrance.
 * Applied via CSS filter on the media layer.
 */
export const IMAGE_GRADE = Object.freeze({
  /** Default product stills */
  film: 'saturate(0.78) contrast(1.06) brightness(0.92)',
  /** Softer daylight thumbnails */
  day: 'saturate(0.84) contrast(1.04) brightness(0.94)',
  /** Deep immersive backgrounds */
  dusk: 'saturate(0.7) contrast(1.08) brightness(0.78)',
  /** Heavily muted atmosphere */
  nocturne: 'saturate(0.45) contrast(1.1) brightness(0.55)',
  none: 'none',
})

export const IMAGE_OVERLAY = Object.freeze({
  none: 'none',
  soft: 'soft',
  bottom: 'bottom',
  immersive: 'immersive',
  vignette: 'vignette',
})

/** Landmark crop bias — prefer architecture, not sky excess */
export const IMAGE_POSITION = Object.freeze({
  landmark: 'center 28%',
  center: 'center center',
  upper: 'center 20%',
  lower: 'center 60%',
})

export const IMAGE_SHADOW = Object.freeze({
  none: 'none',
  /** Quiet lift for list thumbs — softer than soft */
  still: '0 6px 18px rgba(11, 11, 13, 0.14), 0 1px 4px rgba(11, 11, 13, 0.06)',
  soft: '0 8px 24px rgba(11, 11, 13, 0.18), 0 2px 6px rgba(11, 11, 13, 0.08)',
  deep: '0 16px 40px rgba(11, 11, 13, 0.28), 0 4px 12px rgba(11, 11, 13, 0.12)',
})
