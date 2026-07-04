/** ChronoWalk design tokens — single source for CSS custom properties and Tailwind. */

export const palette = {
  ivory: '#F7F3EC',
  parchment: '#EDE3CF',
  sand: '#E2D6BE',
  limestone: '#E2D6BE',
  softSlate: '#686E72',
  deepSlate: '#17212B',
  bronze: '#A8742A',
  bronzeDark: '#8F6324',
  gold: '#D4AF37',
  goldDark: '#B8942F',
  obsidian: '#1C1C1C',
  olive: '#7A8B5A',
  skyBlue: '#7CB7D8',
}

/** Role-based aliases — prefer these in new UI code. */
export const semantic = {
  surfaceImmersive: palette.obsidian,
  surfaceEditorial: palette.ivory,
  surfaceEditorialAlt: palette.parchment,
  textInk: palette.deepSlate,
  textMuted: palette.softSlate,
  ctaPrimary: palette.bronze,
  accentArrival: palette.gold,
  accentMagic: palette.gold,
  statusSuccess: palette.olive,
}

export const fonts = {
  sans: "'DM Sans', system-ui, sans-serif",
  display: "'Fraunces', Georgia, serif",
}

export const motion = {
  spring: 'cubic-bezier(0.22, 1, 0.36, 1)',
  springDuration: '0.65s',
}

export const shadows = {
  glass: '0 8px 32px rgba(28, 28, 28, 0.1), 0 2px 8px rgba(28, 28, 28, 0.05)',
  glassLg: '0 12px 40px rgba(28, 28, 28, 0.14), 0 4px 12px rgba(28, 28, 28, 0.06)',
  plaque: '0 4px 24px rgba(28, 28, 28, 0.08), 0 1px 3px rgba(28, 28, 28, 0.04)',
  plaqueLg: '0 12px 40px rgba(28, 28, 28, 0.12), 0 4px 12px rgba(28, 28, 28, 0.06)',
  sheetUp: '0 -12px 40px rgba(28, 28, 28, 0.14)',
  cta: '0 8px 24px rgba(168, 116, 42, 0.28)',
  bronzeCta:
    '0 8px 24px rgba(168, 116, 42, 0.28), inset 0 1px 0 rgba(255, 253, 248, 0.15)',
  goldGlow: '0 0 32px rgba(212, 175, 55, 0.22)',
}

/** Apple / Material minimum comfortable touch target (48×48 CSS px). */
export const tapTargets = {
  minPx: 48,
  min: '3rem',
  comfortable: '3.5rem',
}

export const texture = {
  paperOpacity: 0.035,
}

/** @deprecated Use `palette` — kept for existing imports. */
export const colors = palette

/** Tailwind theme color map derived from the canonical palette. */
export const tailwindColors = {
  ivory: palette.ivory,
  parchment: palette.parchment,
  sand: palette.sand,
  limestone: palette.limestone,
  'warm-white': palette.ivory,
  'deep-slate': palette.deepSlate,
  'soft-slate': palette.softSlate,
  obsidian: palette.obsidian,
  'sky-blue': palette.skyBlue,
  bronze: palette.bronze,
  'bronze-dark': palette.bronzeDark,
  terracotta: palette.bronze,
  gold: palette.gold,
  'gold-dark': palette.goldDark,
  olive: palette.olive,
}
