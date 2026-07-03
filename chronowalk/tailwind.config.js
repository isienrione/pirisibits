/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      colors: {
        obsidian: 'var(--obsidian)',
        bone: 'var(--bone)',
        ink: 'var(--ink)',
        'warm-white': 'var(--warm-white)',
        'muted-warm': 'var(--muted-warm)',
        'ink-muted': 'var(--ink-muted)',
        'ink-subtle': 'var(--ink-subtle)',
        'ink-faint': 'var(--ink-faint)',
        ember: 'var(--ember)',
        accent: 'var(--accent)',
        verdigris: 'var(--verdigris)',
        coral: 'var(--coral)',
        laurel: 'var(--laurel)',
        rose: 'var(--rose)',
        tiber: 'var(--tiber)',
        violet: 'var(--violet)',
        'city-rome': 'var(--city-rome)',
        'city-kyoto': 'var(--city-kyoto)',
        'city-paris': 'var(--city-paris)',
        'city-london': 'var(--city-london)',
        'city-cusco': 'var(--city-cusco)',
        'border-daylight': 'var(--border-daylight)',
        'border-immersion': 'var(--border-immersion)',
        'track-daylight': 'var(--track-daylight)',
        // Legacy aliases → LAW tokens (for gradual migration)
        ivory: 'var(--bone)',
        parchment: 'var(--bone)',
        sand: 'var(--bone)',
        limestone: 'var(--track-daylight)',
        'deep-slate': 'var(--ink)',
        'soft-slate': 'var(--ink-muted)',
        bronze: 'var(--accent)',
        terracotta: 'var(--accent)',
        gold: 'var(--ember)',
        olive: 'var(--verdigris)',
        'sky-blue': 'var(--tiber)',
      },
      fontFamily: {
        sans: ['var(--font-ui)'],
        display: ['var(--font-display)'],
        serif: ['var(--font-display)'],
      },
      fontSize: {
        eyebrow: ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.18em', fontWeight: '600' }],
      },
      borderRadius: {
        sheet: 'var(--r-sheet)',
        panel: 'var(--r-card)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        sheet: 'var(--shadow-sheet)',
        plaque: 'var(--shadow-card)',
        'plaque-lg': 'var(--shadow-card)',
        'sheet-up': 'var(--shadow-sheet)',
      },
      spacing: {
        'safe-bottom': 'max(1rem, env(safe-area-inset-bottom))',
        'safe-top': 'max(0.75rem, env(safe-area-inset-top))',
      },
      animation: {
        'sheet-enter': 'sheet-enter 0.5s var(--ease) forwards',
        'splash-dust': 'splash-dust 4.5s ease-in-out infinite',
      },
      keyframes: {
        'sheet-enter': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'splash-dust': {
          '0%, 100%': { transform: 'translateY(0)', opacity: '0.15' },
          '50%': { transform: 'translateY(-10px)', opacity: '0.55' },
        },
      },
    },
  },
  plugins: [],
}
