import { motion, shadows, tailwindColors, tapTargets } from './src/design/tokens.js'

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
      colors: tailwindColors,
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        serif: ['Fraunces', 'Georgia', 'serif'],
      },
      fontSize: {
        eyebrow: ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.18em', fontWeight: '600' }],
      },
      borderRadius: {
        card: 'var(--radius-card)',
        sheet: 'var(--radius-sheet)',
      },
      boxShadow: {
        card: shadows.card,
        sheet: shadows.sheet,
        glass: shadows.glass,
        'glass-lg': shadows.glassLg,
        plaque: shadows.plaque,
        'plaque-lg': shadows.plaqueLg,
        'sheet-up': shadows.sheetUp,
        cta: shadows.cta,
        'bronze-cta': shadows.bronzeCta,
        'gold-glow': shadows.goldGlow,
      },
      spacing: {
        'safe-bottom': 'max(1rem, env(safe-area-inset-bottom))',
        'safe-top': 'max(0.75rem, env(safe-area-inset-top))',
        'tap-min': tapTargets.min,
        'tap-comfortable': tapTargets.comfortable,
      },
      backdropBlur: {
        glass: '16px',
      },
      transitionTimingFunction: {
        spring: motion.spring,
      },
      transitionDuration: {
        spring: motion.springDuration,
      },
      animation: {
        'sheet-enter': 'sheet-enter 0.5s cubic-bezier(0.22, 0.8, 0.36, 1) forwards',
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
