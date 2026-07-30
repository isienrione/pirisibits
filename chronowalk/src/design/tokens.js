/** ChronoWalk design tokens - JS mirror for Tailwind and inline styles. */

/** Launch-flow explorer palette (ivory/bronze editorial surfaces). */
export const palette = {
  obsidian: '#0B0B0D',
  charcoal: '#1A1A1F',
  warmIvory: '#FAF6EF',
  limestone: '#E9E2D5',
  bronze: '#8B8638',
  gold: '#D4AF37',
  olive: '#6B7A52',
  ivory: '#F7F3EC',
  parchment: '#EDE3CF',
  sand: '#E2D6BE',
  softSlate: '#686E72',
  deepSlate: '#17212B',
  bronzeDark: '#8F6324',
  goldDark: '#B8942F',
  skyBlue: '#7CB7D8',
}

/** Role-based aliases - prefer these in new UI code. */
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

/** DESIGN_LAW CSS variable aliases for v2 components. */
export const colors = {
  obsidian: 'var(--obsidian)',
  ink: 'var(--ink)',
  bone: 'var(--bone)',
  warmWhite: 'var(--warm-white)',
  mutedWarm: 'var(--muted-warm)',
  inkMuted: 'var(--ink-muted)',
  inkSubtle: 'var(--ink-subtle)',
  ember: 'var(--ember)',
  accent: 'var(--accent)',
  verdigris: 'var(--verdigris)',
  cityRome: 'var(--city-rome)',
  cityKyoto: 'var(--city-kyoto)',
  cityParis: 'var(--city-paris)',
  cityLondon: 'var(--city-london)',
  cityCusco: 'var(--city-cusco)',
  borderDaylight: 'var(--border-daylight)',
  borderImmersion: 'var(--border-immersion)',
}

export const fonts = {
  sans: 'var(--font-ui)',
  display: 'var(--font-display)',
}

export const motion = {
  spring: 'var(--ease)',
  springDuration: '0.65s',
}

export const shadows = {
  card: 'var(--shadow-card)',
  sheet: 'var(--shadow-sheet)',
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

/** Literal hex for map/canvas/SVG contexts that cannot resolve CSS variables. */
export const hex = {
  obsidian: '#0B0B0D',
  charcoal: '#1A1A1F',
  warmIvory: '#FAF6EF',
  limestone: '#E9E2D5',
  bronze: '#8B8638',
  gold: '#D4AF37',
  olive: '#6B7A52',
  ink: '#211c15',
  bone: '#FAF6EF',
  warmWhite: '#FAF6EF',
  mutedWarm: '#b9af9c',
  ember: '#e8a13c',
  verdigris: '#4f7a6a',
  cityRome: '#e4552e',
  cityLondon: '#3f6e86',
  inkMuted: '#6b6358',
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

/** Tailwind theme color map derived from the canonical palette. */
export const tailwindColors = {
  obsidian: palette.obsidian,
  charcoal: palette.charcoal,
  'warm-ivory': palette.warmIvory,
  limestone: palette.limestone,
  bronze: palette.bronze,
  gold: palette.gold,
  olive: palette.olive,
  ivory: palette.ivory,
  parchment: palette.parchment,
  sand: palette.sand,
  'warm-white': palette.warmIvory,
  'deep-slate': palette.deepSlate,
  'soft-slate': palette.softSlate,
  'sky-blue': palette.skyBlue,
  'bronze-dark': palette.bronzeDark,
  terracotta: palette.bronze,
  'gold-dark': palette.goldDark,
  ink900: 'var(--ink-900)',
  ink800: 'var(--ink-800)',
  bone: 'var(--bone)',
  warmwhite: 'var(--warm-white)',
  muted: 'var(--muted)',
  ember: 'var(--ember)',
  emberdeep: 'var(--ember-deep)',
  inkonfill: 'var(--ink-on-fill)',
  actarena: 'var(--act-arena)',
  acthill: 'var(--act-hill)',
  actforum: 'var(--act-forum)',
  actmarket: 'var(--act-market)',
  actcity: 'var(--act-city)',
  actriver: 'var(--act-river)',
  actencore: 'var(--act-encore)',
}
