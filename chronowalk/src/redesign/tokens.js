/** ChronoWalk redesign tokens — aligned with official brand palette. */

export const T = {
  obsidian: '#101113',
  charcoal: '#1A1A1F',
  ink: '#1A1A1F',
  ink800: '#1A1A1F',
  bone: '#F3EEE6',
  warmWhite: '#F3EEE6',
  limestone: '#E9E2D5',
  bronze: '#8B8638',
  gold: '#C7A348',
  terracotta: '#E95B2E',
  olive: '#6B7A52',
  muted: '#B9AF9C',
  ember: '#C7A348',
  actI: '#C7A348',
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

/** Bottom padding when the fixed shell tab bar is visible. */
export const SHELL_TAB_BAR_INSET = 'calc(var(--shell-tab-bar-height) + max(8px, env(safe-area-inset-bottom)))'

/**
 * Bottom padding for immersive (chrome-free) screens where the tab bar is
 * hidden — no tab-bar reservation, just breathing room + the safe-area inset.
 */
export const SHELL_SAFE_BOTTOM_INSET = 'max(24px, env(safe-area-inset-bottom))'

export const ACT_COLORS = {
  I: T.actI,
  II: T.actII,
  III: T.actIII,
  IV: T.actIV,
  V: T.actV,
  VI: T.actVI,
  ENC: T.encore,
}
