export const ChronoTokens = {
  colors: {
    paperBase: '#F4EFE6',
    cardBase: '#ECE5DA',
    surfaceWhite: '#FAF7F2',

    inkBlack: '#121212',
    inkMuted: '#5C564F',
    inkSubtle: '#8C8479',

    accentRed: '#E54B2D',
    accentYellow: '#E5A93C',
    accentTeal: '#2E8B9A',
    accentPurple: '#5D3A8E',
    accentOrange: '#F0653A',

    borderSoft: '#DDD5C7',
    borderSelected: '#E54B2D',

    mapNight: '#1A2A2E',
    playerDark: '#161412',
    white: '#FFFFFF',
  },

  fonts: {
    titleHeavy: 'BebasNeue_400Regular',
    handwritten: 'Caveat_700Bold',
    body: 'Inter_400Regular',
    bodyMedium: 'Inter_600SemiBold',
    bodyBold: 'Inter_700Bold',
  },

  radii: {
    pill: 999,
    card: 16,
    badge: 6,
  },

  space: {
    screen: 20,
  },
} as const;

export type ChronoColor = (typeof ChronoTokens.colors)[keyof typeof ChronoTokens.colors];
