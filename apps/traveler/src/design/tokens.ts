export const color = {
  obsidian: '#16130F',
  ink900: '#211C15',
  ink800: '#3A342A',
  bone: '#F7F1E6',
  warmWhite: '#F5EFE3',
  muted: '#B9AF9C',
  ember: '#E8A13C',
  emberDeep: '#C97F1E',
  inkOnFill: '#2A1206',
  actArena: '#E4552E',
  actHill: '#7C9A5C',
  actForum: '#E8A13C',
  overlay: 'rgba(22, 19, 15, 0.55)',
  overlayHeavy: 'rgba(22, 19, 15, 0.78)',
  hairline: 'rgba(33, 28, 21, 0.14)',
  hairlineOnDark: 'rgba(245, 239, 227, 0.16)',
} as const

export const space = {
  xs: 6,
  s: 10,
  m: 16,
  l: 24,
  xl: 40,
  edge: 22,
} as const

export const type = {
  display: 'Fraunces_600SemiBold',
  displayBold: 'Fraunces_700Bold',
  displayItalic: 'Fraunces_400Regular_Italic',
  displayMedium: 'Fraunces_500Medium',
  ui: 'DMSans_400Regular',
  uiMedium: 'DMSans_500Medium',
  uiSemi: 'DMSans_600SemiBold',
  condensed: 'BarlowCondensed_600SemiBold',
  condensedMedium: 'BarlowCondensed_500Medium',
} as const

export const motion = {
  ui: 200,
  trans: 400,
  cinematic: 1200,
} as const

export const layout = {
  tabBar: 64,
  coverMin: 280,
} as const

export type EditorialDensity = 0 | 1 | 2 | 3
