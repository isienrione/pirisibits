/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'warm-white': '#FFFDF8',
        sand: '#F4E7D0',
        limestone: '#E7D7BD',
        'deep-slate': '#17212B',
        'soft-slate': '#51606F',
        'sky-blue': '#7CB7D8',
        terracotta: '#C8643C',
        gold: '#D9A441',
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
        glass: '0 10px 36px rgba(23, 33, 43, 0.11), 0 2px 10px rgba(23, 33, 43, 0.05)',
        'glass-lg': '0 16px 48px rgba(23, 33, 43, 0.14), 0 4px 14px rgba(23, 33, 43, 0.07)',
        'sheet-up': '0 -14px 44px rgba(23, 33, 43, 0.13)',
        cta: '0 10px 28px rgba(200, 100, 60, 0.26), 0 2px 8px rgba(200, 100, 60, 0.12)',
        glow: '0 0 32px rgba(217, 164, 65, 0.22)',
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
      },
      keyframes: {
        'sheet-enter': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
