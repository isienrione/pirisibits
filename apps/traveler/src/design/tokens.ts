export const color = {
  obsidian: '#16130F',
  ink900: '#211C15',
  ink800: '#26221B',
  bone: '#F7F1E6',
  warmWhite: '#F5EFE3',
  muted: '#B9AF9C',
  ember: '#E8A13C',
  emberDeep: '#C97F1E',
  inkOnFill: '#2A1206',
  actArena: '#E4552E',
  actHill: '#7C9A5C',
  actForum: '#E8A13C',
} as const

export const space = {
  xs: 6,
  s: 10,
  m: 16,
  l: 24,
  xl: 40,
  edge: 24,
} as const

export const type = {
  display: 'Fraunces_700Bold',
  displayFallback: 'Georgia',
  ui: 'DMSans_500Medium',
  uiFallback: 'System',
  condensed: 'BarlowCondensed_600SemiBold',
  condensedFallback: 'System',
} as const

export const motion = {
  ui: 200,
  trans: 400,
  cinematic: 1200,
} as const

export type EditorialDensity = 0 | 1 | 2 | 3
