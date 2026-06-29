/** Shared visible focus ring for interactive controls. */
export const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-warm-white'

/** Minimum comfortable touch target — 48×48 CSS px (Apple / Material guidance). */
export const touchTarget = 'min-h-12 min-w-12'

/** Mobile-friendly tap behaviour — no double-tap zoom delay, reliable hit testing. */
export const tapAction =
  'touch-manipulation select-none relative z-[2] active:opacity-95 [-webkit-tap-highlight-color:transparent]'
