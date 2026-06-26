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
        glass: '0 8px 32px rgba(23, 33, 43, 0.12), 0 2px 8px rgba(23, 33, 43, 0.06)',
        'glass-lg': '0 12px 40px rgba(23, 33, 43, 0.16), 0 4px 12px rgba(23, 33, 43, 0.08)',
        'sheet-up': '0 -12px 40px rgba(23, 33, 43, 0.14)',
        cta: '0 8px 24px rgba(200, 100, 60, 0.28)',
      },
      spacing: {
        'safe-bottom': 'max(1rem, env(safe-area-inset-bottom))',
        'safe-top': 'max(0.75rem, env(safe-area-inset-top))',
      },
      backdropBlur: {
        glass: '16px',
      },
      transitionTimingFunction: {
        'motion-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      transitionDuration: {
        150: '150ms',
        250: '250ms',
        350: '350ms',
      },
    },
  },
  plugins: [],
}
