/** ChronoWalk redesign tokens — Figma Make / UX Master Spec */

export const T = {
  obsidian: '#16130F',
  ink: '#211C15',
  ink800: '#26221B',
  bone: '#F7F1E6',
  warmWhite: '#F5EFE3',
  muted: '#B9AF9C',
  ember: '#E8A13C',
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
