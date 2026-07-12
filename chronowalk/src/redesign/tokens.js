/**
 * ChronoWalk redesign tokens — CSS variable aliases only (DESIGN_LAW).
 * Every color resolves from src/design/tokens.css; no hex literals here.
 */

export const T = {
  obsidian: 'var(--obsidian)',
  charcoal: 'var(--charcoal)',
  /** Legacy key — was charcoal #1A1A1F; daylight text uses ink-900 per Law. */
  ink: 'var(--ink-900)',
  ink800: 'var(--ink-800)',
  bone: 'var(--bone)',
  warmWhite: 'var(--warm-white)',
  /** Legacy brand token in tokens.css. */
  limestone: 'var(--limestone)',
  /** Legacy brand token — still defined in tokens.css. */
  bronze: 'var(--bronze)',
  /** @deprecated Use T.ember — gold was #D4AF37; ember (#E8A13C) is the sacred seam. */
  gold: 'var(--ember)',
  /** Legacy brand token — still defined in tokens.css. */
  olive: 'var(--olive)',
  /** Legacy name for act I coral accent. */
  terracotta: 'var(--act-arena)',
  muted: 'var(--muted)',
  /** Hairlines, borders, tracks, disabled fills — not for text. */
  mutedDecor: 'var(--muted-decor)',
  ember: 'var(--ember)',
  inkOnFill: 'var(--ink-on-fill)',
  actI: 'var(--act-arena)',
  actII: 'var(--act-hill)',
  actIII: 'var(--act-forum)',
  actIV: 'var(--act-market)',
  actV: 'var(--act-city)',
  actVI: 'var(--act-river)',
  encore: 'var(--act-encore)',
  actIText: 'var(--act-arena-text)',
  actIIText: 'var(--act-hill-text)',
  actIIIText: 'var(--act-forum-text)',
  actIVText: 'var(--act-market-text)',
  actVText: 'var(--act-city-text)',
  actVIText: 'var(--act-river-text)',
  encoreText: 'var(--act-encore-text)',
  actCityOnDark: 'var(--act-city-on-dark)',
}

export const F = {
  display: 'var(--font-display)',
  body: 'var(--font-ui)',
}

/** Bottom padding when the fixed shell tab bar is visible. */
export const SHELL_TAB_BAR_INSET = 'calc(var(--shell-tab-bar-height) + max(8px, env(safe-area-inset-bottom)))'

/**
 * Bottom padding for immersive (chrome-free) screens where the tab bar is
 * hidden — no tab-bar reservation, just breathing room + the safe-area inset.
 */
export const SHELL_SAFE_BOTTOM_INSET = 'max(24px, env(safe-area-inset-bottom))'

/**
 * Opacity via color-mix — use instead of appending hex alpha suffixes to T.* tokens.
 * @param {string} token CSS color, e.g. T.ember
 * @param {string} hexPair Two-digit hex alpha (00–FF)
 */
export function withAlpha(token, hexPair) {
  const n = Number.parseInt(hexPair, 16)
  if (!Number.isFinite(n) || n <= 0) return 'transparent'
  if (n >= 255) return token
  const pct = Math.round((n / 255) * 100)
  return `color-mix(in srgb, ${token} ${pct}%, transparent)`
}

export const ACT_COLORS = {
  I: T.actI,
  II: T.actII,
  III: T.actIII,
  IV: T.actIV,
  V: T.actV,
  VI: T.actVI,
  ENC: T.encore,
}

export const ACT_TEXT_COLORS = {
  I: T.actIText,
  II: T.actIIText,
  III: T.actIIIText,
  IV: T.actIVText,
  V: T.actVText,
  VI: T.actVIText,
  ENC: T.encoreText,
}

const ACCENT_TO_TEXT = {
  [T.actI]: T.actIText,
  [T.actII]: T.actIIText,
  [T.actIII]: T.actIIIText,
  [T.actIV]: T.actIVText,
  [T.actV]: T.actVText,
  [T.actVI]: T.actVIText,
  [T.encore]: T.encoreText,
  [T.ember]: T.actIIIText,
  [T.terracotta]: T.actIText,
}

const ACCENT_TO_TEXT_ON_DARK = {
  [T.actV]: T.actCityOnDark,
}

/** Readable act accent text on bone for labels under 18px. */
export function accentTextFor(accent) {
  return ACCENT_TO_TEXT[accent] ?? accent
}

/** Readable act accent text on dark immersion surfaces. */
export function accentTextOnDarkFor(accent) {
  return ACCENT_TO_TEXT_ON_DARK[accent] ?? accentTextFor(accent)
}

export function actTextForNumeral(numeral) {
  return ACT_TEXT_COLORS[numeral] ?? T.actIText
}
