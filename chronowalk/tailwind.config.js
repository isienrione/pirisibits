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
        transparent: 'transparent',
        current: 'currentColor',
        obsidian: 'var(--obsidian)',
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
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        serif: ['Fraunces', 'Georgia', 'serif'],
      },
      fontSize: {
        eyebrow: ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.18em', fontWeight: '600' }],
      },
      spacing: {
        'safe-bottom': 'max(1rem, env(safe-area-inset-bottom))',
        'safe-top': 'max(0.75rem, env(safe-area-inset-top))',
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
