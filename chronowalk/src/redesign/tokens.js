/** ChronoWalk redesign tokens — aligned with official brand palette. */

export const T = {
  obsidian: '#0B0B0D',
  charcoal: '#1A1A1F',
  ink: '#1A1A1F',
  ink800: '#1A1A1F',
  bone: '#FAF6EF',
  warmWhite: '#FAF6EF',
  limestone: '#E9E2D5',
  bronze: '#8B8638',
  gold: '#D4AF37',
  olive: '#6B7A52',
  terracotta: '#E4552E',
  muted: '#B9AF9C',
  ember: '#D4AF37',
  actI: '#E4552E',
  actII: '#7C9A5C',
  actIII: '#E8A13C',
  actIV: '#4E9B8F',
  actV: '#B14A6E',
  actVI: '#4E7D9B',
  encore: '#8A6FB5',
}

export const F = {
  display: "'Fraunces', Georgia, serif",
  body: "'DM Sans', system-ui, sans-serif",
}

/**
 * Spacing scale — mirrors `src/design/tokens.css` (`--edge`, `--gap-*`).
 * Prefer these over ad-hoc px for screen edge, section, card, and CTA rhythm.
 */
export const S = {
  edge: 'var(--edge)',
  s: 'var(--gap-s)',
  m: 'var(--gap-m)',
  l: 'var(--gap-l)',
  xl: 'var(--gap-xl)',
}

/** Pixel literals of the same scale (layout math / seam offsets). */
export const S_PX = {
  edge: 24,
  s: 8,
  m: 16,
  l: 24,
  xl: 40,
}

/** Shared screen chrome paddings — pixel-perfect across tab screens. */
export const SCREEN_PAD_X = S.edge
export const SCREEN_HEADER_PAD = `max(56px, calc(env(safe-area-inset-top) + ${S.m})) ${S.edge} ${S.l}`
export const SCREEN_FOOTER_PAD = `${S.l} ${S.edge}`

/** Bottom padding when the fixed shell tab bar is visible. */
export const SHELL_TAB_BAR_INSET = 'calc(var(--shell-tab-bar-height) + max(var(--gap-s), env(safe-area-inset-bottom)))'

/**
 * Bottom padding for immersive (chrome-free) screens where the tab bar is
 * hidden — no tab-bar reservation, just breathing room + the safe-area inset.
 */
export const SHELL_SAFE_BOTTOM_INSET = 'max(var(--gap-xl), env(safe-area-inset-bottom))'

export const ACT_COLORS = {
  I: T.actI,
  II: T.actII,
  III: T.actIII,
  IV: T.actIV,
  V: T.actV,
  VI: T.actVI,
  ENC: T.encore,
}
