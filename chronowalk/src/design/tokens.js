/** ChronoWalk design tokens — JS mirror of tokens.css (no invented hex). */
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
}

/** Literal hex for map/canvas/SVG contexts that cannot resolve CSS variables. */
export const hex = {
  obsidian: '#16130f',
  ink: '#211c15',
  bone: '#f7f1e6',
  warmWhite: '#f5efe3',
  mutedWarm: '#b9af9c',
  ember: '#e8a13c',
  verdigris: '#4f7a6a',
  cityRome: '#e4552e',
  cityLondon: '#3f6e86',
  inkMuted: '#6b6358',
}
