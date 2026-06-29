/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  future: {
    // Prevent hover: styles from capturing the first tap on touch screens (iOS Safari double-tap bug).
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      colors: {
        ivory: '#F7F3EC',
        parchment: '#EDE3CF',
        'warm-white': '#F7F3EC',
        sand: '#EDE3CF',
        limestone: '#E2D6BE',
        'deep-slate': '#17212B',
        'soft-slate': '#686E72',
        obsidian: '#1C1C1C',
        'sky-blue': '#7CB7D8',
        bronze: '#A8742A',
        terracotta: '#A8742A',
        gold: '#D4AF37',
        olive: '#7A8B5A',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        serif: ['Fraunces', 'Georgia', 'serif'],
      },
      fontSize: {
        'eyebrow': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.18em', fontWeight: '600' }],
      },
      borderRadius: {
        sheet: '2rem',
        panel: '1.25rem',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(28, 28, 28, 0.1), 0 2px 8px rgba(28, 28, 28, 0.05)',
        'glass-lg': '0 12px 40px rgba(28, 28, 28, 0.14), 0 4px 12px rgba(28, 28, 28, 0.06)',
        plaque: '0 4px 24px rgba(28, 28, 28, 0.08), 0 1px 3px rgba(28, 28, 28, 0.04)',
        'plaque-lg': '0 12px 40px rgba(28, 28, 28, 0.12), 0 4px 12px rgba(28, 28, 28, 0.06)',
        'sheet-up': '0 -12px 40px rgba(28, 28, 28, 0.14)',
        cta: '0 8px 24px rgba(168, 116, 42, 0.28)',
        'bronze-cta': '0 8px 24px rgba(168, 116, 42, 0.28), inset 0 1px 0 rgba(255, 253, 248, 0.15)',
        'gold-glow': '0 0 32px rgba(212, 175, 55, 0.22)',
      },
      spacing: {
        'safe-bottom': 'max(1rem, env(safe-area-inset-bottom))',
        'safe-top': 'max(0.75rem, env(safe-area-inset-top))',
      },
      backdropBlur: {
        glass: '16px',
      },
      animation: {
        'sheet-enter': 'sheet-enter 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'medallion-breathe': 'medallion-breathe 3.2s ease-in-out infinite',
        'splash-dust': 'splash-dust 4.5s ease-in-out infinite',
      },
      keyframes: {
        'sheet-enter': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'medallion-breathe': {
          '0%, 100%': {
            boxShadow: '0 0 0 0 rgba(212, 175, 55, 0.28)',
            opacity: '0.55',
          },
          '50%': {
            boxShadow: '0 0 0 10px rgba(212, 175, 55, 0)',
            opacity: '0.9',
          },
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
